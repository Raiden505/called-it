import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Called It — Football predictions", template: "%s · Called It" },
  description: "Call the score before kickoff, compete with friends, and earn the receipt when you get it right.",
  applicationName: "Called It",
  icons: { icon: "/icon.svg", apple: "/apple-icon.svg" },
  openGraph: { type: "website", siteName: "Called It", title: "Called It — Football predictions", description: "Call the score before kickoff. Prove you knew it." },
  twitter: { card: "summary", title: "Called It — Football predictions", description: "Call the score before kickoff. Prove you knew it." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
