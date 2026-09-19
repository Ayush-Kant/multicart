"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import Image from "next/image";
import { setAllProductsData } from "@/redux/vendorSlice";
import getAllProductsData from "@/hooks/getAllProductsData";

type Product = {
  _id: string;
  title: string;
  price: number;
  category: string;
  image1: string;
  description: string;
  verificationStatus?: "pending" | "approved" | "rejected";
  isActive?: boolean;
  rejectedReason?: string;
};

export default function ProductRequest() {
  const dispatch = useDispatch();
  getAllProductsData()

  const allProductsData: Product[] = useSelector(
    (state: any) => state.vendor.allProductsData
  );

  // ✅ ONLY PENDING PRODUCTS
  const pendingProducts = Array.isArray(allProductsData)
    ? allProductsData.filter((p) => p.verificationStatus === "pending")
    : [];

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // ✅ APPROVE PRODUCT
  const handleApprove = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);

      await axios.post("/api/admin/update-product-status", {
        productId: selectedProduct._id,
        status: "approved",
      });

      const updated = allProductsData.map((p) =>
        p._id === selectedProduct._id
          ? { ...p, verificationStatus: "approved" }
          : p
      );

      dispatch(setAllProductsData(updated));

      setSelectedProduct(null);
      setLoading(false);
      alert("✅ Product Approved");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("❌ Approval failed");
    }
  };

  // ❌ OPEN REJECT
  const openRejectForm = () => {
    setRejectReason("");
    setShowRejectModal(true);
  };

  // ❌ CONFIRM REJECT
  const confirmReject = async () => {
    if (!selectedProduct || !rejectReason.trim()) {
      alert("Rejection reason required");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/api/admin/update-product-status", {
        productId: selectedProduct._id,
        status: "rejected",
        rejectedReason: rejectReason,
      });

      const updated = allProductsData.map((p) =>
        p._id === selectedProduct._id
          ? {
              ...p,
              verificationStatus: "rejected",
              rejectReason,
            }
          : p
      );

      dispatch(setAllProductsData(updated));

      setShowRejectModal(false);
      setSelectedProduct(null);
      setLoading(false);
      alert("❌ Product Rejected");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("❌ Rejection failed");
    }
  };

  return (
    <div className="w-full px-3 sm:px-6 lg:px-10 py-6 text-white">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6">
        Product Approval Requests
      </h1>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Title</th>
              <th className="p-4">Price</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {pendingProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No Pending Product Requests
                </td>
              </tr>
            ) : (
              pendingProducts.map((product) => (
                <tr
                  key={product._id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-4">
                    <Image
                      src={product.image1}
                      alt="img"
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                  </td>
                  <td className="p-4">{product.title}</td>
                  <td className="p-4">₹ {product.price}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300">
                      Pending
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Check
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden flex flex-col gap-4">
        {pendingProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white/10 border border-white/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Image
                src={product.image1}
                alt="img"
                width={60}
                height={60}
                className="rounded"
              />
              <div>
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-sm text-gray-400">₹ {product.price}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedProduct(product)}
              className="mt-4 w-full bg-blue-600 py-2 rounded-lg"
            >
              Check Details
            </button>
          </div>
        ))}
      </div>

      {/* ================= PRODUCT MODAL ================= */}
      <AnimatePresence>
        {selectedProduct && !showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-white/10"
            >
              <h2 className="text-xl font-bold mb-4">Product Details</h2>

              <Image
                src={selectedProduct.image1}
                alt="img"
                width={50}
                height={40}
                className="rounded mb-4"
              />

              <div className="space-y-2 text-sm">
                <p><b>Title:</b> {selectedProduct.title}</p>
                <p><b>Price:</b> ₹ {selectedProduct.price}</p>
                <p><b>Category:</b> {selectedProduct.category}</p>
                <p><b>Description:</b> {selectedProduct.description}</p>
                <p>
                  <b>Status:</b>{" "}
                  <span className="text-yellow-400">Pending</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  disabled={loading}
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg"
                >
                  {loading ? "Processing..." : "Approve"}
                </button>

                <button
                  onClick={openRejectForm}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg"
                >
                  Reject
                </button>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= REJECT MODAL ================= */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-white/10"
            >
              <h2 className="text-lg font-bold mb-4 text-red-400">
                Reject Product
              </h2>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm"
                rows={4}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={confirmReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg"
                >
                  Confirm Reject
                </button>

                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
