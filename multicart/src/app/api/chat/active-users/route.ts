import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";

export async function GET() {
  await connectDb();
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await User.findById(session.user.id);
  if (!currentUser) return NextResponse.json([]);

  /* ================= USER ================= */
  if (currentUser.role === "user") {
    const orders = await Order.find({
      buyer: currentUser._id,
    }).populate("productVendor", "name image shopName role");

    const vendorMap = new Map<string, any>();

    orders.forEach((order: any) => {
      if (order.productVendor) {
        vendorMap.set(
          String(order.productVendor._id),
          order.productVendor
        );
      }
    });

    return NextResponse.json([...vendorMap.values()]);
  }

  /* ================= VENDOR ================= */
  if (currentUser.role === "vendor") {
    const orders = await Order.find({
      productVendor: currentUser._id,
    }).populate("buyer", "name image role");

    const buyersMap = new Map<string, any>();

    orders.forEach((order: any) => {
      if (order.buyer) {
        buyersMap.set(String(order.buyer._id), order.buyer);
      }
    });

    // ✅ ADMIN ALWAYS INCLUDED
    const admin = await User.findOne({ role: "admin" }).select(
      "name image role"
    );

    return NextResponse.json(
      admin ? [admin, ...buyersMap.values()] : [...buyersMap.values()]
    );
  }

  /* ================= ADMIN ================= */
  if (currentUser.role === "admin") {
    const vendors = await User.find({ role: "vendor" }).select(
      "name image shopName role"
    );

    return NextResponse.json(vendors);
  }

  return NextResponse.json([]);
}
