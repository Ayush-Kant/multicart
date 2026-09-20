import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import {
  normalizeVendorOnboardingInput,
  validateVendorOnboardingInput,
} from "@/lib/vendor-validation";
import { verifyVendorPayoutDetails } from "@/lib/vendor-payout";
import { NextRequest, NextResponse } from "next/server";

const maskAccountNumber = (accountNumber?: string) =>
  accountNumber ? `•••• ${accountNumber.slice(-4)}` : "";

const maskPanNumber = (panNumber?: string) =>
  panNumber
    ? `${panNumber.slice(0, 2)}••••••${panNumber.slice(-2)}`
    : "";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "vendor") {
      return NextResponse.json(
        { message: "Only vendor accounts can submit vendor details." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const input = normalizeVendorOnboardingInput(body);

    const fieldErrors = validateVendorOnboardingInput(input);

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          message: "Please correct the highlighted vendor details.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const payoutVerification = verifyVendorPayoutDetails(input);

    if (!payoutVerification.verified) {
      return NextResponse.json(
        {
          message:
            payoutVerification.reason ||
            "Payout account verification could not be completed.",
        },
        { status: 422 }
      );
    }

    user.shopName = input.shopName;
    user.businessAddress = input.businessAddress;
    user.gstNumber = input.gstNumber;

    user.payoutDetails = {
      accountHolderName: input.accountHolderName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      ifscCode: input.ifscCode,
      panNumber: input.panNumber,
      accountType: input.accountType,
    };

    user.payoutVerification = {
      status: "verified",
      mode: payoutVerification.mode,
      verifiedAt: new Date(),
      rejectedReason: undefined,
    };

    user.verificationStatus = "pending";
    user.isApproved = false;
    user.requestedAt = new Date();
    user.approvedAt = undefined;
    user.rejectedReason = undefined;

    await user.save();

    return NextResponse.json(
      {
        message: "Vendor and payout details submitted successfully.",
        vendor: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopName: user.shopName,
          businessAddress: user.businessAddress,
          gstNumber: user.gstNumber,
          verificationStatus: user.verificationStatus,
          payoutVerification: user.payoutVerification,
          payoutDetails: {
            accountHolderName: user.payoutDetails.accountHolderName,
            bankName: user.payoutDetails.bankName,
            accountLast4: maskAccountNumber(
              user.payoutDetails.accountNumber
            ),
            ifscCode: user.payoutDetails.ifscCode,
            panMasked: maskPanNumber(user.payoutDetails.panNumber),
            accountType: user.payoutDetails.accountType,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Vendor details update error:", error);

    return NextResponse.json(
      {
        message: "Unable to save vendor details. Please try again.",
      },
      { status: 500 }
    );
  }
}
