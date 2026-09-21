import { auth } from "@/auth";
import User from "@/models/user.model";
import connectDb from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "User is not authenticated." },
        { status: 401 }
      );
    }

    await connectDb();

    const user = await User.findById(session.user.id)
      .select(
        "-password -payoutDetails.accountNumber -payoutDetails.panNumber"
      )
      .populate("cart.product")
      .lean();

    if (!user) {
      return NextResponse.json(
        { message: "User is not found." },
        { status: 404 }
      );
    }

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      phone: user.phone,
      shopName: user.shopName,
      businessAddress: user.businessAddress,
      gstNumber: user.gstNumber,
      isApproved: user.isApproved,
      verificationStatus: user.verificationStatus,
      requestedAt: user.requestedAt,
      approvedAt: user.approvedAt,
      rejectedReason: user.rejectedReason,
      vendorProducts: user.vendorProducts,
      orders: user.orders,
      cart: user.cart,
      addresses: user.addresses,
      chats: user.chats,
      payoutVerification: user.payoutVerification,
      payoutDetails: user.payoutDetails
        ? {
            accountHolderName: user.payoutDetails.accountHolderName,
            bankName: user.payoutDetails.bankName,
            ifscCode: user.payoutDetails.ifscCode,
            accountType: user.payoutDetails.accountType,
            accountLast4: user.payoutDetails.accountNumber
              ? user.payoutDetails.accountNumber.slice(-4)
              : undefined,
          }
        : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);

    return NextResponse.json(
      { message: "Unable to load the current user." },
      { status: 500 }
    );
  }
}
