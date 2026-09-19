"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { setAllOrderData } from "@/redux/orderSlice";
import axios from "axios";
import { motion } from "framer-motion";
import { FiEdit3 } from "react-icons/fi";

export default function VendorOrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { allOrderData } = useSelector((state: RootState) => state.order);
  const { userData } = useSelector((state: RootState) => state.user);

  const [otpModal, setOtpModal] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/order/allOrder");
        dispatch(setAllOrderData(res.data.orders || res.data || []));
      } catch {
        dispatch(setAllOrderData([]));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [dispatch]);

  if (!userData || userData.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Access Denied
      </div>
    );
  }

  const vendorOrders = useMemo(
    () =>
      (allOrderData || []).filter(
        (o: any) =>
          String(o.productVendor?._id || o.productVendor) ===
          String(userData._id)
      ),
    [allOrderData, userData]
  );

  const updateStatus = async (orderId: string, status: string) => {
    try {
      setLoadingId(orderId);
      await axios.post("/api/order/update-status", { orderId, status });
      dispatch(
        setAllOrderData(
          allOrderData.map((o: any) =>
            o._id === orderId ? { ...o, orderStatus: status } : o
          )
        )
      );
    } finally {
      setLoadingId(null);
    }
  };

  const verifyAndDeliver = async () => {
    try {
      setLoadingId(otpModal._id);
      await axios.post("/api/order/verify-delivery-otp", {
        orderId: otpModal._id,
        otp: otpInput,
      });
      dispatch(
        setAllOrderData(
          allOrderData.map((o: any) =>
            o._id === otpModal._id
              ? { ...o, orderStatus: "delivered" }
              : o
          )
        )
      );
      setOtpModal(null);
      setOtpInput("");
    } finally {
      setLoadingId(null);
    }
  };

  const statusOptions = ["pending", "confirmed", "shipped", "delivered"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-8 text-white">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendor Orders</h1>
        <span className="text-gray-300">{vendorOrders.length} orders</span>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden sm:block bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Buyer</th>
              <th className="p-4">Products</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Update</th>
            </tr>
          </thead>
          <tbody>
            {vendorOrders.map((order: any) => (
              <tr key={order._id} className="border-t border-white/10">
                <td className="p-4">#{order._id.slice(-8)}</td>
                <td className="p-4">
                  {order.address?.name}
                  <div className="text-xs text-gray-400">
                    {order.address?.phone}
                  </div>
                </td>
                <td className="p-4">
                  {order.products.map((p: any, i: number) => (
                    <div key={i}>
                      {p.product?.title} × {p.quantity}
                    </div>
                  ))}
                </td>
                <td className="p-4">
                  {order.paymentMethod}
                  <div className="text-xs">
                    {order.isPaid ? "Paid" : "Pending"}
                  </div>
                </td>
                <td className="p-4 capitalize">{order.orderStatus}</td>
                <td className="p-4 text-center">
                  {order.orderStatus === "cancelled" && (
                    <span className="text-red-400 font-semibold capitalize">
                      Cancelled
                    </span>
                  )}

                  {order.orderStatus === "delivered" && (
                    <span className="text-green-400 font-semibold capitalize">
                      Delivered
                    </span>
                  )}
                  {order.orderStatus === "returned" && (
                    <span className="text-orange-400 font-semibold capitalize">
                      Returned
                    </span>
                  )}

                  {order.orderStatus !== "cancelled" &&
                    order.orderStatus !== "delivered" &&
                    order.orderStatus !== "returned" && (
                      <select
                        disabled={loadingId === order._id}
                        value={order.orderStatus}
                        onChange={async (e) => {
                          if (e.target.value === "delivered") {
                            await axios.post("/api/order/update-status", {
                              orderId: order._id,
                              status: "delivered",
                            });
                            setOtpModal(order);
                          } else {
                            updateStatus(order._id, e.target.value);
                          }
                        }}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s} className="bg-black">
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE BOX UI ================= */}
      <div className="sm:hidden space-y-4">
        {vendorOrders.map((order: any) => (
          <motion.div
            key={order._id}
            whileHover={{ scale: 1.02 }}
            className="bg-white/10 border border-white/20 rounded-xl p-4"
          >
            <div className="flex justify-between mb-2">
              <span className="text-sm">#{order._id.slice(-8)}</span>
              <span className="text-green-400 font-bold">
                ₹{order.totalAmount}
              </span>
            </div>

            <p className="text-sm">
              <b>Buyer:</b> {order.address?.name}
            </p>
            <p className="text-xs text-gray-400">
              {order.address?.phone}
            </p>

            <div className="mt-2 text-sm">
              {order.products.map((p: any, i: number) => (
                <p key={i}>
                  {p.product?.title} × {p.quantity}
                </p>
              ))}
            </div>

            <div className="mt-3 text-sm">
              <b>Status:</b>{" "}
              <span className="capitalize">{order.orderStatus}</span>
            </div>

            {order.orderStatus === "cancelled" && (
              <div className="mt-3 text-sm font-semibold text-red-400">
                Status: Cancelled
              </div>
            )}

            {order.orderStatus === "delivered" && (
              <div className="mt-3 text-sm font-semibold text-green-400">
                Status: Delivered
              </div>
            )}
            {order.orderStatus === "returned" && (
              <div className="mt-3 text-sm font-semibold text-orange-400">
                Status: Returned
              </div>
            )}

            {order.orderStatus !== "cancelled" &&
              order.orderStatus !== "delivered" &&
              order.orderStatus !== "returned" && (
                <select
                  disabled={loadingId === order._id}
                  value={order.orderStatus}
                  onChange={async (e) => {
                    if (e.target.value === "delivered") {
                      await axios.post("/api/order/update-status", {
                        orderId: order._id,
                        status: "delivered",
                      });
                      setOtpModal(order);
                    } else {
                      updateStatus(order._id, e.target.value);
                    }
                  }}
                  className="mt-3 w-full bg-white/10 border border-white/20 rounded px-3 py-2"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s} className="bg-black">
                      {s}
                    </option>
                  ))}
                </select>
              )}


          </motion.div>
        ))}
      </div>

      {/* ================= OTP MODAL ================= */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#061526] p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">
              Enter Delivery OTP
            </h2>
            <input
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="w-full bg-white/10 border border-white/20 px-4 py-2 rounded mb-4"
              placeholder="Enter OTP"
            />
            <button
              onClick={verifyAndDeliver}
              className="w-full bg-green-600 py-2 rounded flex items-center justify-center gap-2"
            >
              <FiEdit3 /> Verify & Deliver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
