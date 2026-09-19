"use client";
import React, { useState } from "react";
import VendorDashbordLayout from "./VendorDashbordLayout";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";
import mongoose from "mongoose";
import { IUser } from "@/models/user.model";



function VenderDashboard({ user }: { user: IUser }) {


  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [shopName, setShopName] = useState(user?.shopName || "");
  const [businessAddress, setBusinessAddress] = useState(user?.businessAddress || "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "");
  const [loading, setLoading] = useState(false);

  // ✅ SUBMIT RE-VERIFICATION
  const handleVerifyAgain = async () => {
    if (!shopName || !businessAddress || !gstNumber) {
      alert("All fields are required");
      return;
    }
setLoading(true);
    try {
      

      await axios.post("/api/vendor/verify-again", {
        shopName,
        businessAddress,
        gstNumber,
      });

      alert("Verification request sent again ✅");
     setLoading(false)
   
    } catch (error) {
      console.log(error);
      alert("Failed to send verification ❌");
      setLoading(false)
  }
}

  // ✅ IF USER NOT LOADED
  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // ✅ ============================
  // ✅ CASE 1 → VERIFIED ✅
  // ✅ ============================
  if (user.verificationStatus === "approved") {
    return (
      <div className="w-full min-h-screen pt-16">
        <VendorDashbordLayout />
      </div>
    );
  }

  // ✅ ============================
  // ✅ CASE 2 → REJECTED ❌
  // ✅ ============================
  if (user.verificationStatus === "rejected") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
        <div className="bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl border border-white/30 max-w-2xl w-full text-center">
          <h2 className="text-4xl font-bold mb-4 text-red-400">
            Verification Rejected ❌
          </h2>

          <p className="text-gray-200 text-lg mb-4">
            Your business verification was rejected by admin.
          </p>

          <div className="text-sm text-red-300 mb-6">
            Reason: {user.rejectedReason || "No reason provided"}
          </div>

          {!showVerifyForm ? (
            <button
              onClick={() => setShowVerifyForm(true)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
            >
              Verify Again
            </button>
          ) : (
            <div className="mt-6 text-left space-y-4">
              <input
                type="text"
                placeholder="Shop Name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-3 rounded bg-white/10 border border-white/20"
              />

              <input
                type="text"
                placeholder="Business Address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full p-3 rounded bg-white/10 border border-white/20"
              />

              <input
                type="text"
                placeholder="GST Number"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full p-3 rounded bg-white/10 border border-white/20"
              />

              <button
                onClick={handleVerifyAgain}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
              >
                {loading ? "Submitting..." : "Submit & Verify Again"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ ============================
  // ✅ CASE 3 → PENDING ⏳
  // ✅ ============================
  if (user.verificationStatus === "pending") {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
      <div className="bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl border border-white/30 max-w-2xl w-full text-center">
        <h2 className="text-4xl font-bold mb-6 text-blue-400">
          Verification Pending ⏳
        </h2>

        <p className="text-gray-200 text-lg leading-relaxed">
          You can access vendor dashboard only after
          <span className="font-semibold"> admin verification</span>.
        </p>

        <div className="mt-6 text-base text-gray-300">
          Current Status:{" "}
          <span className="text-blue-400 font-semibold uppercase">
            {user.verificationStatus}
          </span>
        </div>

        <div className="mt-10 text-sm text-gray-400">
          It usually takes 2–3 hours.
        </div>
      </div>
    </div>
  );
}}

export default VenderDashboard;
