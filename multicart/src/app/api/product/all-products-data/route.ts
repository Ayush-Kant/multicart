import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Product from "@/models/product.model";
import User from "@/models/user.model";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    await connectDb();

    const actor = await User.findById(session.user.id)
      .select("role")
      .lean();

    if (!actor || !["admin", "vendor"].includes(actor.role)) {
      return NextResponse.json(
        { message: "This catalog endpoint is restricted." },
        { status: 403 }
      );
    }

    const products = await Product.find()
      .populate("vendor", "name email shopName")
      .populate({
        path: "reviews.user",
        select: "name email image",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("GET ALL PRODUCTS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
