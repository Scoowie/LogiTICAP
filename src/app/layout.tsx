import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TICAP Logistics", template: "%s | TICAP Logistics" },
  description: "Centralized Scheduling and Logistics Services for TICAP.",
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
