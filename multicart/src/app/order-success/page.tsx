"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaBox } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function OrderSuccessPage() {
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderId = new URLSearchParams(
          window.location.search
        ).get("orderId");

        if (!orderId) {
          setError("Order reference is missing.");
          return;
        }

        const response = await axios.get("/api/order/allOrder");
        const orders = response.data.orders || [];

        const matchedOrder = orders.find(
          (item: any) => String(item._id) === String(orderId)
        );

        if (!matchedOrder) {
          setError(
            "The order was placed, but its invoice could not be loaded."
          );
          return;
        }

        setOrder(matchedOrder);
      } catch (requestError: any) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load the order invoice."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading order confirmation...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-gray-900 px-4 py-10 text-white">
      <div className="max-w-3xl mx-auto">
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
              Your order has been received and is now being processed.
            </p>

            {order && (
              <p className="text-sm text-gray-400">
                Order #{String(order._id).slice(-10)}
              </p>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-[#061526] border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              Order Invoice
            </h2>

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
                      {productItem.quantity *
                        productItem.price}
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
                <span>Customer Total</span>
                <span className="text-green-300">
                  ₹ {order.totalAmount}
                </span>
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

              <p className="text-xs text-gray-500 pt-2">
                Vendor settlement is simulated in demo mode. No bank transfer is executed.
              </p>
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/orders")}
          className="mt-6 w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Go to Orders Page
        </motion.button>
      </div>
    </div>
  );
}
