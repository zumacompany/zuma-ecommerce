import StorefrontFrame from "../../components/storefront/StorefrontFrame";

/**
 * Public storefront layout — wraps browsing and checkout routes with the
 * public Header and Footer. Customer-account and admin routes live in
 * separate route groups.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontFrame>{children}</StorefrontFrame>;
}
