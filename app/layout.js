import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Anam's Wake",
  description:
    "Death isn't the end, it's a negotiation. A Kenyan thriller: a young professional mourner is sent to guide a wealthy family through a wake, only to discover Death has come for more than their patriarch. Directed by Likarion Wainaina.",
};

export const viewport = {
  themeColor: "#08070a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="grain font-body antialiased">
        <div className="vignette" />
        {children}
      </body>
    </html>
  );
}
