"use client";

import { useRouter } from "next/navigation";
import { FiHome } from "react-icons/fi";

export default function HomeButton({
  label = "Home",
}: {
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15 hover:border-white/25"
    >
      <FiHome size={16} />
      {label}
    </button>
  );
}
