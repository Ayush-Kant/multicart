import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Product from "@/models/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const shop = searchParams.get("shop"); // vendor id
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");

    /* ✅ BASE FILTER (ONLY VISIBLE PRODUCTS) */
    const filter: any = {
      isActive: true,
      verificationStatus: "approved",
    };

    /* ✅ TEXT SEARCH (TITLE + DESCRIPTION) */
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ];
    }

    /* ✅ CATEGORY FILTER */
    if (category && category !== "all") {
      filter.category = category;
    }

    /* ✅ SHOP FILTER */
    if (shop && shop !== "all") {
      filter.vendor = shop;
    }

    /* ✅ PRICE FILTER */
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    /* ✅ RATING FILTER (AGGREGATE BASED) */
    if (minRating) {
      filter["reviews.rating"] = { $gte: Number(minRating) };
    }

    /* ✅ FINAL DB QUERY */
    const products = await Product.find(filter)
      .populate("vendor", "shopName image")
      .populate("reviews.user", "name image")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SEARCH API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
