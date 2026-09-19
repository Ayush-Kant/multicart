import { NextRequest, NextResponse } from "next/server";
import uploadOnCloudinary from "@/lib/cloudinary";
import Product from "@/models/product.model";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import mongoose from "mongoose";

export async function PUT(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    // ✅ ✅ PRODUCT ID FROM FRONTEND
    const productId = formData.get("productId") as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid product id" },
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

    // ✅ ✅ ONLY SAME VENDOR CAN EDIT
    if (String(product.vendor) !== String(session.user.id)) {
      return NextResponse.json(
        { message: "Not allowed to edit this product" },
        { status: 403 }
      );
    }

    // ✅ BASIC FIELDS
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const category = formData.get("category") as string;

    // ✅ Wearable
    const isWearable = formData.get("isWearable") === "true";
    const sizes = formData.getAll("sizes");

    // ✅ Policies
    const replacementDays = Number(
      formData.get("replacementDays") || 0
    );
    const freeDelivery = formData.get("freeDelivery") === "true";
    const warranty =
      (formData.get("warranty") as string) || "No Warranty";
    const payOnDelivery =
      formData.get("payOnDelivery") === "true";

    // ✅ Details
    const detailsPoints = formData.getAll("detailsPoints");

    // ✅ Images (optional)
    const img1 = formData.get("image1") as Blob | null;
    const img2 = formData.get("image2") as Blob | null;
    const img3 = formData.get("image3") as Blob | null;
    const img4 = formData.get("image4") as Blob | null;

    let image1 = product.image1;
    let image2 = product.image2;
    let image3 = product.image3;
    let image4 = product.image4;

    if (img1) image1 = await uploadOnCloudinary(img1);
    if (img2) image2 = await uploadOnCloudinary(img2);
    if (img3) image3 = await uploadOnCloudinary(img3);
    if (img4) image4 = await uploadOnCloudinary(img4);

    // ✅ Wearable validation
    if (isWearable && sizes.length === 0) {
      return NextResponse.json(
        { message: "Sizes are required for wearable product" },
        { status: 400 }
      );
    }

    // ✅ ✅ ✅ UPDATE PRODUCT + RESET VERIFICATION
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title,
        description,
        price,
        stock,
        isStockAvailable: stock > 0,

        image1,
        image2,
        image3,
        image4,

        category,

        isWearable,
        sizes: isWearable ? sizes : [],

        replacementDays,
        freeDelivery,
        warranty,
        payOnDelivery,

        detailsPoints,

        // ✅ IMPORTANT RESET
        verificationStatus: "pending",
        isActive: false,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        message:
          "Product updated & sent for re-verification ✅",
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("EDIT PRODUCT ERROR:", error);
    return NextResponse.json(
      { message: "Server Error", error },
      { status: 500 }
    );
  }
}
