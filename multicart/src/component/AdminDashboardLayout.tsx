'use client'
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import { MdDashboard } from "react-icons/md";
import { FaUsers, FaShoppingBag, FaStore, FaCheckCircle, FaBox } from "react-icons/fa";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import VendorRequest from "./vendorRequest";
import VendorDetails from "./VendorDetails";
import ProductRequest from "./ProductRequest";
import AllOrdersPage from "./allOrderAdmin";
import AdminDashboardPage from "./adminDashbordComponent";

export default function AdminDashbordLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  // ---------------- PAGES ----------------




  

 
  

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <AdminDashboardPage/>;
      case "vendors": return <VendorDetails />;
      case "orders": return <AllOrdersPage />;
      case "vendor-approval": return <VendorRequest />;
      case "product-approval": return <ProductRequest />;
      default: return <AdminDashboardPage/>;
    }
  };

  // ---------------- MENU ----------------

  const menu = [
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={22} /> },
    { id: "vendors", label: "Vendor Details", icon: <FaStore size={22} /> },
    { id: "orders", label: "User Orders", icon: <FaShoppingBag size={22} /> },
    { id: "vendor-approval", label: "Vendor Approval", icon: <FaCheckCircle size={22} /> },
    { id: "product-approval", label: "Product Requests", icon: <FaBox size={22} /> },
  ];

  return (
    <div className="w-full flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">

      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="lg:hidden fixed top-15 left-0 w-full bg-black px-6 py-3 flex justify-between items-center border-b border-gray-700 z-50">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button onClick={() => setMenuOpen(true)}>
          {!menuOpen && <AiOutlineMenu size={25} />}
        </button>
      </div>

      {/* ---------------- SIDEBAR LARGE DEVICES ---------------- */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="hidden lg:block w-72 bg-gray-800/40 border-r border-gray-700 p-6 backdrop-blur-xl"
      >
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

        <div className="flex flex-col gap-3">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm
                  ${
                    activePage === item.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ---------------- MOBILE SIDEBAR (SLIDE) ---------------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-0 left-0 w-72 h-full bg-gray-800/90 backdrop-blur-xl p-6 z-50 border-r border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <button onClick={() => setMenuOpen(false)}>
                <AiOutlineClose size={26} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {menu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm
                      ${
                        activePage === item.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- MAIN AREA ---------------- */}
      <motion.div
        key={activePage}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-10 mt-16 lg:mt-0"
      >
        {renderPage()}
      </motion.div>
    </div>
  );
}
