"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const session = useSession()
  console.log(session?.data?.user)

  // Email/password login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
     
     const res = await signIn("credentials", {
      email,
      password,
      redirect: false, // 🔹 Prevents auto-redirect
    });

    setLoading(false);

    if (res?.error) {
      alert("Invalid Email or Password");
    } else {
      router.push("/"); // 🔹 Redirect to Home on Success
    }
    } catch (error) {
      console.log(error)
      setLoading(false);
    }
    

  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20"
      >
        <h1 className="text-3xl font-semibold text-center mb-8">
          Welcome Back to <span className="text-blue-400">MultiCart</span>
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email Address"
            required
            className="bg-white/10 border border-white/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full bg-white/10 border border-white/30 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={22} />
              ) : (
                <AiOutlineEye size={22} />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-700 py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <ClipLoader size={30} color="white"/> : "Login"}
          </button>

          {/* Divider */}
          <div className="flex items-center my-3">
            <div className="flex-1 h-px bg-gray-600"></div>
            <span className="px-3 text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          {/* Google Login */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={()=>signIn("google",{callbackUrl:"/"})}
            className="flex items-center justify-center gap-3 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl transition"
          >
            <FcGoogle
              className="w-5 h-5"
            />
            <span className="font-medium">Login with Google</span>
          </motion.button>

          <p className="text-center text-sm mt-4 text-gray-400">
            Don’t have an account?{" "}
            <span
              onClick={()=>router.push("/signup")}
              className="text-blue-400 hover:underline hover:text-blue-300 transition"
            >
              Create one
            </span>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
