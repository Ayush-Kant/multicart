import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------
    // ✅ FETCH ALL ORDERS (NO FILTER)
    // ------------------------------------------------------------
    const orders = await Order.find()
      .populate("buyer", "name email phone image")
      .populate("productVendor", "name shopName email")
      .populate({
        path: "products.product",
        model: "Product",
        select: "title image1 price category stock vendor  replacementDays", 
        // vendor populate nahi hoga
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Orders fetched successfully", orders },
      { status: 200 }
    );

  } catch (error) {
    console.error("FETCH ALL ORDERS ERROR:", error);
    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
