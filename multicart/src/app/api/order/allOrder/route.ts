import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import User from "@/models/user.model";

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

    const actor = await User.findById(session.user.id);

    if (!actor) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const filter =
      actor.role === "admin"
        ? {}
        : actor.role === "vendor"
        ? { productVendor: actor._id }
        : { buyer: actor._id };

    const orders = await Order.find(filter)
      .populate("buyer", "name email phone image")
      .populate("productVendor", "name shopName email")
      .populate({
        path: "products.product",
        model: "Product",
        select:
          "title image1 price category stock vendor replacementDays",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Orders fetched successfully", orders },
      { status: 200 }
    );
  } catch (error) {
    console.error("FETCH ORDERS ERROR:", error);

    return NextResponse.json(
      { message: "Unable to fetch orders." },
      { status: 500 }
    );
  }
}
