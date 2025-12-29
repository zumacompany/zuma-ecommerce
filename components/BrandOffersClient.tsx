"use client";
import { useEffect, useMemo, useState } from "react";
import { input, btnPrimary } from "./ui/classes";

type Offer = {
  id: string;
  region_code: string;
  denomination_value: number;
  denomination_currency: string;
  price: number;
}

export default function BrandOffersClient({
  brand,
  regions,
  initialRegion,
  initialOffers
}: {
  brand: { name: string; logo_path: string | null; description_md: string | null; slug: string };
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
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'view_brand', path: `/b/${brand.slug}`, metadata: { brand_slug: brand.slug } }) }).catch(() => { })
  }, [brand.slug])

  useEffect(() => {
    // when region changes, fetch offers for it
    if (!region) return
    setSelectedOfferId(null)
    setQty(1)
    fetch(`/api/offers?brand=${encodeURIComponent(brand.slug)}&region=${encodeURIComponent(region)}`)
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
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'select_region', path: `/b/${brand.slug}`, metadata: { region_code: region, brand_slug: brand.slug } }) }).catch(() => { })
  }, [region, brand.slug])

  function selectOffer(offerId: string) {
    setSelectedOfferId(offerId)
    // analytics: select_offer
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'select_offer', path: `/b/${brand.slug}`, metadata: { offer_id: offerId, brand_slug: brand.slug } }) }).catch(() => { })
  }

  function changeQty(delta: number) {
    setQty((q) => Math.max(1, q + delta))
  }

  function clickBuy() {
    if (!selectedOfferId || qty < 1) return
    // analytics: click_buy
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'click_buy', path: `/b/${brand.slug}`, metadata: { offer_id: selectedOfferId, qty } }) }).catch(() => { })

    const params = new URLSearchParams({ offerId: selectedOfferId, qty: String(qty) })
    window.location.href = `/checkout?${params.toString()}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="rounded-xl bg-card p-6 border border-borderc mb-6 flex items-start gap-4">
          {brand.logo_path ? (
            <img src={brand.logo_path} alt={brand.name} className="h-20 object-contain" />
          ) : (
            <div className="h-20 w-20 bg-zuma-100 flex items-center justify-center text-sm text-muted rounded-lg">No logo</div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 border border-borderc mb-6">
          <h3 className="text-lg font-semibold">Como funciona</h3>
          {brand.description_md ? (
            <div className="mt-3 text-sm text-muted whitespace-pre-wrap leading-relaxed">{brand.description_md}</div>
          ) : (
            <div className="mt-3 text-sm text-muted">Sem dados — adicione a descrição da marca no Admin.</div>
          )}
        </div>

        <div className="rounded-xl bg-card p-6 border border-borderc mb-6">
          <label className="text-sm font-medium">Região</label>
          {(!regions || regions.length === 0) ? (
            <div className="mt-2 text-sm text-muted">Sem dados — adicione ofertas para esta marca no Admin.</div>
          ) : (
            <select value={region ?? ''} onChange={(e) => setRegion(e.target.value)} className={`mt-2 w-full ${input}`}>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          {(!offers || offers.length === 0) ? (
            <div className="rounded-xl bg-card p-6 border border-borderc">Sem dados — não há ofertas disponíveis para esta região.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {offers.map((o) => (
                <div key={o.id} onClick={() => selectOffer(o.id)} className={`rounded-xl p-4 border cursor-pointer transition-all ${selectedOfferId === o.id ? 'border-zuma-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)] bg-zuma-50/10' : 'border-borderc bg-card hover:border-zuma-200'}`}>
                  <div className="text-sm text-muted font-medium uppercase tracking-wide">MZN</div>
                  <div className="text-2xl font-bold mt-1">{o.denomination_value}</div>
                  <div className="mt-2 text-sm text-zuma-600 font-medium">Preço: {o.price.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="lg:col-span-1">
        <div className="sticky top-24">
          <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
            {selectedOffer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-borderc pb-4">
                  <span className="text-sm text-muted">Produto</span>
                  <span className="font-medium">{brand.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-borderc pb-4">
                  <span className="text-sm text-muted">Valor</span>
                  <span className="font-medium">{selectedOffer.denomination_value} MZN</span>
                </div>

                <div className="flex items-center justify-between border-b border-borderc pb-4">
                  <span className="text-sm text-muted">Quantidade</span>
                  <div className="flex items-center gap-3">
                    <button className="h-8 w-8 rounded border border-borderc flex items-center justify-center hover:bg-muted/10 transition-colors" onClick={() => changeQty(-1)}>-</button>
                    <span className="font-medium w-4 text-center">{qty}</span>
                    <button className="h-8 w-8 rounded border border-borderc flex items-center justify-center hover:bg-muted/10 transition-colors" onClick={() => changeQty(1)}>+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold text-zuma-600">{(qty * selectedOffer.price).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</span>
                </div>

                <button className={`w-full ${btnPrimary} mt-2`} onClick={clickBuy}>
                  Ir para Pagamento
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Sem dados — selecione uma opção.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
