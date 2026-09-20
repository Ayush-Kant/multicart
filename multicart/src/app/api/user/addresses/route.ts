import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import {
  buildAddressLine,
  normalizeAddressInput,
  validateAddressInput,
} from "@/lib/address-validation";

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

    const user = await User.findById(session.user.id)
      .select("addresses")
      .lean();

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const addresses = [...(user.addresses || [])].sort(
      (a: any, b: any) => {
        if (Boolean(a.isDefault) !== Boolean(b.isDefault)) {
          return a.isDefault ? -1 : 1;
        }

        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }
    );

    return NextResponse.json(
      { addresses },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);

    return NextResponse.json(
      { message: "Unable to load saved addresses." },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();
    const input = normalizeAddressInput(body);
    const errors = validateAddressInput(input);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          message: "Please correct the highlighted address fields.",
          fieldErrors: errors,
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

    const addresses = user.addresses || [];

    if (addresses.length >= 10) {
      return NextResponse.json(
        {
          message:
            "You can save up to 10 delivery addresses. Delete an old address to add another.",
        },
        { status: 409 }
      );
    }

    const makeDefault =
      Boolean(body.isDefault) || addresses.length === 0;

    if (makeDefault) {
      addresses.forEach((address: any) => {
        address.isDefault = false;
      });
    }

    const newAddress = {
      ...input,
      addressLine: buildAddressLine(input),
      isDefault: makeDefault,
    };

    addresses.push(newAddress as any);

    user.addresses = addresses;
    await user.save();

    const savedAddress =
      user.addresses?.[user.addresses.length - 1];

    return NextResponse.json(
      {
        message: "Address saved successfully.",
        address: savedAddress,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ADDRESS ERROR:", error);

    return NextResponse.json(
      { message: "Unable to save this address." },
      { status: 500 }
    );
  }
}
