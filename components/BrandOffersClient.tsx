"use client";
import { useEffect, useMemo, useState } from "react";

type Offer = {
  id: string;
  region_code: string;
  denomination_value: number;
  denomination_currency: string;
  price: number;
}

export default function BrandOffersClient({
  brandSlug,
  regions,
  initialRegion,
  initialOffers
}: {
  brandSlug: string;
  regions: string[];
  initialRegion: string | null;
  initialOffers: Offer[];
}) {
  const [region, setRegion] = useState<string | null>(initialRegion)
  const [offers, setOffers] = useState<Offer[]>(initialOffers ?? [])
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const selectedOffer = useMemo(() => offers.find((o) => o.id === selectedOfferId) ?? null, [offers, selectedOfferId])

  useEffect(() => {
    // view_brand analytics
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'view_brand', path: `/b/${brandSlug}`, metadata: { brand_slug: brandSlug } }) }).catch(() => {})
  }, [brandSlug])

  useEffect(() => {
    // when region changes, fetch offers for it (client fetch to keep interactions snappy)
    if (!region) return
    setSelectedOfferId(null)
    fetch(`/api/offers?brand=${encodeURIComponent(brandSlug)}&region=${encodeURIComponent(region)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setOffers([])
        } else {
          setOffers(Array.isArray(json.data) ? json.data : [])
        }
      })
      .catch(() => setOffers([]))

    // analytics: select_region
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'select_region', path: `/b/${brandSlug}`, metadata: { region_code: region, brand_slug: brandSlug } }) }).catch(() => {})
  }, [region, brandSlug])

  function selectOffer(offerId: string) {
    setSelectedOfferId(offerId)
    // analytics: select_offer
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'select_offer', path: `/b/${brandSlug}`, metadata: { offer_id: offerId, brand_slug: brandSlug } }) }).catch(() => {})
  }

  function changeQty(delta: number) {
    setQty((q) => Math.max(1, q + delta))
  }

  function clickBuy() {
    if (!selectedOfferId || qty < 1) return
    // analytics: click_buy
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'click_buy', path: `/b/${brandSlug}`, metadata: { offer_id: selectedOfferId, qty } }) }).catch(() => {})

    // route to checkout
    const params = new URLSearchParams({ offerId: selectedOfferId, qty: String(qty) })
    window.location.href = `/checkout?${params.toString()}`
  }

  return (
    <div>
      <div className="rounded-xl bg-card p-6 border border-borderc mb-6">
        <label className="text-sm font-medium">Region</label>
        {(!regions || regions.length === 0) ? (
          <div className="mt-2 text-sm text-muted">No data — add offers for this brand in Admin.</div>
        ) : (
          <select value={region ?? ''} onChange={(e) => setRegion(e.target.value)} className="mt-2 rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text outline-none">
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        {(!offers || offers.length === 0) ? (
          <div className="rounded-xl bg-card p-6 border border-borderc">No data — no offers available for this region.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {offers.map((o) => (
              <div key={o.id} onClick={() => selectOffer(o.id)} className={`rounded-xl p-4 border cursor-pointer ${selectedOfferId === o.id ? 'border-zuma-500 shadow-pop' : 'border-borderc bg-card'}`}>
                <div className="text-sm text-muted">{o.denomination_currency} {o.denomination_value}</div>
                <div className="mt-2 font-medium">{o.price} {o.denomination_currency}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 lg:hidden">
        <div className="rounded-xl bg-card p-4 border border-borderc">
          <h4 className="font-semibold">Order summary</h4>
          {selectedOffer ? (
            <div className="mt-2">
              <div className="text-sm">{selectedOffer.denomination_currency} {selectedOffer.denomination_value}</div>
              <div className="mt-2 flex items-center gap-2">
                <button className="px-2 py-1 border" onClick={() => changeQty(-1)}>-</button>
                <div>{qty}</div>
                <button className="px-2 py-1 border" onClick={() => changeQty(1)}>+</button>
              </div>
              <div className="mt-2">Subtotal: { (qty * selectedOffer.price).toFixed(2) } {selectedOffer.denomination_currency}</div>
              <button className="mt-3 w-full inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-zuma-500 text-white" disabled={!selectedOffer} onClick={clickBuy}>Buy</button>
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted">No data — select an option.</div>
          )}
        </div>
      </div>
    </div>
  )
}
