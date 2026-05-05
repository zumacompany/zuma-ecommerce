import type { ReactNode } from "react";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";

export default function StorefrontFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
