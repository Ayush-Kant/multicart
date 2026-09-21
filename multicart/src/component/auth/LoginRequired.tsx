"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AiOutlineLock, AiOutlineLogin } from "react-icons/ai";
import { buildLoginUrl } from "@/lib/auth-redirect";

type LoginRequiredProps = {
  title?: string;
  description?: string;
  callbackUrl?: string;
  compact?: boolean;
};

export default function LoginRequired({
  title = "Please sign in to continue",
  description = "Create an account or sign in to access this feature.",
  callbackUrl = "/",
  compact = false,
}: LoginRequiredProps) {
  const router = useRouter();

  return (
    <div
      className={
        compact
          ? "w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white"
          : "min-h-[55vh] w-full flex items-center justify-center px-4 py-12 text-white"
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={
          compact
            ? "mx-auto max-w-lg"
            : "w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.045] p-8 sm:p-10 text-center backdrop-blur-xl shadow-2xl"
        }
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
          <AiOutlineLock className="text-blue-300" size={30} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm sm:text-base text-gray-400">
          {description}
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(buildLoginUrl(callbackUrl))}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
          >
            <AiOutlineLogin size={18} />
            Sign in
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
              )
            }
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10 transition"
          >
            Create account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
