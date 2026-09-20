import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { role, phone } = await req.json();

    if (!["user", "vendor"].includes(role)) {
      return NextResponse.json(
        {
          message:
            "Invalid role. You can select only Customer or Vendor.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone = String(phone ?? "").trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json(
        {
          message:
            "Phone number must contain exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    user.role = role;
    user.phone = normalizedPhone;

    if (role === "vendor") {
      user.verificationStatus = "pending";
      user.isApproved = false;
      user.requestedAt = undefined;
      user.approvedAt = undefined;
      user.rejectedReason = undefined;
    }

    await user.save();

    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Edit role and mobile error:", error);

    return NextResponse.json(
      { message: "Unable to update your account role and phone." },
      { status: 500 }
    );
  }
}
