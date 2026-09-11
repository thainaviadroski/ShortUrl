import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Short URL | Sign in",
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
