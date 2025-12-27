import { supabaseAdmin } from '../../lib/supabase/server'
import CheckoutClient from '../../components/CheckoutClient'
import Link from 'next/link'

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function CheckoutPage({ searchParams }: Props) {
  const offerId = typeof searchParams?.offerId === 'string' ? searchParams.offerId : null
  const qty = typeof searchParams?.qty === 'string' ? parseInt(searchParams.qty, 10) || 1 : 1

  if (!offerId) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-2xl font-semibold">No data</h2>
            <p className="mt-2 text-sm text-muted">Selected offer not found.</p>
            <div className="mt-4">
              <Link href="/">Go back to home</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const { data: offer, error: offerErr } = await supabaseAdmin.from('offers').select('*, brand:brands(id, name, slug)').eq('id', offerId).maybeSingle()

  if (offerErr) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">{offerErr.message}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!offer) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-2xl font-semibold">No data</h2>
            <p className="mt-2 text-sm text-muted">Selected offer not found.</p>
            <div className="mt-4">
              <Link href="/">Go back to home</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const { data: paymentMethods, error: pmErr } = await supabaseAdmin.from('payment_methods').select('id, name, type, instructions_md, details').eq('status', 'active').order('sort_order')

  if (pmErr) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">{pmErr.message}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="py-8">
      <div className="container max-w-[1200px] grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-2 text-sm text-muted">Complete the form to create your order and receive payment instructions.</p>

          <div className="mt-6">
            <CheckoutClient
              offer={offer}
              qty={qty}
              paymentMethods={paymentMethods ?? []}
            />
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="rounded-xl bg-card p-6 border border-borderc">
              <h3 className="text-lg font-semibold">Order summary</h3>
              <div className="mt-2 text-sm text-muted">{offer.brand?.name} — {offer.region_code}</div>
              <div className="mt-2">{offer.denomination_currency} {offer.denomination_value}</div>
              <div className="mt-2">Quantity: {qty}</div>
              <div className="mt-3 font-semibold">Total: {(offer.price * qty).toFixed(2)} {offer.denomination_currency}</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
