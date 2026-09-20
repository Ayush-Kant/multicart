"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaShoppingBag,
  FaArrowRight,
} from "react-icons/fa";
import { calculateOrderCharges } from "@/lib/marketplace-finance";

export default function UserCartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null
  );
  const [removingProductId, setRemovingProductId] = useState<string | null>(
    null
  );
  const router = useRouter();

  const getCart = async () => {
    try {
      const res = await axios.get("/api/cart/get");
      setCart(res.data.cart || []);
    } catch (error) {
      console.log("Cart fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCart();
  }, []);

  const handleRemoveFromCart = async (productId: string) => {
    try {
      setRemovingProductId(productId);
      await axios.post("/api/cart/remove", { productId });

      setCart((prev) =>
        prev.filter(
          (item) => String(item.product._id) !== String(productId)
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Unable to remove this product from your cart."
      );
    } finally {
      setRemovingProductId(null);
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number
  ) => {
    if (quantity < 1) return;

    try {
      setUpdatingProductId(productId);
      await axios.post("/api/cart/update", {
        productId,
        quantity,
      });

      setCart((prev) =>
        prev.map((item) =>
          String(item.product._id) === String(productId)
            ? { ...item, quantity }
            : item
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Unable to update the product quantity."
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  const summary = useMemo(() => {
    return cart.reduce(
      (totals, item) => {
        const charges = calculateOrderCharges({
          productPrice: Number(item.product?.price || 0),
          quantity: Number(item.quantity || 0),
          freeDelivery: Boolean(item.product?.freeDelivery),
        });

        totals.productsTotal += charges.productsTotal;
        totals.deliveryCharge += charges.deliveryCharge;
        totals.serviceCharge += charges.serviceCharge;
        totals.totalAmount += charges.totalAmount;

        return totals;
      },
      {
        productsTotal: 0,
        deliveryCharge: 0,
        serviceCharge: 0,
        totalAmount: 0,
      }
    );
  }, [cart]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white px-4 py-12">
        <div className="min-h-[65vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-10 text-center shadow-2xl"
          >
            <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
              <FaShoppingBag className="text-blue-400" size={28} />
            </div>
            <h1 className="text-3xl font-bold">Your Cart is Empty</h1>
            <p className="text-gray-400 mt-2 mb-7">
              Browse our verified products and add something you love.
            </p>
            <button
              type="button"
              onClick={() => router.push("/category")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition"
            >
              Continue Shopping
              <FaArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-blue-400 text-sm font-medium uppercase tracking-[0.2em]">
              Shopping Cart
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-1">
              Your Cart
            </h1>
            <p className="text-gray-400 mt-1">
              {cart.length} {cart.length === 1 ? "product" : "products"} in your cart
            </p>
          </div>


        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 xl:items-start">
          <div className="space-y-4">
            {cart.map((item, index) => {
              const productId = String(item.product._id);
              const isUpdating = updatingProductId === productId;
              const isRemoving = removingProductId === productId;
              const itemTotal =
                Number(item.product.price || 0) * Number(item.quantity || 0);

              return (
                <motion.article
                  key={productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-xl p-4 sm:p-5 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    <button
                      type="button"
                      onClick={() => router.push(`/view-product/${productId}`)}
                      className="shrink-0 w-full sm:w-[190px] h-[220px] sm:h-[190px] rounded-xl overflow-hidden bg-white border border-white/10 flex items-center justify-center group"
                    >
                      <Image
                        src={item.product.image1}
                        alt={item.product.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain p-3 transition duration-300 group-hover:scale-105"
                      />
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/view-product/${productId}`)}
                            className="text-left text-xl sm:text-2xl font-semibold text-white hover:text-blue-400 transition line-clamp-2"
                          >
                            {item.product.title}
                          </button>

                          <p className="text-sm text-gray-400 mt-1">
                            {item.product.category}
                          </p>

                          {item.product.vendor?.shopName && (
                            <p className="text-xs text-gray-500 mt-2">
                              Sold by{" "}
                              <span className="text-gray-300">
                                {item.product.vendor.shopName}
                              </span>
                            </p>
                          )}

                          <p className="text-sm text-gray-300 mt-3">
                            ₹ {Number(item.product.price).toLocaleString("en-IN")} each
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <p className="text-2xl font-bold text-green-400">
                            ₹ {itemTotal.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Item total
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-xl border border-white/15 bg-black/30 overflow-hidden">
                          <button
                            type="button"
                            disabled={isUpdating || Number(item.quantity) <= 1}
                            onClick={() =>
                              handleUpdateQuantity(
                                productId,
                                Number(item.quantity) - 1
                              )
                            }
                            className="w-11 h-11 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition"
                            aria-label="Decrease quantity"
                          >
                            <FaMinus size={11} />
                          </button>

                          <span className="w-12 text-center text-sm font-semibold">
                            {isUpdating ? "..." : item.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateQuantity(
                                productId,
                                Number(item.quantity) + 1
                              )
                            }
                            className="w-11 h-11 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition"
                            aria-label="Increase quantity"
                          >
                            <FaPlus size={11} />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemoveFromCart(productId)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50 transition"
                        >
                          <FaTrash size={13} />
                          {isRemoving ? "Removing..." : "Remove"}
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push(`/checkout/${productId}`)}
                          className="sm:ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition shadow-lg shadow-blue-950/30"
                        >
                          Checkout This Product
                          <FaArrowRight size={13} />
                        </button>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
                        {item.product.freeDelivery ? (
                          <span className="text-green-400">✓ Free delivery</span>
                        ) : (
                          <span>Delivery ₹50</span>
                        )}

                        {item.product.payOnDelivery && (
                          <span className="text-green-400">
                            ✓ Cash on Delivery available
                          </span>
                        )}

                        {item.product.replacementDays > 0 && (
                          <span>
                            ✓ {item.product.replacementDays} days replacement
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:sticky xl:top-24 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-xl p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">Price Details</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-gray-300">
                <span>Products ({cart.length})</span>
                <span>₹ {summary.productsTotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between gap-4 text-gray-300">
                <span>Delivery</span>
                <span>₹ {summary.deliveryCharge.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between gap-4 text-gray-300">
                <span>Service Charge</span>
                <span>₹ {summary.serviceCharge.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="flex justify-between items-center gap-4">
              <span className="font-semibold text-lg">Total Amount</span>
              <span className="font-bold text-2xl text-green-400">
                ₹ {summary.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 text-xs leading-5 text-gray-400">
              Use “Checkout All Products” to review the entire cart in one
              checkout. Products from different vendors are grouped into
              separate vendor orders automatically.
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold transition shadow-lg shadow-blue-950/30"
              >
                Checkout All Products
              </button>

              <button
                type="button"
                onClick={() => router.push("/category")}
                className="w-full py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold transition"
              >
                Continue Shopping
              </button>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
