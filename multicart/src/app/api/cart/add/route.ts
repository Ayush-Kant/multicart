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

    if (product.verificationStatus !== "approved") {
      return NextResponse.json(
        {
          message:
            `Product cannot be added because it is not approved. Current status: ${product.verificationStatus || "pending"}.`,
        },
        { status: 400 }
      );
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return NextResponse.json(
        { message: "Quantity must be a positive whole number." },
        { status: 400 }
      );
    }

    const currentQuantity =
      user.cart.find(
        (item: any) => item.product?.toString() === productId.toString()
      )?.quantity || 0;

    if (currentQuantity + requestedQuantity > product.stock) {
      return NextResponse.json(
        {
          message: `Only ${product.stock} unit(s) of ${product.title} are available.`,
        },
        { status: 409 }
      );
    }

    /*
     * Existing products created before the approval flow can have
     * isActive=false even after an admin has approved them. Approval is the
     * actual marketplace availability gate in this application, so repair
     * that legacy state here instead of rejecting a valid approved product.
     */
    if (product.isActive !== true) {
      product.isActive = true;
      await product.save();
    }

    // ✅ ✅ FIXED EXISTING ITEM CHECK (NO TS ERROR)
    const existingItem = user.cart.find(
      (item: any) => item.product?.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += requestedQuantity;
    } else {
      user.cart.push({
        product: product._id,
        quantity: requestedQuantity,
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
