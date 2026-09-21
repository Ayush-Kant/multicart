declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: "user" | "vendor" | "admin";
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    role?: "user" | "vendor" | "admin";
  }
}

export {};
