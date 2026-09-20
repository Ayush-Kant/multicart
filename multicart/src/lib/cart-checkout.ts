import User from "@/models/user.model";
import Product from "@/models/product.model";
import Order from "@/models/order.model";

export async function finalizePaidOrdersForBuyer(
  userId: string,
  orders: any[]
) {
  if (!orders.length) return;

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("Buyer account not found while finalizing checkout.");
  }

  const orderedQuantities = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.products || []) {
      const productId = String(item.product);
      orderedQuantities.set(
        productId,
        (orderedQuantities.get(productId) || 0) +
          Number(item.quantity || 0)
      );
    }

    if (
      !user.orders?.some(
        (id: any) => String(id) === String(order._id)
      )
    ) {
      user.orders = user.orders || [];
      user.orders.push(order._id);
    }
  }

  /*
   * Only remove the quantity that was actually paid for.
   * If the customer changed a cart quantity while payment was open,
   * any extra quantity remains in the cart.
   */
  user.cart = (user.cart || [])
    .map((item: any) => {
      const productId = String(item.product);
      const paidQuantity =
        orderedQuantities.get(productId) || 0;

      if (paidQuantity <= 0) return item;

      const remaining =
        Number(item.quantity || 0) - paidQuantity;

      if (remaining <= 0) return null;

      return {
        ...item,
        quantity: remaining,
      };
    })
    .filter(Boolean) as any;

  user.markModified("cart");
  user.markModified("orders");
  await user.save();
}

export async function releaseUnpaidOrderStock(
  orders: any[]
) {
  for (const order of orders) {
    for (const item of order.products || []) {
      const quantity = Number(item.quantity || 0);

      if (quantity > 0) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: quantity } }
        );
      }
    }
  }
}

export async function cancelPendingCartCheckout(
  userId: string,
  checkoutGroupId: string
) {
  const orders = await Order.find({
    buyer: userId,
    checkoutGroupId,
    paymentMethod: "razorpay",
    isPaid: false,
  });

  if (!orders.length) {
    return { cancelledOrders: 0 };
  }

  await releaseUnpaidOrderStock(orders);

  const orderIds = orders.map((order) => order._id);

  await Order.deleteMany({
    _id: { $in: orderIds },
    buyer: userId,
    isPaid: false,
  });

  const user = await User.findById(userId);

  if (user?.orders?.length) {
    user.orders = user.orders.filter(
      (id: any) =>
        !orderIds.some(
          (orderId) => String(orderId) === String(id)
        )
    );

    user.markModified("orders");
    await user.save();
  }

  return { cancelledOrders: orders.length };
}

export async function cancelPendingSingleOrder(
  userId: string,
  orderId: string
) {
  const order = await Order.findOne({
    _id: orderId,
    buyer: userId,
    paymentMethod: "razorpay",
    isPaid: false,
  });

  if (!order) {
    return false;
  }

  await releaseUnpaidOrderStock([order]);

  await Order.findOneAndDelete({
    _id: order._id,
    buyer: userId,
    isPaid: false,
  });

  return true;
}
