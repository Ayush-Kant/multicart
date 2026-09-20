import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { sendDeliveryOtpEmail } from "@/lib/mailer";

const allowedStatuses = ["confirmed", "shipped", "delivered"];

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
        { message: "Only the order vendor or an admin can update order status." },
        { status: 403 }
      );
    }

    const { orderId, status } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId is required." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          message:
            "Invalid status. Allowed values are confirmed, shipped and delivered.",
        },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId).populate(
      "buyer",
      "name email"
    );

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
        { message: "You can only update orders belonging to your store." },
        { status: 403 }
      );
    }

    if (["cancelled", "returned", "delivered"].includes(order.orderStatus)) {
      return NextResponse.json(
        {
          message: `Order is already ${order.orderStatus} and cannot be moved to ${status}.`,
        },
        { status: 409 }
      );
    }

    if (status === "confirmed" || status === "shipped") {
      order.orderStatus = status;
      await order.save();

      return NextResponse.json({
        message: `Order marked as ${status}.`,
      });
    }

    const email = order.buyer?.email || undefined;

    if (!email) {
      return NextResponse.json(
        { message: "Buyer email is not available for delivery verification." },
        { status: 400 }
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await sendDeliveryOtpEmail(email, otp);

    order.deliveryOtp = otp;
    order.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await order.save();

    return NextResponse.json({
      message: "Delivery OTP sent to the buyer's email.",
    });
  } catch (err) {
    console.error("Update order status error:", err);

    return NextResponse.json(
      { message: "Unable to update order status." },
      { status: 500 }
    );
  }
}
