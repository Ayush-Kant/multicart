import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { reverseVendorPayout } from "@/lib/vendor-payout";

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

    const order = await Order.findById(orderId).populate(
      "products.product",
      "replacementDays title"
    );

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
        { message: "You can only return your own orders." },
        { status: 403 }
      );
    }

    if (order.orderStatus === "cancelled") {
      return NextResponse.json(
        { message: "Cancelled order cannot be returned." },
        { status: 400 }
      );
    }

    if (order.orderStatus === "returned") {
      return NextResponse.json(
        { message: "Order has already been returned." },
        { status: 400 }
      );
    }

    if (order.orderStatus !== "delivered") {
      return NextResponse.json(
        { message: "Only delivered orders can be returned." },
        { status: 400 }
      );
    }

    if (!order.deliveryDate) {
      return NextResponse.json(
        { message: "Delivery date is missing, so the return window cannot be checked." },
        { status: 409 }
      );
    }

    const now = Date.now();

    for (const item of order.products as any[]) {
      const replacementDays = Number(
        item.product?.replacementDays ?? 0
      );

      if (replacementDays <= 0) {
        return NextResponse.json(
          {
            message:
              `${item.product?.title || "This product"} is not eligible for returns.`,
          },
          { status: 400 }
        );
      }

      const returnDeadline =
        new Date(order.deliveryDate).getTime() +
        replacementDays * 24 * 60 * 60 * 1000;

      if (now > returnDeadline) {
        return NextResponse.json(
          {
            message:
              `The return window for ${item.product?.title || "this product"} has expired.`,
          },
          { status: 409 }
        );
      }
    }

    let returnedAmount = 0;

    for (const item of order.products) {
      returnedAmount += item.price * item.quantity;
    }

    order.orderStatus = "returned";
    order.returnedAmount = returnedAmount;

    for (const item of order.products as any[]) {
      const productId = item.product?._id || item.product;

      if (productId) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();

    let reversedPayout = null;

    try {
      reversedPayout = await reverseVendorPayout(order._id.toString());
    } catch (payoutError) {
      console.error("Vendor payout reversal error:", payoutError);

      order.payoutStatus = "failed";
      await order.save();
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Order returned successfully. Product amount refund and vendor settlement reversal are simulated.",
        returnedAmount,
        payoutStatus: order.payoutStatus,
        payoutReversed: Boolean(reversedPayout),
        order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Return order error:", error);

    return NextResponse.json(
      { message: "Failed to process the return." },
      { status: 500 }
    );
  }
}
