import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";

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

    if (!actor) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId is required." },
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
      actor.role !== "admin" &&
      String(order.buyer) !== String(actor._id)
    ) {
      return NextResponse.json(
        { message: "You can only cancel your own orders." },
        { status: 403 }
      );
    }

    if (order.orderStatus === "cancelled") {
      return NextResponse.json(
        { message: "Order is already cancelled." },
        { status: 409 }
      );
    }

    if (["delivered", "returned", "shipped"].includes(order.orderStatus)) {
      return NextResponse.json(
        {
          message:
            "Only pending or confirmed orders can be cancelled. Delivered orders must use the return flow.",
        },
        { status: 409 }
      );
    }

    if (order.isPaid && order.paymentMethod === "razorpay") {
      return NextResponse.json(
        {
          message:
            "Paid online orders cannot be cancelled from this flow. Use the return/refund flow after delivery.",
        },
        { status: 409 }
      );
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.payoutStatus = "pending";

    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully and stock was restored.",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return NextResponse.json(
      { message: "Failed to cancel order." },
      { status: 500 }
    );
  }
}
