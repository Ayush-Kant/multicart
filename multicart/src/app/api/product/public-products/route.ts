import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Product from "@/models/product.model";

export async function GET() {
  try {
    await connectDb();

    const products = await Product.find({
      isActive: true,
      verificationStatus: "approved",
    })
      .select(
        "title description price stock isStockAvailable image1 image2 image3 image4 category isWearable sizes vendor replacementDays freeDelivery warranty payOnDelivery detailsPoints reviews createdAt updatedAt"
      )
      .populate("vendor", "name image shopName")
      .populate("reviews.user", "name image")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUBLIC PRODUCTS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load the product catalog." },
      { status: 500 }
    );
  }
}
