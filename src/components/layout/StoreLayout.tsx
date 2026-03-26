import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface StoreLayoutProps {
  children: ReactNode;
}

const StoreLayout = ({ children }: StoreLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Header is `fixed`, so add a consistent spacer below it for all pages. */}
      <div aria-hidden className="h-28 lg:h-32" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
