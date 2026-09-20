import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import {
  calculateMarketplaceSplit,
  calculateOrderCharges,
} from "@/lib/marketplace-finance";
import {
  normalizeAddressInput,
  validateAddressInput,
  toOrderAddress,
} from "@/lib/address-validation";
import {
  normalizeDeliveryAddress,
  validateDeliveryAddress,
} from "@/lib/order-validation";

export async function POST(req: NextRequest) {
  const createdOrderIds: string[] = [];
  const stockReservations: {
    productId: string;
    quantity: number;
  }[] = [];
  let userUpdated = false;

  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to place an order." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { addressId, address } = body;

    const user = await User.findById(session.user.id);

    if (!user || !user.cart?.length) {
      return NextResponse.json(
        { message: "Your cart is empty." },
        { status: 400 }
      );
    }

    let orderAddress: any;

    if (addressId) {
      const savedAddress = user.addresses?.find(
        (item: any) => String(item._id) === String(addressId)
      );

      if (!savedAddress) {
        return NextResponse.json(
          { message: "Selected saved address was not found." },
          { status: 404 }
        );
      }

      const normalized = normalizeAddressInput({
        label: savedAddress.label,
        recipientName: savedAddress.recipientName,
        phone: savedAddress.phone,
        buildingNumber: savedAddress.buildingNumber,
        street: savedAddress.street,
        area: savedAddress.area,
        landmark: savedAddress.landmark,
        city: savedAddress.city,
        state: savedAddress.state,
        pincode: savedAddress.pincode,
        country: savedAddress.country,
        latitude: savedAddress.latitude,
        longitude: savedAddress.longitude,
        accuracy: savedAddress.accuracy,
        source: savedAddress.source,
      });

      const errors = validateAddressInput(normalized);

      if (Object.keys(errors).length) {
        return NextResponse.json(
          {
            message:
              "The selected saved address is incomplete. Edit it before placing the order.",
            fieldErrors: errors,
          },
          { status: 400 }
        );
      }

      orderAddress = toOrderAddress(normalized);
    } else {
      const normalized = normalizeDeliveryAddress(address || {});
      const errors = validateDeliveryAddress(normalized);

      if (Object.keys(errors).length) {
        return NextResponse.json(
          {
            message: "Please correct the delivery address.",
            fieldErrors: errors,
          },
          { status: 400 }
        );
      }

      orderAddress = normalized;
    }

    const cartProductIds = user.cart.map((item: any) => item.product);
    const products = await Product.find({
      _id: { $in: cartProductIds },
    });

    const productMap = new Map(
      products.map((product: any) => [String(product._id), product])
    );

    for (const cartItem of user.cart as any[]) {
      const product: any = productMap.get(String(cartItem.product));

      if (!product) {
        throw new Error(
          "One or more products in your cart are no longer available."
        );
      }

      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
        throw new Error("Invalid quantity for a cart product.");
      }

      if (!product.vendor) {
        throw new Error(
          "A cart product is missing its vendor assignment."
        );
      }

      if (product.verificationStatus !== "approved") {
        throw new Error(
          product.title +
            " is no longer approved for purchase."
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new Error(
          "Only " +
            product.stock +
            " unit(s) of " +
            product.title +
            " are available."
        );
      }

      if (product.payOnDelivery === false) {
        throw new Error(
          product.title +
            " does not support Cash on Delivery. Please use online payment."
        );
      }
    }

    const groups = new Map<
      string,
      {
        vendor: any;
        items: {
          product: any;
          quantity: number;
          price: number;
        }[];
      }
    >();

    for (const cartItem of user.cart as any[]) {
      const product: any = productMap.get(String(cartItem.product));
      const vendorId = String(product.vendor);

      if (!groups.has(vendorId)) {
        groups.set(vendorId, {
          vendor: product.vendor,
          items: [],
        });
      }

      groups.get(vendorId)!.items.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
      });
    }

    const checkoutGroupId = crypto.randomUUID();

    for (const group of groups.values()) {
      let productsTotal = 0;
      let deliveryCharge = 0;
      let serviceCharge = 0;

      for (const item of group.items) {
        const product: any = productMap.get(String(item.product));

        const charges = calculateOrderCharges({
          productPrice: item.price,
          quantity: item.quantity,
          freeDelivery: Boolean(product.freeDelivery),
        });

        productsTotal += charges.productsTotal;
        deliveryCharge += charges.deliveryCharge;
        serviceCharge += charges.serviceCharge;
      }

      const totalAmount =
        productsTotal + deliveryCharge + serviceCharge;

      const split = calculateMarketplaceSplit(productsTotal);

      const order = await Order.create({
        buyer: user._id,
        products: group.items,
        productVendor: group.vendor,
        productsTotal,
        deliveryCharge,
        serviceCharge,
        totalAmount,
        platformFee: split.platformFee,
        platformFeePercent: split.platformFeePercent,
        vendorAmount: split.vendorAmount,
        payoutStatus: "pending",
        paymentMethod: "cod",
        checkoutGroupId,
        isPaid: false,
        orderStatus: "pending",
        returnedAmount: 0,
        address: orderAddress,
      });

      createdOrderIds.push(order._id.toString());
    }

    for (const cartItem of user.cart as any[]) {
      await Product.findByIdAndUpdate(cartItem.product, {
        $inc: { stock: -cartItem.quantity },
      });

      stockReservations.push({
        productId: String(cartItem.product),
        quantity: cartItem.quantity,
      });
    }

    user.cart = [];
    user.orders = user.orders || [];

    for (const orderId of createdOrderIds) {
      user.orders.push(orderId as any);
    }

    await user.save();
    userUpdated = true;

    const orders = await Order.find({
      _id: { $in: createdOrderIds },
      buyer: user._id,
    }).lean();

    return NextResponse.json(
      {
        success: true,
        message: "All cart products ordered successfully.",
        checkoutGroupId,
        orders,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (stockReservations.length) {
      for (const reservation of stockReservations) {
        try {
          await Product.findByIdAndUpdate(reservation.productId, {
            $inc: { stock: reservation.quantity },
          });
        } catch {}
      }
    }

    for (const orderId of createdOrderIds) {
      try {
        await Order.findByIdAndDelete(orderId);
      } catch {}
    }

    if (userUpdated) {
      try {
        const session = await auth();

        if (session?.user?.id) {
          const rollbackUser = await User.findById(session.user.id);

          if (rollbackUser) {
            const created = new Set(createdOrderIds);

            rollbackUser.orders = (rollbackUser.orders || []).filter(
              (id: any) => !created.has(String(id))
            );

            await rollbackUser.save();
          }
        }
      } catch {}
    }

    console.error("❌ CART COD ORDER ERROR:", error);

    return NextResponse.json(
      {
        message:
          error.message || "Unable to place the complete cart order.",
      },
      { status: 500 }
    );
  }
}
