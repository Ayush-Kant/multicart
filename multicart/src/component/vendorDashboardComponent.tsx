"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import getCurrentUser from "@/hooks/getCurrentUser";
import getAllOrdersData from "@/hooks/getAllOrderData";
import getAllProductsData from "@/hooks/getAllProductsData";

export default function VendorDashboardPage() {
  getCurrentUser();
  getAllOrdersData();
  getAllProductsData();

  const { userData } = useSelector((state: RootState) => state.user);
  const { allOrderData } = useSelector((state: RootState) => state.order);
  const { allProductsData } = useSelector((state: RootState) => state.vendor);

  /* ================= ACCESS ================= */
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (userData.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Access Denied
      </div>
    );
  }

  /* ================= DATA ================= */
  const vendorOrders = allOrderData.filter(
    (o: any) =>
      String(o.productVendor?._id || o.productVendor) ===
      String(userData._id)
  );

  const vendorProducts = allProductsData.filter(
    (p: any) =>
      String(p.vendor?._id || p.vendor) === String(userData._id)
  );

  const validOrders = vendorOrders.filter(
    (o: any) =>
      o.orderStatus !== "cancelled" &&
      o.orderStatus !== "returned"
  );

  let totalSales = 0;
  const customers = new Set<string>();
  validOrders.forEach((o: any) => {
    totalSales += o.totalAmount;
    customers.add(String(o.buyer?._id || o.buyer));
  });

  /* ================= BAR DATA ================= */
  const ordersDateMap: Record<string, number> = {};
  validOrders.forEach((o: any) => {
    const d = new Date(o.createdAt).toLocaleDateString("en-IN");
    ordersDateMap[d] = (ordersDateMap[d] || 0) + 1;
  });

  const ordersByDate = Object.keys(ordersDateMap).map((d) => ({
    date: d,
    orders: ordersDateMap[d],
  }));

  /* ================= LINE DATA ================= */
  const productSalesMap: Record<string, number> = {};
  validOrders.forEach((o: any) =>
    o.products.forEach((p: any) => {
      const t = p.product?.title || "Unknown";
      productSalesMap[t] = (productSalesMap[t] || 0) + p.quantity;
    })
  );

  const productSales = Object.keys(productSalesMap).map((t) => ({
    product: t.length > 12 ? t.slice(0, 12) + "..." : t,
    sold: productSalesMap[t],
  }));

  /* ================= PIE DATA ================= */
  const statusData = [
    {
      name: "Delivered",
      value: vendorOrders.filter(o => o.orderStatus === "delivered").length,
      color: "text-green-400",
    },
    {
      name: "Pending",
      value: vendorOrders.filter(
        o => !["delivered","cancelled","returned"].includes(o.orderStatus)
      ).length,
      color: "text-blue-400",
    },
    {
      name: "Cancelled",
      value: vendorOrders.filter(o => o.orderStatus === "cancelled").length,
      color: "text-red-400",
    },
    {
      name: "Returned",
      value: vendorOrders.filter(o => o.orderStatus === "returned").length,
      color: "text-orange-400",
    },
  ];

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f97316"];

  /* ================= UI ================= */
  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 text-white">
      <div className="max-w-full mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h1 className="text-xl sm:text-2xl font-bold">
            {userData.shopName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 break-all">
            {userData.email}
          </p>
        </div>

        {/* MAIN STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox title="Customers" value={customers.size} />
          <StatBox title="Products" value={vendorProducts.length} />
          <StatBox title="Orders" value={validOrders.length} />
          <StatBox title="Sales" value={`₹ ${totalSales}`} />
        </div>

        {/* ================= PIE + STATUS (ABOVE OTHER GRAPHS) ================= */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">
            Order Status Overview
          </h2>

          {/* STATUS BOXES INSIDE SAME CARD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {statusData.map((s) => (
              <div
                key={s.name}
                className="bg-black/40 border border-white/10 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-gray-400">{s.name}</p>
                <p className={`text-xl font-bold ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* PIE CHART */}
          <div className="h-[260px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= OTHER GRAPHS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* BAR */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-[260px] sm:h-[320px]">
            <h2 className="text-sm font-semibold mb-2">
              Orders by Date
            </h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LINE */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-[260px] sm:h-[320px]">
            <h2 className="text-sm font-semibold mb-2">
              Product Sales
            </h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="product"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sold"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= STAT BOX ================= */
function StatBox({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase text-gray-400">{title}</p>
      <p className="text-lg sm:text-2xl font-bold">{value}</p>
    </div>
  );
}
