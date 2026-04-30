import type { ReactNode } from 'react'

export default function CheckoutShell({
  header,
  children,
}: {
  header: ReactNode
  children: ReactNode
}) {
  return (
    <main className="py-8">
      <div className="container max-w-[1200px]">
        <div className="max-w-3xl">{header}</div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
