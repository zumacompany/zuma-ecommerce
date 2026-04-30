"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Save, Loader2, X } from "lucide-react"
import { btnPrimary, btnSecondary, input, label } from "../ui/classes"

type Offer = {
  id: string
  price: number
  denomination_value: number
  denomination_currency: string
  brand: { id: string; name: string } | null
}

type PaymentMethod = {
  id: string
  name: string
}

export default function OrderCreateForm({
  offers,
  paymentMethods
}: {
  offers: Offer[]
  paymentMethods: PaymentMethod[]
}) {
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [whatsappPrefix, setWhatsappPrefix] = useState("+258")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [country, setCountry] = useState("Moçambique")
  const [province, setProvince] = useState("")

  const [offerId, setOfferId] = useState(offers[0]?.id ?? "")
  const [qty, setQty] = useState(1)
  const [unitPrice, setUnitPrice] = useState(offers[0]?.price?.toString() ?? "")
  const [currency, setCurrency] = useState(offers[0]?.denomination_currency ?? "MZN")
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null)

  const selectedOffer = useMemo(() => offers.find(o => o.id === offerId) ?? null, [offers, offerId])

  useEffect(() => {
    if (!selectedOffer) return
    setUnitPrice(selectedOffer.price?.toString() ?? "")
    setCurrency(selectedOffer.denomination_currency || "MZN")
  }, [selectedOffer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessOrderNumber(null)

    if (!customerName.trim()) return setError("Customer name is required")
    if (!offerId) return setError("Offer is required")
    if (!whatsappNumber.trim()) return setError("WhatsApp number is required")

    const qtyNum = Number(qty)
    const priceNum = Number(unitPrice)
    if (!qtyNum || qtyNum <= 0) return setError("Quantity must be > 0")
    if (!priceNum || priceNum <= 0) return setError("Unit price must be > 0")

    setSubmitting(true)
    try {
      const items = [
        {
          offer_id: offerId,
          qty: qtyNum,
          unit_price: priceNum,
          currency
        }
      ]

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || null,
          whatsappPrefix: whatsappPrefix.trim(),
          whatsappNumber: whatsappNumber.trim(),
          country: country.trim() || null,
          province: province.trim() || null,
          payment_method_id: paymentMethodId || null,
          items,
          currency
        })
      })

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create order')

      setSuccessOrderNumber(json.orderNumber ?? null)
      setCustomerName("")
      setCustomerEmail("")
      setWhatsappNumber("")
      setProvince("")
      setQty(1)
    } catch (err: any) {
      setError(err?.message ?? "unknown")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Create Order</h2>
          <p className="text-sm text-muted">Manual order creation for special cases.</p>
        </div>
        <Link href="/admin/orders" className={`${btnSecondary} inline-flex items-center gap-2`}>
          <X className="w-4 h-4" />
          Back to orders
        </Link>
      </div>

      {successOrderNumber && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Order created: <strong>{successOrderNumber}</strong>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-borderc bg-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Customer name</label>
            <input className={input} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className={label}>Customer email</label>
            <input className={input} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </div>
          <div>
            <label className={label}>WhatsApp prefix</label>
            <input className={input} value={whatsappPrefix} onChange={(e) => setWhatsappPrefix(e.target.value)} />
          </div>
          <div>
            <label className={label}>WhatsApp number</label>
            <input className={input} value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
          </div>
          <div>
            <label className={label}>Country</label>
            <input className={input} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <label className={label}>Province</label>
            <input className={input} value={province} onChange={(e) => setProvince(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Offer</label>
            <select className={input} value={offerId} onChange={(e) => setOfferId(e.target.value)}>
              <option value="" disabled>Select an offer</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.brand?.name ?? 'Brand'} • {offer.denomination_value} {offer.denomination_currency}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Payment method</label>
            <select className={input} value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              <option value="">No payment method</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Quantity</label>
            <input
              className={input}
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label}>Unit price</label>
            <input
              className={input}
              type="number"
              min={0}
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Currency</label>
            <input className={input} value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div className="flex items-end text-sm text-muted">
            {selectedOffer ? (
              <div>
                Selected: <strong>{selectedOffer.brand?.name ?? 'Brand'}</strong> • {selectedOffer.denomination_value} {selectedOffer.denomination_currency}
              </div>
            ) : (
              <div>Select an offer to see details.</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create order
          </button>
        </div>
      </form>
    </div>
  )
}
