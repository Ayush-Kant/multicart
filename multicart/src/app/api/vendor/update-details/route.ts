import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { shopName, businessAddress, gstNumber } = await req.json();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        shopName,
        businessAddress,
        gstNumber,
        verificationStatus: "pending",
        requestedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Vendor details submitted successfully",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: `Vendor details update error: ${error}`,
      },
      { status: 500 }
    );
  }
}
