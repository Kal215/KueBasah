import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/db";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// Extend the default session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "OWNER" | "KITCHEN";
    };
  }
  
  interface User {
    id: string;
    username: string;
    role: "OWNER" | "KITCHEN";
  }
}

// Extend JWT type
interface ExtendedJWT extends JWT {
  id: string;
  username: string;
  role: "OWNER" | "KITCHEN";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password harus diisi");
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          throw new Error("Username tidak ditemukan");
        }

        // Verify password
        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role as "OWNER" | "KITCHEN",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      const extToken = token as ExtendedJWT;
      return {
        ...session,
        user: {
          id: extToken.id,
          username: extToken.username,
          role: extToken.role,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
