import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import {
  buildAddressLine,
  normalizeAddressInput,
  validateAddressInput,
} from "@/lib/address-validation";

type RouteContext = {
  params: Promise<{ addressId: string }>;
};

const getAddress = async (userId: string, addressId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    return { user: null, address: null };
  }

  const address = user.addresses?.find(
    (item: any) => String(item._id) === String(addressId)
  );

  return { user, address };
};

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { addressId } = await context.params;

    if (!addressId) {
      return NextResponse.json(
        { message: "Address ID is required." },
        { status: 400 }
      );
    }

    const { user, address } = await getAddress(
      session.user.id,
      addressId
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { message: "Saved address not found." },
        { status: 404 }
      );
    }

    const body = await req.json();

    const existingAddress = {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      buildingNumber: address.buildingNumber,
      street: address.street,
      area: address.area,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      accuracy: address.accuracy,
      source: address.source,
    };

    const input = normalizeAddressInput({
      ...existingAddress,
      ...body,
    });

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

    if (Boolean(body.isDefault)) {
      user.addresses?.forEach((item: any) => {
        item.isDefault = String(item._id) === String(addressId)
          ? true
          : false;
      });
    }

    Object.assign(address, {
      ...input,
      addressLine: buildAddressLine(input),
      isDefault:
        body.isDefault === undefined
          ? address.isDefault
          : Boolean(body.isDefault),
    });

    await user.save();

    return NextResponse.json(
      {
        message: "Address updated successfully.",
        address,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);

    return NextResponse.json(
      { message: "Unable to update this address." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { addressId } = await context.params;

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const currentAddresses = user.addresses || [];
    const addressToDelete = currentAddresses.find(
      (item: any) => String(item._id) === String(addressId)
    );

    if (!addressToDelete) {
      return NextResponse.json(
        { message: "Saved address not found." },
        { status: 404 }
      );
    }

    const wasDefault = Boolean(addressToDelete.isDefault);

    user.addresses = currentAddresses.filter(
      (item: any) => String(item._id) !== String(addressId)
    );

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Address deleted successfully.",
        addresses: user.addresses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);

    return NextResponse.json(
      { message: "Unable to delete this address." },
      { status: 500 }
    );
  }
}
