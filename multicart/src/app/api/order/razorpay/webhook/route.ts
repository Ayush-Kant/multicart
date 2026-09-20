import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { settlePaidOrder } from "@/lib/vendor-payout";
import { finalizePaidOrdersForBuyer } from "@/lib/cart-checkout";

const safeEqual = (expected: string, actual: string) => {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { message: "Webhook authentication failed" },
      { status: 401 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!safeEqual(expectedSignature, signature)) {
    return NextResponse.json(
      { message: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    const event = JSON.parse(rawBody);

    if (
      event.event === "order.paid" ||
      event.event === "payment.captured"
    ) {
      const payment = event.payload?.payment?.entity;

      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;
      const amount = payment?.amount;
      const currency = payment?.currency;
      const status = payment?.status;

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !Number.isInteger(amount) ||
        currency !== "INR" ||
        status !== "captured"
      ) {
        return NextResponse.json(
          { message: "Invalid payment webhook payload" },
          { status: 400 }
        );
      }

      await connectDb();

      const orders = await Order.find({
        paymentMethod: "razorpay",
        "paymentDetails.razorpayOrderId": razorpayOrderId,
      });

      if (!orders.length) {
        return NextResponse.json(
          { received: true, ignored: true },
          { status: 200 }
        );
      }

      const expectedAmount = Math.round(
        orders.reduce(
          (sum, order) => sum + Number(order.totalAmount || 0),
          0
        ) * 100
      );

      if (amount !== expectedAmount) {
        console.error("❌ Razorpay webhook amount mismatch", {
          razorpayOrderId,
          expectedAmount,
          receivedAmount: amount,
          orderIds: orders.map((order) => order._id.toString()),
        });

        return NextResponse.json(
          { message: "Payment amount mismatch" },
          { status: 400 }
        );
      }

      const payouts = [];

      for (const order of orders) {
        order.isPaid = true;
        order.paymentDetails = {
          razorpayOrderId,
          razorpayPaymentId,
        };

        await order.save();

        const payout = await settlePaidOrder(
          order._id.toString()
        );

        if (payout) {
          payouts.push(payout);
        }
      }

      const buyerId = String(orders[0].buyer);

      await finalizePaidOrdersForBuyer(
        buyerId,
        orders
      );

      return NextResponse.json(
        {
          received: true,
          orderIds: orders.map((order) => order._id),
          payoutIds: payouts.map((payout) => payout._id),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ RAZORPAY WEBHOOK ERROR:", error);

    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
