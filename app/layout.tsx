import "../styles/globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import Providers from "../components/Providers";

export const metadata = {
  title: "Zuma",
  description: "Gift Cards, Streaming e Crypto Vouchers",
};

/**
 * Root layout — minimal shell that applies to every route group.
 * Public chrome lives in app/(public), customer chrome lives in
 * app/(customer), and admin chrome lives in app/admin.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
