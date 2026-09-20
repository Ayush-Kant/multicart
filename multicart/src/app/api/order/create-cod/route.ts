import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { calculateMarketplaceSplit, calculateOrderCharges } from "@/lib/marketplace-finance";
import {
  normalizeDeliveryAddress,
  validateDeliveryAddress,
} from "@/lib/order-validation";
import {
  normalizeAddressInput,
  validateAddressInput,
  toOrderAddress,
} from "@/lib/address-validation";

export async function POST(req: NextRequest) {
  let createdOrderId: string | null = null;
  let stockUpdated = false;

  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to place an order." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();

    const { productId, quantity, address, addressId } = body;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { message: "Quantity must be a positive whole number." },
        { status: 400 }
      );
    }

    let orderAddress: any;

    const user = await User.findById(userId);

    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "Your account or cart could not be found." },
        { status: 404 }
      );
    }

    if (addressId) {
      const savedAddress = user.addresses?.find(
        (saved: any) =>
          String(saved._id) === String(addressId)
      );

      if (!savedAddress) {
        return NextResponse.json(
          { message: "Selected saved address was not found." },
          { status: 404 }
        );
      }

      const normalizedSavedAddress = normalizeAddressInput({
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

      const savedAddressErrors =
        validateAddressInput(normalizedSavedAddress);

      if (Object.keys(savedAddressErrors).length > 0) {
        return NextResponse.json(
          {
            message:
              "The selected saved address is incomplete. Edit it before placing the order.",
            fieldErrors: savedAddressErrors,
          },
          { status: 400 }
        );
      }

      orderAddress = toOrderAddress(normalizedSavedAddress);
    } else {
      const normalizedAddress = normalizeDeliveryAddress(address || {});
      const addressErrors =
        validateDeliveryAddress(normalizedAddress);

      if (Object.keys(addressErrors).length > 0) {
        return NextResponse.json(
          {
            message: "Please correct the delivery address.",
            fieldErrors: addressErrors,
          },
          { status: 400 }
        );
      }

      orderAddress = normalizedAddress;
    }

    const cartItem = user.cart.find(
      (item: any) => item.product.toString() === productId
    );

    if (!cartItem) {
      return NextResponse.json(
        { message: "This product is no longer in your cart." },
        { status: 400 }
      );
    }

    if (cartItem.quantity !== quantity) {
      return NextResponse.json(
        {
          message:
            "The checkout quantity does not match your current cart quantity. Please refresh the cart and try again.",
        },
        { status: 409 }
      );
    }

    const product: any = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { message: "The selected product could not be found." },
        { status: 404 }
      );
    }

    if (product.verificationStatus !== "approved") {
      return NextResponse.json(
        { message: "This product is not currently available for purchase." },
        { status: 400 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        {
          message: `Only ${product.stock} unit(s) of ${product.title} are available.`,
        },
        { status: 400 }
      );
    }

    if (product.payOnDelivery === false) {
      return NextResponse.json(
        {
          message: `${product.title} does not support Cash on Delivery. Please choose online payment.`,
        },
        { status: 400 }
      );
    }

    const charges = calculateOrderCharges({
      productPrice: product.price,
      quantity,
      freeDelivery: Boolean(product.freeDelivery),
    });
    const split = calculateMarketplaceSplit(charges.productsTotal);

    const order = await Order.create({
      buyer: userId,
      products: [
        {
          product: product._id,
          quantity,
          price: product.price,
        },
      ],
      productVendor: product.vendor,
      productsTotal: charges.productsTotal,
      deliveryCharge: charges.deliveryCharge,
      serviceCharge: charges.serviceCharge,
      totalAmount: charges.totalAmount,
      paymentMethod: "cod",
      isPaid: false,
      orderStatus: "pending",
      returnedAmount: 0,
      platformFee: split.platformFee,
      platformFeePercent: split.platformFeePercent,
      vendorAmount: split.vendorAmount,
      payoutStatus: "pending",
      address: orderAddress,
    });

    createdOrderId = order._id.toString();

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity },
    });
    stockUpdated = true;

    user.cart = user.cart.filter(
      (item: any) => item.product.toString() !== productId
    );

    user.orders = user.orders || [];
    user.orders.push(order._id);

    await user.save();

    return NextResponse.json(
      {
        message: "COD order placed successfully.",
        order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (stockUpdated && createdOrderId) {
      try {
        const failedOrder = await Order.findById(createdOrderId);
        if (failedOrder) {
          const productId = failedOrder.products[0]?.product;
          const quantity = failedOrder.products[0]?.quantity || 0;

          if (productId && quantity > 0) {
            await Product.findByIdAndUpdate(productId, {
              $inc: { stock: quantity },
            });
          }
        }
      } catch {}
    }

    if (createdOrderId) {
      try {
        await Order.findByIdAndDelete(createdOrderId);
      } catch {}
    }

    console.error("❌ COD ORDER ERROR:", error);

    return NextResponse.json(
      { message: error.message || "Unable to place COD order." },
      { status: 500 }
    );
  }
}
