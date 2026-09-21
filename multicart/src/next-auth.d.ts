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

export {};
