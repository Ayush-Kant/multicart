import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "Cart is empty" },
        { status: 404 }
      );
    }

    user.cart = user.cart.filter(
      (item: any) => item.product.toString() !== productId.toString()
    );

    await user.save();

    return NextResponse.json(
      { message: "Product removed from cart ✅", cart: user.cart },
      { status: 200 }
    );
  } catch (error) {
    console.error("REMOVE CART ERROR:", error);
    return NextResponse.json(
      { message: "Remove from cart failed" },
      { status: 500 }
    );
  }
}
