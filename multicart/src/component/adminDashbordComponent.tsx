"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import getAllVendorData from "@/hooks/getAllVendorData";
import getAllOrdersData from "@/hooks/getAllOrderData";

export default function AdminDashboardPage() {
  getAllVendorData();
  getAllOrdersData();

  const { allVendorData, allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );
  const { allOrderData } = useSelector(
    (state: RootState) => state.order
  );

  const vendors = allVendorData || [];

  const pendingVendors = vendors.filter(
    (v: any) => v.verificationStatus === "pending"
  );

  const pendingProducts = allProductsData.filter(
    (p: any) => p.verificationStatus === "pending"
  );

  const deliveredOrders = allOrderData.filter(
    (o: any) => o.orderStatus === "delivered"
  );
  const cancelledOrders = allOrderData.filter(
    (o: any) => o.orderStatus === "cancelled"
  );
  const returnedOrders = allOrderData.filter(
    (o: any) => o.orderStatus === "returned"
  );
  const remainingOrders = allOrderData.filter(
    (o: any) =>
      !["delivered", "cancelled", "returned"].includes(o.orderStatus)
  );

  let totalEarnings = 0;
  deliveredOrders.forEach((o: any) => {
    if (o.isPaid) totalEarnings += o.totalAmount;
  });

  const vendorOrderMap: Record<string, number> = {};
  allOrderData.forEach((o: any) => {
    const name = o.productVendor?.shopName || "Unknown";
    vendorOrderMap[name] = (vendorOrderMap[name] || 0) + 1;
  });

  const vendorOrderGraph = Object.keys(vendorOrderMap).map(
    (name) => ({
      vendor: name.length > 14 ? name.slice(0, 14) + "..." : name,
      orders: vendorOrderMap[name],
    })
  );

  const orderProgress = [
    { name: "Delivered", value: deliveredOrders.length },
    { name: "Pending", value: remainingOrders.length },
    { name: "Cancelled", value: cancelledOrders.length },
    { name: "Returned", value: returnedOrders.length },
  ];

  const COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f97316"];

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 py-6 text-white">
      <div className="max-w-full mx-auto space-y-8">

        {/* HEADER */}
        <h1 className="text-xl sm:text-2xl font-bold">
          Admin Dashboard
        </h1>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBox title="Total Vendors" value={vendors.length} />
          <StatBox title="Pending Vendors" value={pendingVendors.length} />
          <StatBox title="Total Products" value={allProductsData.length} />
          <StatBox title="Pending Products" value={pendingProducts.length} />
          <StatBox title="Total Orders" value={allOrderData.length} />
          <StatBox title="Total Earnings" value={`₹ ${totalEarnings}`} />
        </div>

        {/* ================= VENDOR DETAILS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor: any) => {
            const vendorProducts = allProductsData.filter(
              (p: any) =>
                String(p.vendor?._id || p.vendor) ===
                String(vendor._id)
            );

            const vendorOrders = allOrderData.filter(
              (o: any) =>
                String(o.productVendor?._id || o.productVendor) ===
                String(vendor._id)
            );

            const cancelled = vendorOrders.filter(
              (o: any) => o.orderStatus === "cancelled"
            ).length;

            const returned = vendorOrders.filter(
              (o: any) => o.orderStatus === "returned"
            ).length;

            let vendorEarning = 0;
            vendorOrders.forEach((o: any) => {
              if (o.orderStatus === "delivered" && o.isPaid) {
                vendorEarning += o.totalAmount;
              }
            });

            return (
              <div
                key={vendor._id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <h2 className="font-semibold text-base truncate">
                  {vendor.shopName}
                </h2>

                <p className="text-xs text-gray-400 mb-2">
                  Status:{" "}
                  <span
                    className={
                      vendor.verificationStatus === "approved"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  >
                    {vendor.verificationStatus}
                  </span>
                </p>

                <div className="text-sm space-y-1">
                  <p>Products: {vendorProducts.length}</p>
                  <p>Orders: {vendorOrders.length}</p>
                  <p className="text-red-400">
                    Cancelled: {cancelled}
                  </p>
                  <p className="text-orange-400">
                    Returned: {returned}
                  </p>
                  <p className="text-green-400 font-semibold">
                    Earnings: ₹ {vendorEarning}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= GRAPHS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BAR GRAPH */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-[280px] sm:h-[350px]">
            <h2 className="font-semibold mb-2 text-sm">
              Vendor-wise Orders
            </h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorOrderGraph}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="vendor"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PIE + STATUS */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="font-semibold mb-3 text-sm">
              Order Status Distribution
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatusBox label="Delivered" value={deliveredOrders.length} color="text-green-400" />
              <StatusBox label="Pending" value={remainingOrders.length} color="text-blue-400" />
              <StatusBox label="Cancelled" value={cancelledOrders.length} color="text-red-400" />
              <StatusBox label="Returned" value={returnedOrders.length} color="text-orange-400" />
            </div>

            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderProgress}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {orderProgress.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatBox({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase text-gray-400">{title}</p>
      <p className="text-lg sm:text-2xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

function StatusBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}
