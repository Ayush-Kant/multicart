import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { settlePaidOrder } from "@/lib/vendor-payout";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const actor = await User.findById(session.user.id);

    if (!actor || !["vendor", "admin"].includes(actor.role)) {
      return NextResponse.json(
        { message: "Only the order vendor or an admin can verify delivery." },
        { status: 403 }
      );
    }

    const { orderId, otp } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId is required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(String(otp ?? ""))) {
      return NextResponse.json(
        { message: "Delivery OTP must contain exactly 4 digits." },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    if (
      actor.role === "vendor" &&
      String(order.productVendor) !== String(actor._id)
    ) {
      return NextResponse.json(
        { message: "You can only verify delivery for your own orders." },
        { status: 403 }
      );
    }

    if (order.orderStatus === "cancelled") {
      return NextResponse.json(
        { message: "Cancelled orders cannot be delivered." },
        { status: 409 }
      );
    }

    if (order.orderStatus === "returned") {
      return NextResponse.json(
        { message: "Returned orders cannot be delivered." },
        { status: 409 }
      );
    }

    if (order.orderStatus === "delivered" && !order.deliveryOtp) {
      return NextResponse.json({
        success: true,
        message: "Order is already delivered.",
        deliveryDate: order.deliveryDate,
        payoutStatus: order.payoutStatus,
      });
    }

    if (
      order.deliveryOtp !== String(otp) ||
      !order.otpExpiresAt ||
      order.otpExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { message: "Invalid or expired delivery OTP." },
        { status: 400 }
      );
    }

    order.orderStatus = "delivered";
    order.isPaid = true;
    order.deliveryDate = new Date();
    order.deliveryOtp = undefined;
    order.otpExpiresAt = undefined;

    await order.save();

    let payout = null;

    try {
      payout = await settlePaidOrder(order._id.toString());
    } catch (payoutError) {
      console.error("Vendor payout settlement error:", payoutError);
    }

    return NextResponse.json({
      success: true,
      message: "Order delivered and vendor settlement recorded.",
      deliveryDate: order.deliveryDate,
      payoutId: payout?._id || order.payoutId || null,
      payoutStatus:
        payout?.status || order.payoutStatus || "pending",
      order,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      { message: "Failed to verify delivery OTP." },
      { status: 500 }
    );
  }
}
