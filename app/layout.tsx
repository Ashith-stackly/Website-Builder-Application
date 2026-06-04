import type { Metadata, Viewport } from "next";
import { Geist_Mono, Lora } from "next/font/google";
import NavBarShell from "@/components/NavBarShell";
import RouteLoadingOverlay from "@/components/RouteLoadingOverlay";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const titleIconPath = `${basePath}/stackly-title-icon.webp`;

export const metadata: Metadata = {
  title: "Stackly | Drag and Drop Website Builder",
  description: "Build responsive websites with Stackly templates and no-code tools.",
  icons: {
    icon: [{ url: titleIconPath, type: "image/webp", sizes: "25x35" }],
  },
};

/** Edge-to-edge on notched devices; pinch and accessibility zoom allowed (WCAG). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lora.variable} ${geistMono.variable} antialiased`}
      >
        <div className="stackly-site-layout">
          <RouteLoadingOverlay />
          <NavBarShell />
          {children}
        </div>
      </body>
    </html>
  );
}
