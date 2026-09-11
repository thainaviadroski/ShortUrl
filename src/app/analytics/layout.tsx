import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Short URL | Analytics",
};

export default function AnalyticsLayout({ children }: LayoutProps<"/analytics">) {
  return children;
}
