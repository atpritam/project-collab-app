import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!response.ok) {
            if (response.status === 403) {
              const data = await response.json();
              // specific error for email verification
              throw new Error(
                JSON.stringify({
                  message: data.message,
                  emailVerified: false,
                  email: data.email,
                })
              );
            }
            // other errors
            console.error(
              "Login failed:",
              response.status,
              await response.text()
            );
            return null;
          }

          const user = await response.json();

          if (user && user.id) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            };
          }

          return null;
        } catch (error) {
          console.error("Error during login:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }

      if (profile) {
        const OAuthProfile = profile as any;
        token.email_verified = OAuthProfile.email_verified;
      }

      if (account && account.provider && account.providerAccountId) {
        try {
          if (account.provider === "github") {
            token.email_verified = new Date().toISOString();
          }

          // syncing OAuth info with backend
          const fetchUserResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL
            }/api/users/byEmail?email=${encodeURIComponent(
              token.email as string
            )}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          let existingUserData = null;
          if (fetchUserResponse.ok) {
            existingUserData = await fetchUserResponse.json();
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: token.email,
                name: existingUserData?.name || user?.name,
                image: existingUserData?.image || user?.image,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                email_verified: existingUserData
                  ? undefined
                  : token.email_verified ?? null,
              }),
            }
          );

          if (response.ok) {
            const userData = await response.json();
            token.id = userData.id;
            token.name = userData.name;
            token.image = userData.image;
          }
        } catch (error) {
          console.error("Error syncing OAuth with backend:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
