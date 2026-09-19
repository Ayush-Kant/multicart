import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { shopName, businessAddress, gstNumber } = await req.json();

    if (!shopName || !businessAddress || !gstNumber) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Vendor ko dobara pending me daalna
    const updatedVendor = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        shopName,
        businessAddress,
        gstNumber,
        verificationStatus: "pending",
        rejectedReason: null,
        requestedAt: new Date(),
        isApproved: false,
      },
      { new: true }
    );

    if (!updatedVendor) {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Verification request sent again",
        vendor: updatedVendor,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Verify Again Error:", error);
    return NextResponse.json(
      { message: "Server Error", error },
      { status: 500 }
    );
  }
}
