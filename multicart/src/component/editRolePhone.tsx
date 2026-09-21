"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { AiOutlineUser, AiOutlineShop } from "react-icons/ai";
import axios from "axios";

export default function EditRolePhone() {
  const [role, setRole] = useState<"user" | "vendor" | "">("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const roles = [
    {
      label: "Customer",
      value: "user" as const,
      icon: <AiOutlineUser size={40} />,
    },
    {
      label: "Vendor",
      value: "vendor" as const,
      icon: <AiOutlineShop size={40} />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role || !/^\d{10}$/.test(phone)) {
      alert("Select a role and enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/user/edit-role-mobile", { role, phone });
      router.push("/");
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Unable to update your account details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white/10"
      >
        <h2 className="text-4xl font-semibold text-center mb-4">
          Choose Your Role
        </h2>

        <p className="text-center text-gray-300 mb-8 text-base">
          Choose how you want to use your MultiCart account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <input
            type="tel"
            placeholder="Enter Mobile Number"
            maxLength={10}
            inputMode="numeric"
            required
            className="bg-white/10 border border-white/30 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {roles.map((rol) => (
              <motion.button
                type="button"
                key={rol.value}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRole(rol.value)}
                className={
                  "p-6 text-center rounded-2xl border transition text-lg font-medium " +
                  (role === rol.value
                    ? "border-blue-500 bg-blue-500/40"
                    : "border-white/20 bg-white/10 hover:bg-white/20")
                }
              >
                <div className="flex justify-center mb-3">
                  {rol.icon}
                </div>
                <span>{rol.label}</span>
              </motion.button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-700 py-4 rounded-xl font-medium text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <ClipLoader size={28} color="white" /> : "Continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
