"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import getAllVendorData from "@/hooks/getAllVendorData";

type Product = {
  _id: string;
  title: string;
  price: number;
  image1: string;
  description: string;
  category: string;
  verificationStatus?: "pending" | "approved" | "rejected";
  isActive?: boolean;
};

type Vendor = {
  _id: string;
  name: string;
  phone?: string;
  shopName?: string;
  gstNumber?: string;
  verificationStatus?: "pending" | "approved" | "rejected";
  vendorProducts?: Product[];
};

export default function VendorDetails() {

getAllVendorData()
 
  const allVendorData: Vendor[] = useSelector(
    (state: any) => state.vendor.allVendorData
  );

  const approvedVendors = Array.isArray(allVendorData)
    ? allVendorData.filter(v => v.verificationStatus === "approved")
    : [];

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  return (
    <div className="w-full p-4 md:p-8 text-white">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Approved Vendors
      </h1>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Shop</th>
              <th className="p-4">Phone</th>
              <th className="p-4">GST</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {approvedVendors.map(vendor => (
              <tr key={vendor._id} className="border-t border-white/10">
                <td className="p-4">{vendor.name}</td>
                <td className="p-4">{vendor.shopName}</td>
                <td className="p-4">{vendor.phone}</td>
                <td className="p-4">{vendor.gstNumber}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => setSelectedVendor(vendor)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded-md text-sm"
                  >
                    Check Products
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden flex flex-col gap-4">
        {approvedVendors.map(vendor => (
          <motion.div
            key={vendor._id}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/10 border border-white/20 rounded-xl p-4"
          >
            <p><b>Name:</b> {vendor.name}</p>
            <p><b>Shop:</b> {vendor.shopName}</p>
            <p><b>Phone:</b> {vendor.phone}</p>
            <p><b>GST:</b> {vendor.gstNumber}</p>

            <button
              onClick={() => setSelectedVendor(vendor)}
              className="mt-3 w-full bg-blue-600 py-2 rounded-lg"
            >
              Check Products
            </button>
          </motion.div>
        ))}
      </div>

      {/* ================= PRODUCT MODAL ================= */}
      <AnimatePresence>
        {selectedVendor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900 p-6 rounded-2xl w-full max-w-xl border border-white/10"
            >
              <h2 className="text-xl font-bold mb-4">
                Products of {selectedVendor.shopName}
              </h2>

              {selectedVendor.vendorProducts?.length ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {selectedVendor.vendorProducts.map(product => (
                    <motion.div
                      key={product._id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/10 p-4 rounded-lg border border-white/20"
                    >
                      <div className="flex gap-3 items-center">
                        <Image
                          src={product.image1}
                          alt="product"
                          width={70}
                          height={70}
                          className="rounded object-cover"
                        />

                        <div>
                          <p className="font-semibold">{product.title}</p>
                          <p className="text-sm text-gray-300">
                            ₹{product.price}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm space-y-1">
                        <p><b>Category:</b> {product.category}</p>
                        <p><b>Description:</b> {product.description}</p>

                        <p>
                          <b>Verification:</b>{" "}
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              product.verificationStatus === "approved"
                                ? "bg-green-600/30 text-green-400"
                                : product.verificationStatus === "pending"
                                ? "bg-yellow-600/30 text-yellow-400"
                                : "bg-red-600/30 text-red-400"
                            }`}
                          >
                            {product.verificationStatus}
                          </span>
                        </p>

                        <p>
                          <b>Active:</b>{" "}
                          <span
                            className={`${
                              product.isActive
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {product.isActive ? "Yes" : "No"}
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 mt-6">
                  No Product Found Yet
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedVendor(null)}
                className="mt-6 w-full bg-gray-700 hover:bg-gray-800 py-2 rounded-lg"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
