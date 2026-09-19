"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { AiOutlineUser, AiOutlineShop, AiOutlineTool } from "react-icons/ai";
import axios from "axios";

export default function EditRolePhone() {
  const [role, setRole] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(false); // ✅ new
  const router = useRouter();

  const roles = [
    { label: "Admin", value: "admin", icon: <AiOutlineTool size={40} /> },
    { label: "Vendor", value: "vendor", icon: <AiOutlineShop size={40} /> },
    { label: "User", value: "user", icon: <AiOutlineUser size={40} /> },
  ];

  // ✅ Check if Admin already exists
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.get("/api/admin/check-admin");
        setAdminExists(res.data.exists); // true / false
      } catch (error) {
        console.log("Admin check error:", error);
      }
    };
    checkAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role || !phone) {
      alert("Please select a role and enter your phone number.");
      return;
    }

    if (role === "admin" && adminExists) {
      alert("❌ Admin already exists. You cannot select Admin role.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/user/edit-role-mobile", { role, phone });
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
        className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white/10"
      >
        <h2 className="text-4xl font-semibold text-center mb-4">
          Choose Your Role
        </h2>

        <p className="text-center text-gray-300 mb-8 text-base">
          Select your role and enter your mobile number to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* 📞 Mobile Number Input */}
          <input
            type="text"
            placeholder="Enter Mobile Number"
            maxLength={10}
            pattern="[0-9]{10}"
            required
            className="bg-white/10 border border-white/30 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* 🔘 Role Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {roles.map((rol) => {
              const isAdminBlocked =
                rol.value === "admin" && adminExists;

              return (
                <motion.div
                  key={rol.value}
                  whileHover={!isAdminBlocked ? { scale: 1.07 } : {}}
                  onClick={() => {
                    if (isAdminBlocked) {
                      alert(
                        "⚠️ Admin already exists. You cannot select Admin role."
                      );
                      return;
                    }
                    setRole(rol.value);
                  }}
                  className={`cursor-pointer p-6 text-center rounded-2xl border transition text-lg font-medium
                    ${
                      role === rol.value
                        ? "border-blue-500 bg-blue-500/40"
                        : "border-white/20 bg-white/10 hover:bg-white/20"
                    }
                    ${isAdminBlocked && "opacity-40 cursor-not-allowed"}
                  `}
                >
                  <div className="flex justify-center mb-3">
                    {rol.icon}
                  </div>
                  <p>{rol.label}</p>

                  {isAdminBlocked && (
                    <p className="text-xs text-red-400 mt-2">
                      Admin already exists
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ✅ Submit Button */}
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
