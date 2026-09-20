import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { fetchRazorpayPayment } from "@/lib/razorpay";
import { settlePaidOrder } from "@/lib/vendor-payout";

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
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      checkoutGroupId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !checkoutGroupId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          message:
            "Incomplete Razorpay cart payment verification data",
        },
        { status: 400 }
      );
    }

    const orders = await Order.find({
      buyer: session.user.id,
      checkoutGroupId,
      paymentMethod: "razorpay",
    });

    if (!orders.length) {
      return NextResponse.json(
        { message: "Cart checkout orders were not found." },
        { status: 404 }
      );
    }

    const storedRazorpayOrderId =
      orders[0].paymentDetails?.razorpayOrderId;

    if (!storedRazorpayOrderId) {
      return NextResponse.json(
        { message: "Razorpay cart order reference is missing." },
        { status: 500 }
      );
    }

    if (storedRazorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { message: "Razorpay order mismatch." },
        { status: 400 }
      );
    }

    const paymentSignatureSecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!paymentSignatureSecret) {
      return NextResponse.json(
        {
          message:
            "Razorpay server credentials are not configured.",
        },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", paymentSignatureSecret)
      .update(
        storedRazorpayOrderId +
          "|" +
          razorpay_payment_id
      )
      .digest("hex");

    if (
      !safeEqual(
        generatedSignature,
        razorpay_signature
      )
    ) {
      return NextResponse.json(
        { message: "Invalid Razorpay payment signature." },
        { status: 400 }
      );
    }

    const payment = await fetchRazorpayPayment(
      razorpay_payment_id
    );

    const expectedAmount = Math.round(
      orders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
      ) * 100
    );

    if (
      payment.order_id !== storedRazorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return NextResponse.json(
        {
          message:
            "Payment details do not match the cart order total.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          message:
            "Payment is not captured yet (status: " +
            payment.status +
            ")",
        },
        { status: 409 }
      );
    }

    const payouts = [];

    for (const order of orders) {
      if (!order.isPaid) {
        order.isPaid = true;
        order.paymentDetails = {
          razorpayOrderId: storedRazorpayOrderId,
          razorpayPaymentId: razorpay_payment_id,
        };

        await order.save();
      }

      const payout = await settlePaidOrder(
        order._id.toString()
      );

      if (payout) {
        payouts.push(payout);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Cart payment verified and all vendor settlements recorded.",
      checkoutGroupId,
      orderIds: orders.map((order) => order._id),
      payoutIds: payouts.map((payout) => payout._id),
    });
  } catch (error: any) {
    console.error(
      "❌ CART RAZORPAY VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error.message ||
          "Cart payment verification failed.",
      },
      { status: 500 }
    );
  }
}
