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

    const admin = await User.findOne({ role: "admin" })
      .select("_id")
      .lean();

    return NextResponse.json({
      exists: !!admin,
    });
  } catch (error) {
    console.error("CHECK ADMIN ERROR:", error);

    return NextResponse.json(
      { message: "Unable to check admin availability." },
      { status: 500 }
    );
  }
}
