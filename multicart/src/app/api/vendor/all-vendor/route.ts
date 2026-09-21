import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
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
        { message: "This endpoint is restricted." },
        { status: 403 }
      );
    }

    const vendors = await User.find({ role: "vendor" })
      .populate("vendorProducts")
      .sort({ createdAt: -1 });

    return NextResponse.json(vendors, { status: 200 });
  } catch (error) {
    console.error("GET ALL VENDORS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vendors",
      },
      { status: 500 }
    );
  }
}
