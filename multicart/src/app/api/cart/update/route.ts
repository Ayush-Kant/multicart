import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { productId, quantity } = await req.json();

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { message: "Invalid data" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email: session.user.email,
    });

    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "Cart not found" },
        { status: 404 }
      );
    }

    const item = user.cart.find(
      (i: any) =>
        i.product.toString() === productId.toString()
    );

    if (!item) {
      return NextResponse.json(
        { message: "Item not found in cart" },
        { status: 404 }
      );
    }

    item.quantity = quantity;

    await user.save();

    return NextResponse.json(
      { message: "Quantity updated", cart: user.cart },
      { status: 200 }
    );
  } catch (error) {
    console.log("UPDATE CART ERROR:", error);
    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}
