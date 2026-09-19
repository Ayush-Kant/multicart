import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Product from "@/models/product.model";
import { auth } from "@/auth";

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

    const { productId, isActive } = await req.json();

    if (!productId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "productId and isActive are required" },
        { status: 400 }
      );
    }

    // ✅ Find product
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ Only owner vendor can update
    if (product.vendor.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "You are not allowed to update this product" },
        { status: 403 }
      );
    }

    // ✅ Only approved products can be active
    if (isActive === true && product.verificationStatus !== "approved") {
      return NextResponse.json(
        { message: "Only approved products can be activated" },
        { status: 400 }
      );
    }

    product.isActive = isActive;
    await product.save();

    return NextResponse.json(
      { message: "Product status updated ✅", product },
      { status: 200 }
    );

  } catch (error) {
    console.log("UPDATE PRODUCT STATUS ERROR:", error);
    return NextResponse.json(
      { message: "Server Error", error },
      { status: 500 }
    );
  }
}
