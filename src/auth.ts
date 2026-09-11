import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod/v4";
import { db } from "@/db";
import { UserRepository } from "@/repository/UserRepository";
import { verifyPassword } from "@/lib/password";
import { redis } from "@/lib/redis";

const userRepository = new UserRepository(db);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60;

class TooManyAttemptsError extends CredentialsSignin {
  code = "too-many-attempts";
}

function loginAttemptsKey(email: string) {
  return `auth:login-attempts:${email.toLowerCase()}`;
}

async function isLockedOut(email: string) {
  const attempts = await redis.get(loginAttemptsKey(email));
  return Number(attempts ?? 0) >= MAX_LOGIN_ATTEMPTS;
}

async function recordFailedAttempt(email: string) {
  const key = loginAttemptsKey(email);
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, LOCKOUT_WINDOW_SECONDS);
  }
}

async function clearFailedAttempts(email: string) {
  await redis.del(loginAttemptsKey(email));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        if (await isLockedOut(email)) {
          throw new TooManyAttemptsError();
        }

        const user = await userRepository.getUserByEmail(email);

        if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
          await recordFailedAttempt(email);
          return null;
        }

        await clearFailedAttempts(email);

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
