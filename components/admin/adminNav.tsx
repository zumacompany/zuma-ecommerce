import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Tags,
  Store,
  BarChart3,
  Settings,
  ShieldCheck,
  Package,
  MapPin,
  CreditCard,
  Layers3,
  TicketPercent,
} from "lucide-react"

export type AdminNavItem = {
  href: string
  labelKey: string
  icon: typeof LayoutDashboard
}

export type AdminNavSection = {
  labelKey: string
  items: AdminNavItem[]
}

export const adminNavSections: AdminNavSection[] = [
  {
    labelKey: "navGroup.operations",
    items: [
      { href: "/admin", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", labelKey: "nav.orders", icon: ShoppingBag },
      { href: "/admin/customers", labelKey: "nav.customers", icon: Users },
    ],
  },
  {
    labelKey: "navGroup.merchandising",
    items: [
      { href: "/admin/categories", labelKey: "nav.categories", icon: Tags },
      { href: "/admin/brands", labelKey: "nav.brands", icon: Store },
      { href: "/admin/regions", labelKey: "nav.regions", icon: MapPin },
      { href: "/admin/offers", labelKey: "nav.offers", icon: TicketPercent },
      { href: "/admin/inventory", labelKey: "nav.inventory", icon: Package },
    ],
  },
  {
    labelKey: "navGroup.experience",
    items: [
      { href: "/admin/site", labelKey: "nav.site", icon: Layers3 },
      { href: "/admin/analytics", labelKey: "nav.analytics", icon: BarChart3 },
    ],
  },
  {
    labelKey: "navGroup.system",
    items: [
      { href: "/admin/payment-methods", labelKey: "nav.payments", icon: CreditCard },
      { href: "/admin/settings", labelKey: "nav.settings", icon: Settings },
      { href: "/admin/users", labelKey: "nav.users", icon: ShieldCheck },
    ],
  },
]

const flatNav = adminNavSections.flatMap((section) => section.items)

export function findAdminNavItem(pathname: string) {
  return (
    flatNav.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    ) || null
  )
}
