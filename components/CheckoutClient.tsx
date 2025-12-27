"use client";
import { useEffect, useMemo, useState } from "react";

type Offer = {
  id: string;
  region_code: string;
  denomination_value: number;
  denomination_currency: string;
  price: number;
  brand?: { id: string; name: string; slug: string };
}

type PaymentMethod = { id: string; name: string; type: string; instructions_md?: string | null; details?: any }

export default function CheckoutClient({ offer, qty: initialQty, paymentMethods }: { offer: Offer; qty: number; paymentMethods: PaymentMethod[] }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [countryPrefix, setCountryPrefix] = useState("+1")
  const [whatsapp, setWhatsapp] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<string | null>(paymentMethods[0]?.id ?? null)
  const [manualConfirmed, setManualConfirmed] = useState(false)
  const [qty, setQty] = useState(initialQty ?? 1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null)

  const selectedPaymentMethod = useMemo(() => paymentMethods.find((p) => p.id === selectedPayment) ?? null, [paymentMethods, selectedPayment])

  useEffect(() => {
    // analytics: checkout_started
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'checkout_started', path: '/checkout', metadata: { offer_id: offer.id } }) }).catch(() => {})
  }, [offer.id])

  function validEmail(e: string) {
    return /\S+@\S+\.\S+/.test(e)
  }

  const valid = name.trim() !== '' && validEmail(email) && whatsapp.trim() !== '' && selectedPayment && (selectedPaymentMethod?.type !== 'manual' || manualConfirmed) && qty > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError(null)

    // analytics: payment_method_selected already sent on change; click_buy event
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'click_buy', path: '/checkout', metadata: { offer_id: offer.id, qty } }) }).catch(() => {})

    try {
      const items = [{ offer_id: offer.id, qty, unit_price: offer.price }]
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_whatsapp: `${countryPrefix}${whatsapp}`,
          payment_method_id: selectedPayment,
          items,
          currency: offer.denomination_currency,
          session_id: null
        })
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setSuccessOrderNumber(json.orderNumber ?? null)
        // server also records order_created event
      }
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    } finally {
      setSubmitting(false)
    }
  }

  function onPaymentChange(id: string) {
    setSelectedPayment(id)
    setManualConfirmed(false)
    // analytics: payment_method_selected
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'payment_method_selected', path: '/checkout', metadata: { payment_method_id: id } }) }).catch(() => {})
  }

  if (successOrderNumber) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Order created</h3>
        <p className="mt-2 text-sm text-muted">Your order was created with number <strong>{successOrderNumber}</strong>. Follow the payment instructions to complete the transfer; you'll receive the items via WhatsApp after payment confirmation.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Customer information</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded-lg border border-borderc px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="mt-1 w-full rounded-lg border border-borderc px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">WhatsApp prefix</label>
            <select value={countryPrefix} onChange={(e) => setCountryPrefix(e.target.value)} className="mt-1 w-full rounded-lg border border-borderc px-3 py-2">
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+55">+55</option>
              <option value="+61">+61</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">WhatsApp number</label>
            <input className="mt-1 w-full rounded-lg border border-borderc px-3 py-2" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Payment method</h3>
        <div className="mt-4 space-y-3">
          {paymentMethods.length === 0 ? (
            <div className="text-sm text-muted">No data — no payment methods configured.</div>
          ) : (
            paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-start gap-3">
                <input id={`pm-${pm.id}`} name="payment_method" type="radio" checked={selectedPayment === pm.id} onChange={() => onPaymentChange(pm.id)} />
                <div>
                  <label htmlFor={`pm-${pm.id}`} className="font-medium">{pm.name} {pm.type === 'manual' ? '(Manual)' : pm.type === 'stripe' ? '(Stripe - coming soon)' : pm.type}</label>
                  {selectedPayment === pm.id && pm.type === 'manual' && (
                    <div className="mt-2 border border-borderc rounded-lg p-3 bg-card">
                      <h4 className="font-medium">Payment instructions</h4>
                      {pm.instructions_md ? (
                        <div className="mt-2 text-sm text-muted whitespace-pre-wrap">{pm.instructions_md}</div>
                      ) : (
                        <div className="mt-2 text-sm text-muted">No data — add payment instructions in Admin.</div>
                      )}

                      {pm.details && typeof pm.details === 'object' && (
                        <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
                          {Object.entries(pm.details).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <div className="text-muted">{k}</div>
                              <div className="font-medium">{String(v)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={manualConfirmed} onChange={(e) => setManualConfirmed(e.target.checked)} /> <span>Confirm I copied the payment details (NIB/number) to complete the transfer.</span></label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Finalize</h3>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1 border">-</button>
            <div className="px-3">{qty}</div>
            <button type="button" onClick={() => setQty((q) => q + 1)} className="px-3 py-1 border">+</button>
          </div>

          <div className="ml-auto">
            <button type="submit" disabled={!valid || submitting} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold ${(!valid || submitting) ? 'bg-zuma-200 text-muted' : 'bg-zuma-500 text-white'}`}>
              {submitting ? 'Creating...' : 'Create order'}
            </button>
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-danger-500">{error}</div>}
      </section>
    </form>
  )
}
