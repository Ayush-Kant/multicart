"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { buildLoginUrl } from "@/lib/auth-redirect";

export default function useRequireLogin() {
  const { status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const requireLogin = (callbackUrl?: string) => {
    if (isAuthenticated) return true;\n    if (isLoading) return false;

    const currentUrl =
      callbackUrl ||
      (typeof window !== "undefined"
        ? window.location.pathname +
          window.location.search +
          window.location.hash
        : "/");

    router.push(buildLoginUrl(currentUrl));
    return false;
  };

  return {
    isAuthenticated,
    isLoading,
    requireLogin,
  };
}
