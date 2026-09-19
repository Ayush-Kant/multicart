import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { orderId, otp } = await req.json();

    if (!orderId || !otp) {
      return NextResponse.json(
        { message: "orderId and otp required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    if (
      order.deliveryOtp !== otp ||
      !order.otpExpiresAt ||
      order.otpExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // ✅ SUCCESS → MARK DELIVERED
    order.orderStatus = "delivered";
    order.isPaid = "true"
    order.deliveryDate = new Date(); // ⭐ DELIVERY DATE SET
    order.deliveryOtp = undefined;
    order.otpExpiresAt = undefined;

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order delivered successfully",
      deliveryDate: order.deliveryDate,
      order,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
