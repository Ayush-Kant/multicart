import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";

const SESSION_MAX_AGE = 10 * 24 * 60 * 60;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        await connectDb();

        const user = await User.findOne({ email });

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        if (!user.password) {
          throw new Error(
            "This account does not have a password. Please continue with Google."
          );
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      await connectDb();

      let dbUser = await User.findOne({
        email: user.email.toLowerCase(),
      });

      if (!dbUser) {
        dbUser = await User.create({
          name: user.name || "MultiCart User",
          email: user.email.toLowerCase(),
          image: user.image || undefined,
          role: "user",
        });
      }

      user.id = dbUser._id.toString();
      user.name = dbUser.name;
      user.email = dbUser.email;
      user.role = dbUser.role;
      user.image = dbUser.image || user.image || undefined;

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.picture = user.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.name = String(token.name ?? session.user.name ?? "");
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.role =
          (token.role as "user" | "vendor" | "admin" | undefined) ?? "user";

        if (token.picture) {
          session.user.image = String(token.picture);
        }
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },

  jwt: {
    maxAge: SESSION_MAX_AGE,
  },

  secret: process.env.AUTH_SECRET,
});
