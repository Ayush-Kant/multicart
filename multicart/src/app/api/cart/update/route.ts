import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

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

    const { productId, quantity } = await req.json();
    const requestedQuantity = Number(quantity);

    if (
      !productId ||
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return NextResponse.json(
        { message: "Quantity must be a positive whole number." },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);

    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "Cart not found" },
        { status: 404 }
      );
    }

    const item = user.cart.find(
      (cartItem: any) =>
        cartItem.product.toString() === productId.toString()
    );

    if (!item) {
      return NextResponse.json(
        { message: "Item not found in cart" },
        { status: 404 }
      );
    }

    const product = await Product.findById(productId)
      .select("title stock verificationStatus isActive")
      .lean();

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    if (product.verificationStatus !== "approved") {
      return NextResponse.json(
        { message: "This product is no longer available." },
        { status: 409 }
      );
    }

    if (requestedQuantity > product.stock) {
      return NextResponse.json(
        {
          message: `Only ${product.stock} unit(s) of ${product.title} are available.`,
        },
        { status: 409 }
      );
    }

    item.quantity = requestedQuantity;

    await user.save();

    return NextResponse.json(
      { message: "Quantity updated", cart: user.cart },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE CART ERROR:", error);

    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}
