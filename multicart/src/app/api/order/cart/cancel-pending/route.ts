import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { cancelPendingCartCheckout } from "@/lib/cart-checkout";

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

    const { checkoutGroupId } = await req.json();

    if (!checkoutGroupId) {
      return NextResponse.json(
        { message: "checkoutGroupId is required." },
        { status: 400 }
      );
    }

    const result = await cancelPendingCartCheckout(
      session.user.id,
      String(checkoutGroupId)
    );

    return NextResponse.json({
      success: true,
      message:
        result.cancelledOrders > 0
          ? "Pending payment checkout was cancelled and reserved stock was restored."
          : "No pending payment checkout needed cancellation.",
      ...result,
    });
  } catch (error: any) {
    console.error("❌ CANCEL CART CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        message:
          error.message ||
          "Unable to cancel the pending cart checkout.",
      },
      { status: 500 }
    );
  }
}
