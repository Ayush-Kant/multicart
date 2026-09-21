import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();

    const vendors = await User.find({
      role: "vendor",
      verificationStatus: "approved",
      isApproved: true,
    })
      .select("name image shopName businessAddress verificationStatus isApproved vendorProducts")
      .populate({
        path: "vendorProducts",
        match: {
          verificationStatus: "approved",
          isActive: true,
        },
        select:
          "title price image1 image2 image3 image4 category stock verificationStatus isActive replacementDays freeDelivery warranty payOnDelivery reviews",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(vendors, { status: 200 });
  } catch (error) {
    console.error("PUBLIC VENDOR ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load shops." },
      { status: 500 }
    );
  }
}
