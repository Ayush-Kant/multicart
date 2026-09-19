"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { AiOutlineShop, AiOutlineHome, AiOutlineFileText } from "react-icons/ai";
import axios from "axios";

export default function EditVendorDetails() {
  const [shopName, setShopName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName || !businessAddress || !gstNumber) {
      alert("Please fill all vendor details");
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post("/api/vendor/update-details", {
        shopName,
        businessAddress,
        gstNumber,
      });
      console.log(result.data)
      alert("Vendor Shop Details added Successfully")
      setLoading(false);
      router.push("/");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/10"
      >
        <h2 className="text-3xl font-semibold text-center mb-4">
          Complete Your Shop Details
        </h2>

        <p className="text-center text-gray-300 mb-6 text-sm">
          Enter your business information to activate your vendor account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* 🏪 Shop Name */}
          <div className="relative">
            <AiOutlineShop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input
              type="text"
              placeholder="Shop Name"
              required
              className="w-full bg-white/10 border border-white/30 rounded-lg p-3 pl-10
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          {/* 🏠 Shop Address */}
          <div className="relative">
            <AiOutlineHome className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input
              type="text"
              placeholder="Business Address"
              required
              className="w-full bg-white/10 border border-white/30 rounded-lg p-3 pl-10
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
            />
          </div>

          {/* 📄 GST Number */}
          <div className="relative">
            <AiOutlineFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input
              type="text"
              placeholder="GST Number"
              required
              className="w-full bg-white/10 border border-white/30 rounded-lg p-3 pl-10
                         focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-700 py-3 rounded-xl 
                       font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <ClipLoader size={26} color="white" /> : "Submit Details"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
