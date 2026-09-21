import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type AppRole = "user" | "vendor" | "admin";

export async function getAuthContext() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function getRoleAuthContext(
  allowedRoles: AppRole | AppRole[]
) {
  const result = await getAuthContext();

  if (result.response || !result.session) {
    return result;
  }

  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!roles.includes(result.session.user.role)) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return result;
}
