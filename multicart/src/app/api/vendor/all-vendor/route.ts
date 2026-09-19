import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();

    // ✅ sirf vendors fetch honge
    const vendors = await User.find({ role: "vendor" }).populate("vendorProducts").sort({ createdAt: -1 });

    return NextResponse.json(
        vendors,
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vendors",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
