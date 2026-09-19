import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    // ✅ AUTH CHECK
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ✅ BODY DATA
    const {
      productId,
      quantity,
      address,
      amount,
      deliveryCharge,
      serviceCharge,
    } = await req.json();

    // ✅ BASIC VALIDATION
    if (!productId || !quantity) {
      return NextResponse.json(
        { message: "ProductId and quantity required" },
        { status: 400 }
      );
    }

    // ✅ ADDRESS VALIDATION (UNCHANGED)
    if (
      !address?.name ||
      !address?.phone ||
      !address?.address ||
      !address?.city ||
      !address?.pincode
    ) {
      return NextResponse.json(
        { message: "All address fields are required" },
        { status: 400 }
      );
    }

    // ✅ AMOUNT VALIDATION (UNCHANGED)
    if (
      typeof amount !== "number" ||
      typeof deliveryCharge !== "number" ||
      typeof serviceCharge !== "number"
    ) {
      return NextResponse.json(
        { message: "Invalid amount, delivery or service charge" },
        { status: 400 }
      );
    }

    // ✅ LOAD USER
    const user = await User.findById(userId);
    if (!user || !user.cart) {
      return NextResponse.json(
        { message: "User or cart not found" },
        { status: 404 }
      );
    }

    // ✅ CHECK PRODUCT EXISTS IN CART
    const cartItem = user.cart.find(
      (item: any) => item.product.toString() === productId
    );

    if (!cartItem) {
      return NextResponse.json(
        { message: "Product not found in cart" },
        { status: 400 }
      );
    }

    // ✅ LOAD PRODUCT
    const product: any = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ STOCK CHECK
    if (product.stock < quantity) {
      return NextResponse.json(
        { message: `Insufficient stock for ${product.title}` },
        { status: 400 }
      );
    }

    // ✅ COD CHECK
    if (product.payOnDelivery === false) {
      return NextResponse.json(
        { message: `${product.title} does not support Cash on Delivery` },
        { status: 400 }
      );
    }

    const productsTotal = product.price * quantity;

    // ✅ CREATE ORDER (SINGLE PRODUCT)
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

      productsTotal,
      deliveryCharge,
      serviceCharge,
      totalAmount: amount,

      paymentMethod: "cod",
      isPaid: false,
      orderStatus: "pending",
      returnedAmount: 0,

      address,
    });

    // ✅ UPDATE PRODUCT STOCK
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity },
    });

    // ✅ REMOVE ONLY THIS PRODUCT FROM CART (IMPORTANT)
    user.cart = user.cart.filter(
      (item: any) => item.product.toString() !== productId
    );

    // ✅ PUSH ORDER ID
    user.orders = user.orders || [];
    user.orders.push(order._id);

    await user.save();

    return NextResponse.json(
      {
        message: "✅ COD Order placed successfully",
        order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ COD ORDER ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
