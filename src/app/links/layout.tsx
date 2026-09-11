import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Short URL | Link",
};

export default function LinksLayout({ children }: LayoutProps<"/links">) {
  return children;
}
