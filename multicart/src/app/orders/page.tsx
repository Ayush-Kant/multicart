"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { setAllOrderData } from "@/redux/orderSlice";
import { motion } from "framer-motion";
import { FiTruck } from "react-icons/fi";
import { span } from "framer-motion/client";

export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { userData } = useSelector((state: RootState) => state.user);
  const { allOrderData } = useSelector((state: RootState) => state.order);

  const [loading, setLoading] = useState(true);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackOrderModal, setTrackOrderModal] = useState<any | null>(null);

  // -----------------------------
  // Fetch Orders
  // -----------------------------
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await axios.get("/api/order/allOrder");
        const orders = Array.isArray(result.data)
          ? result.data
          : result.data.orders || [];

        dispatch(setAllOrderData(orders));
      } catch (err) {
        console.log("Order Fetch Error:", err);
        dispatch(setAllOrderData([]));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dispatch]);

  useEffect(() => {
    setLocalOrders(allOrderData || []);
  }, [allOrderData]);

  // -----------------------------
  // Filter Orders
  // -----------------------------
  const userOrders = useMemo(() => {
    if (!userData) return [];
    return localOrders.filter((o) => {
      const buyerId = o?.buyer?._id ?? o.buyer;
      return String(buyerId) === String(userData._id);
    });
  }, [localOrders, userData]);

  // Format date
  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isReturnEligible = (deliveryDate: string, replacementDays: number) => {
    if (!deliveryDate || !replacementDays) return false;

    const deliveredAt = new Date(deliveryDate).getTime();
    const expiry =
      deliveredAt + replacementDays * 24 * 60 * 60 * 1000;

    return Date.now() <= expiry;
  };

  const getRemainingReturnDays = (
    deliveryDate: string,
    replacementDays: number
  ) => {
    if (!deliveryDate || !replacementDays) return 0;

    const deliveredAt = new Date(deliveryDate).getTime();
    const expiry =
      deliveredAt + replacementDays * 24 * 60 * 60 * 1000;

    const diff = expiry - Date.now();
    if (diff <= 0) return 0;

    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };
  const getReturnEndDate = (
    deliveryDate: string,
    replacementDays: number
  ) => {
    if (!deliveryDate || !replacementDays) return null;

    const deliveredAt = new Date(deliveryDate);
    deliveredAt.setDate(deliveredAt.getDate() + replacementDays);

    return deliveredAt;
  };

  const handleReturnOrder = async (orderId: string) => {
    try {
      const res = await axios.post("/api/order/return", { orderId });

      const returnedOrder = res.data.order;

      const updatedOrders = localOrders.map((o: any) =>
        o._id === orderId
          ? {
            ...o,
            orderStatus: "returned",
            returnedAmount: returnedOrder.returnedAmount,
          }
          : o
      );

      alert(`Order Returned. Refund ₹${returnedOrder.returnedAmount}`);

      setSelectedOrder(null);
      setLocalOrders(updatedOrders);
      dispatch(setAllOrderData(updatedOrders));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Return failed");
    }
  };


  // -----------------------------
  // TRACK ORDER STEPS (UPDATED)
  // -----------------------------
  const statuses = ["pending", "confirmed", "shipped", "delivered", "returned"];

  const renderTrackStep = (currentStatus: string) => {
    return (
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute  top-0 left-8 w-[1px] h-full bg-gray-600"></div>

        {statuses.map((status, i) => {
          const active = currentStatus === status;

          return (
            <div key={i} className="relative mb-6 flex items-start">
              {/* Dot */}
              <div
                className={`w-4 h-4 rounded-full ${active ? "bg-blue-500 shadow-lg shadow-blue-500/50" : "bg-gray-500"
                  }`}
              ></div>

              {/* Label */}
              <div className="ml-4 text-sm capitalize">{status}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Cancel logic
  const isCancelDisabled = (order: any) =>
    order.isPaid === true && order.paymentMethod === "stripe";

  const handleCancelOrder = async (orderId: string) => {
    try {
      await axios.post("/api/order/cancel", { orderId });

      // ✅ Instant UI update
      const updatedOrders = localOrders.map((o: any) =>
        o._id === orderId ? { ...o, orderStatus: "cancelled" } : o
      );
      alert("Order Cancelled")
      setSelectedOrder(null)
      setLocalOrders(updatedOrders);
      dispatch(setAllOrderData(updatedOrders));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Cancel failed");
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-gray-300">All orders placed by you</p>
          </div>

          <div className="text-sm text-gray-300">{userOrders.length} orders</div>
        </div>

        {/* ---------------------- */}
        {/* LARGE SCREEN TABLE */}
        {/* ---------------------- */}
        <div className="hidden lg:block bg-white/5 border border-white/10 rounded-xl overflow-auto shadow-xl shadow-black/40">
          <table className="w-full text-left">
            <thead className="text-xs bg-white/5 border-b border-white/10 text-gray-300 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4">Order ID</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Products</th>
                <th className="px-4 py-4">Vendor</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Total</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {userOrders.length === 0 ? (
                <tr>
                  <td className="text-center text-gray-400 p-6" colSpan={8}>
                    No orders found
                  </td>
                </tr>
              ) : (
                userOrders.map((order: any) => {
                  const vendorName = order.productVendor?.shopName || "—";

                  return (
                    <tr
                      key={order._id}
                      className="border-t border-white/5 hover:bg-white/10 transition-all duration-200"
                    >
                      <td className="px-4 py-4 text-sm">
                        #{String(order._id).slice(-8)}
                      </td>

                      <td className="px-4 py-4 text-sm">{formatDate(order.createdAt)}</td>

                      <td className="px-4 py-4 text-sm">
                        {order.products.map((p: any, i: number) => (
                          <div key={i} className="text-gray-200">
                            {i + 1}. {p.product?.title || p.product?._id} × {p.quantity}
                          </div>
                        ))}
                      </td>

                      <td className="px-4 py-4 text-sm">{vendorName}</td>

                      <td className="px-4 py-4 text-sm">
                        {order.paymentMethod.toUpperCase()}
                        <div
                          className={`text-xs ${order.isPaid ? "text-green-300" : "text-yellow-300"
                            }`}
                        >
                          {order.isPaid ? "Paid" : "Pending"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm capitalize">
                        {order.orderStatus}
                      </td>

                      <td className="px-4 py-4 text-right text-green-300 font-semibold">
                        ₹ {order.totalAmount}
                      </td>

                      <td className="px-4 py-4 flex justify-center">
                        {order.orderStatus === "cancelled" && (
                          <span className="text-red-400 font-semibold">Cancelled</span>
                        )}

                        {order.orderStatus === "returned" && (
                          <div className="text-center">
                            <span className="text-yellow-400 font-semibold block">
                              Returned
                            </span>
                            <span className="text-xs text-green-300">
                              Refund: ₹{order.returnedAmount}
                            </span>
                          </div>
                        )}

                        {order.orderStatus !== "cancelled" &&
                          order.orderStatus !== "returned" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-3 py-1 bg-white/10 rounded hover:bg-white/20"
                              >
                                Check Details
                              </button>

                              <button
                                disabled={order.orderStatus === "delivered"}
                                onClick={() =>
                                  order.orderStatus !== "delivered" &&
                                  setTrackOrderModal(order)
                                }
                                className={`px-3 py-1 rounded flex items-center gap-2 transition
    ${order.orderStatus === "delivered"
                                    ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                                    : "bg-white/10 hover:bg-white/20"
                                  }
  `}
                              >
                                <FiTruck />
                                {order.orderStatus === "delivered" ? "Delivered" : "Track Order"}
                              </button>

                            </div>
                          )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ---------------------- */}
        {/* SMALL SCREEN CARDS UPDATED */}
        {/* ---------------------- */}
        <div className="lg:hidden space-y-4">
          {userOrders.map((order: any) => {
            const vendorName = order.productVendor?.shopName || "—";

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 p-4 rounded-xl"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-gray-300">
                      #{String(order._id).slice(-8)}
                    </div>

                    <div className="font-semibold">{formatDate(order.createdAt)}</div>

                    <div className="text-xs text-gray-400 mt-1">{vendorName}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-green-300 font-bold">
                      ₹ {order.totalAmount}
                    </div>
                  </div>
                </div>

                {/* Payment + Status Added */}
                <div className="mt-3 flex justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Payment</div>
                    <div
                      className={`text-sm font-semibold ${order.isPaid ? "text-green-400" : "text-yellow-400"
                        }`}
                    >
                      {order.isPaid ? "Paid" : "Pending"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-400">Status</div>
                    <div className="text-sm font-semibold capitalize">
                      {order.orderStatus}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {order.products.map((p: any, i: number) => (
                    <div key={i} className="text-sm text-gray-200">
                      {p.product?.title || p.product?._id} × {p.quantity}
                    </div>
                  ))}
                </div>

                {order.orderStatus === "returned" && (
                  <div className="mt-3">
                    <p className="text-yellow-400 font-semibold">Returned</p>
                    <p className="text-xs text-green-300">
                      Refund Amount: ₹{order.returnedAmount}
                    </p>
                  </div>
                )}

                {order.orderStatus === "cancelled" && (
                  <div className="mt-3 text-red-400 font-semibold">
                    Cancelled
                  </div>
                )}

                {order.orderStatus !== "cancelled" &&
                  order.orderStatus !== "returned" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 py-2 bg-white/10 rounded"
                      >
                        Check Details
                      </button>

                      <button
                        disabled={order.orderStatus === "delivered"}
                        onClick={() =>
                          order.orderStatus !== "delivered" &&
                          setTrackOrderModal(order)
                        }
                        className={`py-2 px-3 rounded flex items-center gap-2 transition
    ${order.orderStatus === "delivered"
                            ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                            : "bg-white/10 hover:bg-white/20"
                          }
  `}
                      >
                        <FiTruck />
                        {order.orderStatus === "delivered" ? "Delivered" : "Track Order"}
                      </button>

                    </div>
                  )}

              </motion.div>
            );
          })}
        </div>

        {/* ---------------------- */}
        {/* CHECK DETAILS MODAL */}
        {/* ---------------------- */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setSelectedOrder(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 w-full max-w-3xl bg-[#061526] border border-white/10 p-6 rounded-xl shadow-2xl shadow-black/40"
            >
              <h2 className="text-lg font-semibold">
                Order Details #{String(selectedOrder._id).slice(-10)}
              </h2>

              <p className="text-sm text-gray-300">{formatDate(selectedOrder.createdAt)}</p>

              <hr className="my-4 border-white/10" />

              {/* Products */}
              <h3 className="font-semibold mb-2">Products</h3>
              {selectedOrder.products.map((p: any, i: number) => (
                <div key={i} className="flex justify-between bg-white/5 p-3 rounded mb-2">
                  <div>
                    <div className="font-medium">{p.product?.title}</div>
                    <div className="text-xs text-gray-300">
                      Qty: {p.quantity} • Price: ₹ {p.price}
                    </div>
                  </div>

                  <div className="font-semibold text-green-300">
                    ₹ {p.quantity * p.price}
                  </div>
                </div>
              ))}

              <hr className="my-4 border-white/10" />

              {/* Billing */}
              <h3 className="font-semibold mb-2">Invoice</h3>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Products Total</span>
                  <span>₹ {selectedOrder.productsTotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>₹ {selectedOrder.deliveryCharge}</span>
                </div>

                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>₹ {selectedOrder.serviceCharge}</span>
                </div>

                <hr className="my-2 border-white/10" />

                <div className="flex justify-between font-semibold text-green-300">
                  <span>Final Total</span>
                  <span>₹ {selectedOrder.totalAmount}</span>
                </div>
              </div>
              {selectedOrder.orderStatus === "delivered" &&
                selectedOrder.deliveryDate && (
                  <div className="mt-3 text-sm text-green-400">
                    Delivered on:{" "}
                    {new Date(selectedOrder.deliveryDate).toLocaleDateString("en-IN")}
                  </div>
                )}

              {/* IMPORTANT NOTE */}
              {selectedOrder.isPaid == true && selectedOrder.paymentMethod == "stripe" && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs rounded-lg p-3 mt-4">
                <p className="font-semibold mb-1">Important Note:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Order cancellation feature is <b>not available if payment is done
                      using Online Payment (Stripe)</b>.
                  </li>
                  <li>You can only <b>return the product</b> after delivery.</li>
                  <li>On return, you will receive only the <b>product amount</b>.</li>
                  <li><b>Delivery & service charges are non-refundable.</b></li>
                </ul>
              </div>}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-white/10 rounded"
                >
                  Close
                </button>

                <button
                  disabled={selectedOrder.orderStatus === "delivered"}
                  onClick={() =>
                    selectedOrder.orderStatus !== "delivered" &&
                    setTrackOrderModal(selectedOrder)
                  }
                  className={`px-4 py-2 rounded flex items-center gap-2 transition
    ${selectedOrder.orderStatus === "delivered"
                      ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                    }
  `}
                >
                  <FiTruck />
                  {selectedOrder.orderStatus === "delivered"
                    ? "Delivered"
                    : "Track Order"}
                </button>

                {/* RETURN OR CANCEL BUTTON BASED ON STATUS */}
                {/* RETURN / CANCEL BUTTON WITH RETURN DAYS LOGIC */}
                {selectedOrder.orderStatus === "delivered" ? (
                  (() => {
                    const deliveryDate = selectedOrder.deliveryDate;

                    return selectedOrder.products.map((p: any, i: number) => {
                      const replacementDays = p.product?.replacementDays || 0;

                      const eligible = isReturnEligible(
                        deliveryDate,
                        replacementDays
                      );

                      const remaining = getRemainingReturnDays(
                        deliveryDate,
                        replacementDays
                      );

                      const returnEndDate = getReturnEndDate(
                        deliveryDate,
                        replacementDays
                      );

                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-white/5 px-3 py-2 rounded ml-2"
                        >
                          <div>
                            <p className="text-xs text-gray-300">
                              {p.product?.title}
                            </p>

                            {eligible ? (
                              <>
                                <p className="text-xs text-yellow-400">
                                  Return available for {remaining} day
                                  {remaining > 1 ? "s" : ""}
                                </p>

                                {returnEndDate && (
                                  <p className="text-[11px] text-gray-400">
                                    Return till:{" "}
                                    {returnEndDate.toLocaleDateString("en-IN")}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-red-400">
                                Return window closed
                              </p>
                            )}
                          </div>

                          {eligible && (
                            <button
                              onClick={() => handleReturnOrder(selectedOrder._id)}

                              className="mx-3 px-3 py-1 bg-yellow-600 rounded text-sm"
                            >
                              Return
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()
                ) : (

                  <button
                    disabled={isCancelDisabled(selectedOrder)}
                    onClick={() => handleCancelOrder(selectedOrder._id)}
                    className={`px-4 py-2 rounded ${isCancelDisabled(selectedOrder)
                      ? "bg-white/10 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                      }`}
                  >
                    Cancel Order
                  </button>
                )}





              </div>
            </motion.div>
          </div>
        )}

        {/* ---------------------- */}
        {/* TRACK ORDER MODAL (UPDATED LINE + ADDRESS) */}
        {/* ---------------------- */}
        {trackOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setTrackOrderModal(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 w-full max-w-md bg-[#061526] border border-white/10 p-6 rounded-xl"
            >
              <h2 className="text-lg font-semibold">Track Order</h2>

              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                <span className="font-semibold">{trackOrderModal.address.name}</span>
                <br />
                {trackOrderModal.address.address},<br />
                {trackOrderModal.address.city}, {trackOrderModal.address.state} -{" "}
                {trackOrderModal.address.pincode}
                <br />
                Phone: {trackOrderModal.address.phone}
              </p>

              {/* STATUS TRACK */}
              {renderTrackStep(trackOrderModal.orderStatus)}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setTrackOrderModal(null)}
                  className="px-4 py-2 bg-white/10 rounded"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
