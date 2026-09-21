"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { signIn } from "next-auth/react";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = sanitizeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/"
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || password.length < 6) {
      setErrorMessage(
        "Enter a valid name, email, and a password of at least 6 characters."
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await axios.post("/api/auth/register", {
        name: normalizedName,
        email: normalizedEmail,
        password,
      });

      // Automatically authenticate the newly-created account so that signup
      // follows the same callback flow as login.
      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.replace(
          `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to create your account. Please try again."
        );
      } else {
        setErrorMessage(
          "Unable to create your account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-semibold text-center mb-2 text-blue-300">
          Create Your Account
        </h2>

        <p className="text-center text-sm text-gray-400 mb-6">
          Join MultiCart and continue shopping immediately.
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            required
            className="bg-white/10 border border-white/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />

          <input
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            required
            className="bg-white/10 border border-white/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
            {loading ? (
              <ClipLoader size={24} color="white" />
            ) : (
              "Create Account"
            )}
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 h-px bg-gray-600" />
            <span className="px-3 text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-600" />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleSignup}
            className="flex items-center justify-center gap-3 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl transition"
          >
            <FcGoogle className="w-5 h-5" />
            <span className="font-medium">Continue with Google</span>
          </motion.button>

          <p className="text-center text-sm mt-4 text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                )
              }
              className="text-blue-400 hover:underline hover:text-blue-300 transition"
            >
              Sign in
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
