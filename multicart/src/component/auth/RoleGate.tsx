"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginRequired from "./LoginRequired";

type AppRole = "user" | "vendor" | "admin";

type RoleGateProps = {
  children: React.ReactNode;
  allowedRoles: AppRole | AppRole[];
  callbackUrl: string;
  title?: string;
  description?: string;
};

export default function RoleGate({
  children,
  allowedRoles,
  callbackUrl,
  title = "You do not have access to this area",
  description = "This section is restricted to authorized MultiCart accounts.",
}: RoleGateProps) {
  const { status, data: session } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-[55vh] flex items-center justify-center bg-black text-white">
        <div className="h-9 w-9 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <LoginRequired
        callbackUrl={callbackUrl}
        title="Sign in to access seller tools"
        description="Vendor tools require an authenticated seller account."
      />
    );
  }

  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!session.user.role || !roles.includes(session.user.role)) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-3 text-gray-400">{description}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            Return to MultiCart
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
