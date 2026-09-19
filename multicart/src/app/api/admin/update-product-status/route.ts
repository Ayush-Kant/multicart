import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    // ✅ Check Admin Session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can approve products" },
        { status: 403 }
      );
    }

    // ✅ Body Data
    const { productId, status, rejectedReason } = await req.json();

    if (!productId || !status) {
      return NextResponse.json(
        { message: "productId and status are required" },
        { status: 400 }
      );
    }

    // ✅ Find Product
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ UPDATE LOGIC (SAME AS VENDOR)
    if (status === "approved") {
      product.verificationStatus = "approved";
               
      product.approvedAt = new Date();
      product.rejectedReason = undefined;
    }

    if (status === "rejected") {
      product.verificationStatus = "rejected";
                  
      product.rejectedReason =
        rejectedReason || "Rejected by Admin";
    }

    await product.save();

    return NextResponse.json(
      { message: "Product status updated", product },
      { status: 200 }
    );
  } catch (error) {
    console.error("PRODUCT APPROVAL ERROR:", error);
    return NextResponse.json(
      { message: "Product approval error", error },
      { status: 500 }
    );
  }
}
