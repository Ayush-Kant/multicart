"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setAllVendorData } from "@/redux/vendorSlice";
import getAllVendorData from "@/hooks/getAllVendorData";

type Vendor = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  shopName?: string;
  businessAddress?: string;
  gstNumber?: string;
  verificationStatus?: "pending" | "approved" | "rejected";
};

export default function VendorRequest() {
  const dispatch = useDispatch();
  getAllVendorData()

  const allVendorData: Vendor[] = useSelector(
    (state: any) => state.vendor.allVendorData
  );

  const pendingVendors = Array.isArray(allVendorData)
    ? allVendorData.filter((v) => v.verificationStatus === "pending")
    : [];

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // ✅ APPROVE
  const handleApprove = async () => {
    if (!selectedVendor) return;

    try {
      setLoading(true);

      await axios.post("/api/admin/update-vendor-status", {
        vendorId: selectedVendor._id,
        status: "approved",
      });

      const updated = allVendorData.filter(
        (v) => v._id !== selectedVendor._id
      );
      dispatch(setAllVendorData(updated));

      setSelectedVendor(null);
      setLoading(false);
      alert("Vendor Approved ✅");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Approval failed ❌");
    }
  };

  // ❌ OPEN REJECT FORM
  const openRejectForm = () => {
    setRejectReason("");
    setShowRejectModal(true);
  };

  // ❌ CONFIRM REJECTION
  const confirmReject = async () => {
    if (!selectedVendor || !rejectReason.trim()) {
      alert("Rejection reason required");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/api/admin/update-vendor-status", {
        vendorId: selectedVendor._id,
        status: "rejected",
        rejectedReason: rejectReason,
      });

      const updated = allVendorData.filter(
        (v) => v._id !== selectedVendor._id
      );
      dispatch(setAllVendorData(updated));

      setShowRejectModal(false);
      setSelectedVendor(null);
      setLoading(false);
      alert("Vendor Rejected ❌");
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Rejection failed ❌");
    }
  };

  return (
    <div className="w-full px-3 sm:px-6 lg:px-10 py-6 text-white">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center sm:text-left">
        Vendor Approval Requests
      </h1>

      {/* ================= DESKTOP TABLE (md+) ================= */}
      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Vendor Name</th>
              <th className="p-4">Shop Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {pendingVendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No Pending Vendor Requests
                </td>
              </tr>
            ) : (
              pendingVendors.map((vendor) => (
                <tr
                  key={vendor._id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-4">{vendor.name}</td>
                  <td className="p-4">{vendor.shopName || "-"}</td>
                  <td className="p-4">{vendor.phone || "-"}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300">
                      Pending
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Check Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARD VIEW (sm) ================= */}
      <div className="md:hidden flex flex-col gap-4">
        {pendingVendors.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No Pending Vendor Requests
          </div>
        ) : (
          pendingVendors.map((vendor) => (
            <div
              key={vendor._id}
              className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{vendor.name}</h3>
                <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300">
                  Pending
                </span>
              </div>

              <p className="text-sm text-gray-300">
                <b>Shop:</b> {vendor.shopName || "-"}
              </p>
              <p className="text-sm text-gray-300">
                <b>Phone:</b> {vendor.phone || "-"}
              </p>

              <button
                onClick={() => setSelectedVendor(vendor)}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-sm py-2 rounded-lg"
              >
                Check Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* ================= DETAILS MODAL ================= */}
      <AnimatePresence>
        {selectedVendor && !showRejectModal && (
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
              <h2 className="text-xl sm:text-2xl font-bold mb-4">
                Vendor Details
              </h2>

              <div className="space-y-2 text-sm">
                <p><b>Name:</b> {selectedVendor.name}</p>
                <p><b>Email:</b> {selectedVendor.email}</p>
                <p><b>Phone:</b> {selectedVendor.phone}</p>
                <p><b>Shop:</b> {selectedVendor.shopName}</p>
                <p><b>Address:</b> {selectedVendor.businessAddress}</p>
                <p><b>GST:</b> {selectedVendor.gstNumber}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  disabled={loading}
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm"
                >
                  {loading ? "Processing..." : "Approve"}
                </button>

                <button
                  onClick={openRejectForm}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm"
                >
                  Reject
                </button>

                <button
                  onClick={() => setSelectedVendor(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 py-2 rounded-lg text-sm"
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
                Reject Vendor
              </h2>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm"
                rows={4}
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={confirmReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm"
                >
                  Confirm Reject
                </button>

                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 py-2 rounded-lg text-sm"
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
