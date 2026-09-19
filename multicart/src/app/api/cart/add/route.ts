import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json({ message: "Product ID required" }, { status: 400 });
    }

    // ✅ USER
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ ENSURE CART EXISTS
    if (!user.cart) {
      user.cart = [];
    }

    // ✅ PRODUCT
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (!product.isActive || product.verificationStatus !== "approved") {
      return NextResponse.json({ message: "Product not available" }, { status: 400 });
    }

    // ✅ ✅ FIXED EXISTING ITEM CHECK (NO TS ERROR)
    const existingItem = user.cart.find(
      (item: any) => item.product?.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({
        product: product._id,
        quantity,
      });
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Product added to cart ✅",
        cart: user.cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    return NextResponse.json(
      { message: "Add to cart failed" },
      { status: 500 }
    );
  }
}
