import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    if (!session || !session.user?.email || !session.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const file = formData.get("image") as File | null;

    if (!name || !phone) {
      return NextResponse.json(
        { message: "Name and phone are required" },
        { status: 400 }
      );
    }

    let imageUrl

    // ✅ Safe Cloudinary Upload
    if (file) {
      
      imageUrl = await uploadOnCloudinary(file);
    }

    const updateData: any = {
      name,
      phone,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error: any) {
    console.error("EDIT PROFILE ERROR:", error.message);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
