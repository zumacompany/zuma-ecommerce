import StorefrontFrame from "../../components/storefront/StorefrontFrame";

/**
 * Storefront layout — wraps all customer-facing pages with the
 * public Header and Footer. This layout is NOT applied to admin routes,
 * which have their own layout via app/admin/layout.tsx.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontFrame>{children}</StorefrontFrame>
  )
}
