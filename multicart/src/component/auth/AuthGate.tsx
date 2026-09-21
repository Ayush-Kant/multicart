"use client";

import { useSession } from "next-auth/react";
import LoginRequired from "./LoginRequired";

type AuthGateProps = {
  children: React.ReactNode;
  callbackUrl: string;
  title?: string;
  description?: string;
};

export default function AuthGate({
  children,
  callbackUrl,
  title,
  description,
}: AuthGateProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-[55vh] flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Checking your account...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <LoginRequired
        callbackUrl={callbackUrl}
        title={title}
        description={description}
      />
    );
  }

  return <>{children}</>;
}
