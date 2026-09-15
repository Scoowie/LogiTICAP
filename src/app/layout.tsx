import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Unofficial TICAP Logistics Portal",
    template: "%s | Unofficial TICAP Logistics Portal",
  },
  description:
    "An unofficial scheduling and logistics portal prototype for TICAP.",
};

export const viewport: Viewport = {
  themeColor: "#153f6f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
