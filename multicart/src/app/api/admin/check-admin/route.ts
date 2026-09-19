// /api/user/check-admin/route.ts
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDb();

  const admin = await User.findOne({ role: "admin" });

  return NextResponse.json({
    exists: !!admin,
  });
}
