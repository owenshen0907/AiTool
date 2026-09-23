import "./globals.css";
import { cookies } from "next/headers";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import {
  fetchUnifiedProfile,
  getUnifiedProfileAccountName,
  getUnifiedProfileDisplayName,
} from "@/lib/auth/unifiedBackend";
import { isAdminProfile } from "@/lib/auth/admin";
import { UserProvider, User } from "./providers/UserProvider";
import ClientBoot from "./ClientBoot";

export const metadata = {
  title: "AiTool 2.0",
  description: "Owen Shen personal tools, products, notes, and AI workbench.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tokenCookie = (await cookies()).get("sessionToken")?.value;
  let initialUser: User | null = null;

  if (tokenCookie) {
    try {
      const profile = await fetchUnifiedProfile(tokenCookie);
      initialUser = {
        name: getUnifiedProfileAccountName(profile),
        displayName: getUnifiedProfileDisplayName(profile),
        email: profile.email,
        isAdmin: isAdminProfile(profile),
      };
    } catch (e) {
      console.error("SSR unified backend fetch-profile failed", e);
    }
  }

  return (
    <html lang="zh-CN">
      <head></head>
      <body>
        <UserProvider initialUser={initialUser}>
          <ClientBoot />
          <NavBar />
          {children}
          <Footer />
          <LoginModal />
        </UserProvider>
      </body>
    </html>
  );
}
