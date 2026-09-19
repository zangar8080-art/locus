import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "RouteStress | A route that can take a hit.", description: "Stress test an international university application route." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
