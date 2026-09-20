import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
} from "@/lib/razorpay";
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
  let stockReserved = false;
  let rollbackProductId: string | null = null;
  let rollbackQuantity = 0;
  let razorpayOrderId: string | null = null;

  try {
    await connectDb();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to place an online order." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { productId, quantity, address, addressId } = await req.json();

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

    const user = await User.findById(userId);

    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "Your account or cart could not be found." },
        { status: 404 }
      );
    }

    let orderAddress: any;

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

    if (!product.vendor) {
      return NextResponse.json(
        { message: "This product is missing a vendor assignment." },
        { status: 409 }
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
          message:
            `Only ${product.stock} unit(s) of ${product.title} are available.`,
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

    const amountInPaise = Math.round(charges.totalAmount * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json(
        { message: "The calculated order amount is invalid." },
        { status: 400 }
      );
    }

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
      platformFee: split.platformFee,
      platformFeePercent: split.platformFeePercent,
      vendorAmount: split.vendorAmount,
      payoutStatus: "pending",
      paymentMethod: "razorpay",
      isPaid: false,
      orderStatus: "pending",
      returnedAmount: 0,
      address: orderAddress,
    });

    createdOrderId = order._id.toString();
    rollbackProductId = productId;
    rollbackQuantity = quantity;

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity },
    });
    stockReserved = true;

    // Keep the cart untouched until Razorpay payment is captured
    // and verified successfully.

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order._id.toString()}`,
      notes: {
        orderId: order._id.toString(),
        productId: product._id.toString(),
      },
    });

    razorpayOrderId = razorpayOrder.id;

    await Order.findByIdAndUpdate(order._id, {
      $set: {
        "paymentDetails.razorpayOrderId": razorpayOrder.id,
      },
    });

    return NextResponse.json(
      {
        orderId: order._id.toString(),
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: getRazorpayKeyId(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    /*
     * Once Razorpay has created an external order, keep the local pending
     * order instead of deleting it. This prevents an edge-case where an
     * external payment succeeds after a local rollback removed its order.
     * The customer can cancel the pending order to release reserved stock.
     */
    const externalPaymentOrderExists = Boolean(razorpayOrderId);

    if (externalPaymentOrderExists && createdOrderId) {
      try {
        await Order.findByIdAndUpdate(createdOrderId, {
          $set: {
            ...(razorpayOrderId
              ? {
                  "paymentDetails.razorpayOrderId":
                    razorpayOrderId,
                }
              : {}),
          },
        });
      } catch {}
    }

    if (!externalPaymentOrderExists) {
      if (stockReserved && rollbackProductId) {
        try {
          await Product.findByIdAndUpdate(rollbackProductId, {
            $inc: { stock: rollbackQuantity },
          });
        } catch {}
      }

      if (createdOrderId) {
        try {
          await Order.findByIdAndDelete(createdOrderId);
        } catch {}
      }
    }

    console.error("❌ RAZORPAY ORDER ERROR:", error);

    return NextResponse.json(
      {
        message: externalPaymentOrderExists
          ? "Online payment setup failed. A pending order was kept so you can cancel it from Orders."
          : error.message || "Unable to start online payment.",
      },
      { status: 500 }
    );
  }
}
