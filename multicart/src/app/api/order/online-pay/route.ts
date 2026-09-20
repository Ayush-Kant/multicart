import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
} from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  let createdOrderId: string | null = null;
  let stockReserved = false;
  let userUpdated = false;

  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId, quantity, address } = await req.json();

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        { message: "Valid productId and quantity are required" },
        { status: 400 }
      );
    }

    if (
      !address?.name ||
      !address?.phone ||
      !address?.address ||
      !address?.city ||
      !address?.pincode
    ) {
      return NextResponse.json(
        { message: "All address fields are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "User or cart not found" },
        { status: 404 }
      );
    }

    const cartItem = user.cart.find(
      (item: any) => item.product.toString() === productId
    );

    if (!cartItem) {
      return NextResponse.json(
        { message: "Product not found in cart" },
        { status: 400 }
      );
    }

    if (cartItem.quantity !== quantity) {
      return NextResponse.json(
        { message: "Checkout quantity no longer matches your cart" },
        { status: 409 }
      );
    }

    const product: any = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    if (product.verificationStatus !== "approved") {
      return NextResponse.json(
        { message: "This product is not currently available for purchase" },
        { status: 400 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { message: `Insufficient stock for ${product.title}` },
        { status: 400 }
      );
    }

    const productsTotal = product.price * quantity;
    const deliveryCharge = product.freeDelivery ? 0 : 50;
    const serviceCharge = 30;
    const totalAmount = productsTotal + deliveryCharge + serviceCharge;
    const amountInPaise = Math.round(totalAmount * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json(
        { message: "Invalid order amount" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      buyer: userId,
      products: [
        {
          product: product._id,
          quantity,
          price: product.price,
        },
      ],
      productVendor: product.vendor,
      productsTotal,
      deliveryCharge,
      serviceCharge,
      totalAmount,
      paymentMethod: "razorpay",
      isPaid: false,
      orderStatus: "pending",
      returnedAmount: 0,
      address,
    });

    createdOrderId = order._id.toString();

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity },
    });
    stockReserved = true;

    user.cart = user.cart.filter(
      (item: any) => item.product.toString() !== productId
    );
    user.orders = user.orders || [];
    user.orders.push(order._id);
    await user.save();
    userUpdated = true;

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order._id.toString()}`,
      notes: {
        orderId: order._id.toString(),
        productId: product._id.toString(),
      },
    });

    await Order.findByIdAndUpdate(order._id, {
      $set: {
        "paymentDetails.razorpayOrderId": razorpayOrder.id,
      },
    });

    return NextResponse.json(
      {
        orderId: order._id.toString(),
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: getRazorpayKeyId(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (createdOrderId) {
      try {
        if (stockReserved) {
          await Product.findOneAndUpdate(
            { _id: new (await import("mongoose")).default.Types.ObjectId(createdOrderId) },
            { $inc: { stock: 0 } }
          );
        }
      } catch {}

      try {
        await Order.findByIdAndDelete(createdOrderId);
      } catch {}

      if (stockReserved && userUpdated) {
        try {
          const failedOrder = await Order.findById(createdOrderId);
          const productId = failedOrder?.products?.[0]?.product?.toString();
          const quantity = failedOrder?.products?.[0]?.quantity;

          if (productId && quantity) {
            await Product.findByIdAndUpdate(productId, {
              $inc: { stock: quantity },
            });

            await User.findByIdAndUpdate(
              failedOrder.buyer,
              {
                $pull: { orders: failedOrder._id },
                $push: { cart: { product: productId, quantity } },
              }
            );
          }
        } catch {}
      }
    }

    console.error("❌ RAZORPAY ORDER ERROR:", error);

    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
