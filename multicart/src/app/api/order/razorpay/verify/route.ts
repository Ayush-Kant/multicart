import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { fetchRazorpayPayment } from "@/lib/razorpay";

const safeEqual = (expected: string, actual: string) => {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
};

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { message: "Incomplete Razorpay payment verification data" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({
      _id: orderId,
      buyer: session.user.id,
      paymentMethod: "razorpay",
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.isPaid) {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        orderId: order._id,
      });
    }

    if (order.orderStatus === "cancelled") {
      return NextResponse.json(
        { message: "This order has already been cancelled" },
        { status: 409 }
      );
    }

    const storedRazorpayOrderId =
      order.paymentDetails?.razorpayOrderId;

    if (!storedRazorpayOrderId) {
      return NextResponse.json(
        { message: "Razorpay order reference is missing" },
        { status: 500 }
      );
    }

    if (storedRazorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { message: "Razorpay order mismatch" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { message: "Razorpay server credentials are not configured" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${storedRazorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeEqual(generatedSignature, razorpay_signature)) {
      return NextResponse.json(
        { message: "Invalid Razorpay payment signature" },
        { status: 400 }
      );
    }

    const payment = await fetchRazorpayPayment(razorpay_payment_id);

    const expectedAmount = Math.round(order.totalAmount * 100);

    if (
      payment.order_id !== storedRazorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return NextResponse.json(
        { message: "Payment details do not match the order" },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        { message: `Payment is not captured yet (status: ${payment.status})` },
        { status: 409 }
      );
    }

    order.isPaid = true;
    order.paymentDetails = {
      razorpayOrderId: storedRazorpayOrderId,
      razorpayPaymentId: razorpay_payment_id,
    };

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      orderId: order._id,
    });
  } catch (error: any) {
    console.error("❌ RAZORPAY VERIFY ERROR:", error);

    return NextResponse.json(
      { message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
