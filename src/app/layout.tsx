import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canopies of Care",
  description:
    "A history of mutual aid as American civic tradition — from 1787 to the present.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
