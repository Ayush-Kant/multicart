"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaBox, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthGate from "@/component/auth/AuthGate";

export default function OrderSuccessPage() {\n  return (\n    <AuthGate\n      callbackUrl={typeof window !== "undefined" ? window.location.pathname + window.location.search : "/orders"}\n      title="Sign in to view your order confirmation"\n      description="Your order details are available securely inside your account."\n    >\n      <OrderSuccessContent />\n    </AuthGate>\n  );\n}\n\nfunction OrderSuccessContent() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const searchParams = new URLSearchParams(
          window.location.search
        );

        const orderId = searchParams.get("orderId");
        const checkoutGroupId =
          searchParams.get("checkoutGroupId");

        if (!orderId && !checkoutGroupId) {
          setError("Order reference is missing.");
          return;
        }

        const response = await axios.get("/api/order/allOrder");
        const allOrders = response.data.orders || [];

        const matchedOrders = checkoutGroupId
          ? allOrders.filter(
              (item: any) =>
                String(item.checkoutGroupId) ===
                String(checkoutGroupId)
            )
          : allOrders.filter(
              (item: any) =>
                String(item._id) === String(orderId)
            );

        if (!matchedOrders.length) {
          setError(
            "The order was placed, but its invoice could not be loaded."
          );
          return;
        }

        setOrders(matchedOrders);
      } catch (requestError: any) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load the order invoice."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const totals = useMemo(
    () =>
      orders.reduce(
        (sum, order) => ({
          products: sum.products + Number(order.productsTotal || 0),
          delivery:
            sum.delivery + Number(order.deliveryCharge || 0),
          service:
            sum.service + Number(order.serviceCharge || 0),
          total: sum.total + Number(order.totalAmount || 0),
        }),
        {
          products: 0,
          delivery: 0,
          service: 0,
          total: 0,
        }
      ),
    [orders]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading order confirmation...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-gray-900 px-4 py-10 text-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 sm:p-10 text-center"
        >
          <div className="flex justify-center">
            <FaCheckCircle className="text-green-400" size={100} />
          </div>

          <h1 className="text-3xl font-bold mt-6">
            Order Placed Successfully
          </h1>

          <div className="flex flex-col items-center gap-2 mt-4 text-gray-300">
            <FaBox size={30} className="text-blue-300" />

            <p>
              {orders.length > 1
                ? orders.length +
                  " vendor orders were created successfully."
                : "Your order has been received and is now being processed."}
            </p>

            {orders.length === 1 && (
              <p className="text-sm text-gray-400">
                Order #{String(orders[0]._id).slice(-10)}
              </p>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {orders.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-white/10 bg-[#061526] p-6"
          >
            <h2 className="text-xl font-semibold">
              Cart Checkout Summary
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Products Total</span>
                <span>₹ {totals.products}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>₹ {totals.delivery}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>₹ {totals.service}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-green-300">
                  ₹ {totals.total}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {orders.map((order, orderIndex) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: orderIndex * 0.05 }}
            className="mt-6 bg-[#061526] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-xl font-semibold">
                {orders.length > 1
                  ? "Vendor Order " + (orderIndex + 1)
                  : "Order Invoice"}
              </h2>
              <p className="text-xs text-gray-500">
                #{String(order._id).slice(-10)}
              </p>
            </div>

            <div className="space-y-3">
              {order.products?.map(
                (productItem: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between gap-4 bg-white/5 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {productItem.product?.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty: {productItem.quantity} × ₹
                        {productItem.price}
                      </p>
                    </div>

                    <p className="font-semibold">
                      ₹{" "}
                      {(
                        productItem.quantity *
                        productItem.price
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="mt-5 border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Products Total</span>
                <span>₹ {order.productsTotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>₹ {order.deliveryCharge}</span>
              </div>

              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>₹ {order.serviceCharge}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg border-t border-white/10 pt-3">
                <span>Order Total</span>
                <span className="text-green-300">
                  ₹ {order.totalAmount}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Delivery Address
              </p>
              <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-gray-300 space-y-1">
                <p className="font-semibold text-white">
                  {order.address?.name}
                </p>
                <p>{order.address?.phone}</p>
                <p>{order.address?.address}</p>
                {order.address?.pincode && (
                  <p>Pincode: {order.address.pincode}</p>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Marketplace Settlement
              </p>

              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>₹ {order.platformFee || 0}</span>
              </div>

              <div className="flex justify-between">
                <span>Vendor Amount</span>
                <span className="text-green-300">
                  ₹ {order.vendorAmount || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Settlement Status</span>
                <span className="capitalize text-yellow-300">
                  {order.payoutStatus || "pending"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/orders")}
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Go to Orders Page
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/")}
            className="w-full py-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold"
          >
            Continue Shopping
          </motion.button>
        </div>
      </div>
    </div>
  );
}
