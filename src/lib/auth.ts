import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.githubId = String(profile.id ?? "");
        token.isAdmin =
          String(profile.id ?? "") === process.env.ADMIN_GITHUB_ID;
        token.picture = (profile as Record<string, unknown>).avatar_url as string | undefined;
        token.name = profile.name ?? (profile as Record<string, unknown>).login as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.githubId as string) ?? "";
      session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      return session;
    },
  },
});
