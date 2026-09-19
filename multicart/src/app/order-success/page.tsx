"use client";

import { motion } from "framer-motion";
import { FaCheckCircle, FaBox } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function OrderSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-10 max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="flex justify-center"
        >
          <FaCheckCircle className="text-green-400" size={120} />
        </motion.div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mt-6">
          Order Placed Successfully
        </h1>

        {/* Sub Message */}
        <div className="flex flex-col items-center gap-2 mt-4 text-gray-300">
          <FaBox size={32} className="text-blue-300" />
          <p>Your order has been received and is now being processed.</p>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push("/orders")}
          className="mt-8 w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Go to Orders Page
        </motion.button>
      </motion.div>
    </div>
  );
}
