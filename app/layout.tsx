import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Called It",
  description: "Make the call. Earn the points. Prove you knew it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
