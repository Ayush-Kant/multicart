import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    // ✅ Check Admin Session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can approve vendors" },
        { status: 403 }
      );
    }

    // ✅ Body Data
    const { vendorId, status, rejectedReason } = await req.json();

    if (!vendorId || !status) {
      return NextResponse.json(
        { message: "vendorId and status are required" },
        { status: 400 }
      );
    }

    // ✅ Find Vendor
    const vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    // ✅ UPDATE LOGIC
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { message: "Status must be approved or rejected." },
        { status: 400 }
      );
    }

    if (status === "approved") {
      const demoPayoutMode = process.env.PAYOUT_DEMO_MODE !== "false";

      if (
        !demoPayoutMode &&
        vendor.payoutVerification?.status !== "verified"
      ) {
        return NextResponse.json(
          {
            message:
              "Vendor payout details must be verified before approval.",
          },
          { status: 409 }
        );
      }

      vendor.verificationStatus = "approved";
      vendor.isApproved = true;
      vendor.approvedAt = new Date();
      vendor.rejectedReason = undefined;
    }

    if (status === "rejected") {
      vendor.verificationStatus = "rejected";
      vendor.isApproved = false;
      vendor.rejectedReason = rejectedReason || "Rejected by Admin";
    }

    await vendor.save();

    return NextResponse.json(
      { message: "Vendor status updated", vendor },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Vendor approval error", error },
      { status: 500 }
    );
  }
}
