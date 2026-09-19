"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import getAllOrdersData from "@/hooks/getAllOrderData";

export default function AllOrdersPage() {
  // Fetch all orders
  getAllOrdersData();

  const { allOrderData } = useSelector(
    (state: RootState) => state.order
  );

  const orders = allOrderData || [];

  // Format date
  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ STATUS COLOR HELPER
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-400";
      case "cancelled":
        return "text-red-400";
      case "returned":
        return "text-orange-400";
      case "confirmed":
        return "text-blue-400";
      case "shipped":
        return "text-indigo-400";
      default:
        return "text-yellow-400"; // pending
    }
  };

  return (
    <div className="w-full p-4 sm:p-8 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          All Orders
        </h1>
        <p className="text-gray-300">
          {orders.length} orders
        </p>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden sm:block overflow-x-auto bg-white/5 rounded-xl border border-white/10 shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Buyer</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Products</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400">
                  No Orders Found
                </td>
              </tr>
            ) : (
              orders.map((order: any) => (
                <tr
                  key={order._id}
                  className="border-t border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-4">
                    #{String(order._id).slice(-8)}
                  </td>

                  <td className="p-4 capitalize">
                    {order.address?.name}
                    <br />
                    <span className="text-xs text-gray-400">
                      {order.address?.phone}
                    </span>
                  </td>

                  <td className="p-4 capitalize">
                    {order.productVendor?.shopName || "N/A"}
                    <br />
                    <span className="text-xs text-gray-400">
                      {order.productVendor?.email || "no email"}
                    </span>
                  </td>

                  <td className="p-4">
                    {order.products.map((p: any, i: number) => (
                      <div key={i}>
                        {p.product?.title} × {p.quantity}
                      </div>
                    ))}
                  </td>

                  <td className="p-4 font-semibold text-green-300">
                    ₹ {order.totalAmount}
                  </td>

                  <td className="p-4">
                    {order.paymentMethod.toUpperCase()}
                    <div
                      className={`text-xs ${
                        order.isPaid
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {order.isPaid ? "Paid" : "Pending"}
                    </div>
                  </td>

                  {/* STATUS WITH COLOR */}
                  <td
                    className={`p-4 capitalize font-semibold ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus}
                  </td>

                  <td className="p-4">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="sm:hidden space-y-4 mt-4">
        {orders.map((order: any) => (
          <motion.div
            key={order._id}
            whileHover={{ scale: 1.02 }}
            className="bg-white/10 rounded-xl p-4 border border-white/20"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-gray-300 text-sm">
                  #{String(order._id).slice(-8)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <p className="text-green-400 font-bold">
                ₹ {order.totalAmount}
              </p>
            </div>

            <div className="mt-3">
              <p className="text-sm">
                <b>Buyer:</b> {order.address?.name}
              </p>
              <p className="text-xs text-gray-400">
                {order.address?.phone}
              </p>
            </div>

            <div className="mt-3">
              <p className="text-sm">
                <b>Vendor:</b> {order.productVendor?.shopName}
              </p>
              <p className="text-xs text-gray-400">
                {order.productVendor?.email}
              </p>
            </div>

            <div className="mt-3 text-sm">
              {order.products.map((p: any, i: number) => (
                <p key={i}>
                  {p.product?.title} × {p.quantity}
                </p>
              ))}
            </div>

            <div className="mt-3 text-sm space-y-1">
              <p>
                <b>Payment:</b> {order.paymentMethod}{" "}
                <span
                  className={
                    order.isPaid
                      ? "text-green-400"
                      : "text-yellow-400"
                  }
                >
                  ({order.isPaid ? "Paid" : "Pending"})
                </span>
              </p>

              {/* STATUS WITH COLOR */}
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`capitalize font-semibold ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus}
                </span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
