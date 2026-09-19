import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import Product from "@/models/product.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    // 🔐 AUTH CHECK
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 📦 FORM DATA
    const formData = await req.formData();

    const productId = formData.get("productId") as string;
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment") as string;
    const file = formData.get("image") as File | null;

    // ✅ VALIDATION
    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { message: "Comment is required" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // 🖼️ SIMPLE CLOUDINARY UPLOAD (OPTIONAL)
    let imageUrl;

    if (file) {
      imageUrl = await uploadOnCloudinary(file);
    }

    // ⭐ ADD REVIEW
    product.reviews.push({
      user: userId,
      rating,
      comment,
      image: imageUrl,
    });

    await product.save();

    return NextResponse.json(
      { message: "Review added successfully" },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("ADD REVIEW ERROR:", error.message);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
