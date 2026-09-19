import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId is required" },
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

    // ✅ ALLOWED: pending / confirmed
    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { message: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
