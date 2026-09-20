import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Payout from "@/models/payout.model";
import User from "@/models/user.model";

export async function GET() {
  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await User.findById(session.user.id);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can view payout settlements." },
        { status: 403 }
      );
    }

    const payouts = await Payout.find()
      .populate("vendor", "name email shopName")
      .populate(
        "order",
        "productsTotal totalAmount paymentMethod orderStatus createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const totals = payouts.reduce(
      (acc: any, payout: any) => {
        acc.gross += payout.grossAmount || 0;
        acc.platformFees += payout.platformFee || 0;

        if (payout.status === "paid") {
          acc.paidOut += payout.vendorAmount || 0;
        }

        if (["pending", "processing"].includes(payout.status)) {
          acc.pending += payout.vendorAmount || 0;
        }

        if (payout.status === "reversed") {
          acc.reversed += payout.reversalAmount || 0;
        }

        return acc;
      },
      {
        gross: 0,
        platformFees: 0,
        paidOut: 0,
        pending: 0,
        reversed: 0,
      }
    );

    return NextResponse.json({
      payouts,
      totals,
    });
  } catch (error) {
    console.error("Admin payout fetch error:", error);

    return NextResponse.json(
      { message: "Unable to fetch payout settlements." },
      { status: 500 }
    );
  }
}
