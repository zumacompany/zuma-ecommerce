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
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'checkout_started', path: '/checkout', metadata: { offer_id: offer.id } }) }).catch(() => { })
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
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'click_buy', path: '/checkout', metadata: { offer_id: offer.id, qty } }) }).catch(() => { })

    try {
      const items = [{ offer_id: offer.id, qty, unit_price: offer.price }]
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_whatsapp: `${countryPrefix}${whatsapp}`,
          country: countryPrefix === '+258' ? 'Mozambique' : countryPrefix === '+55' ? 'Brazil' : countryPrefix === '+351' ? 'Portugal' : countryPrefix === '+44' ? 'UK' : 'USA',
          province: countryPrefix === '+258' ? 'Maputo' : 'Main',
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
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'payment_method_selected', path: '/checkout', metadata: { payment_method_id: id } }) }).catch(() => { })
  }

  if (successOrderNumber) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
        <h3 className="text-lg font-semibold text-success-700">Pedido Criado com Sucesso!</h3>
        <p className="mt-2 text-sm text-muted">Seu número de pedido é <strong>{successOrderNumber}</strong>.</p>
        <p className="mt-1 text-sm text-muted">Siga as instruções de pagamento abaixo. Você receberá seus itens via WhatsApp assim que o pagamento for confirmado.</p>
      </div>
    )
  }

  const subtotal = offer.price * qty

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Coluna Principal - Formulário */}
      <div className="md:col-span-2 space-y-6">
        <form id="checkout-form" onSubmit={submit} className="space-y-6">
          <section className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Dados do Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text/80">Nome Completo</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">Email</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">Prefixo</label>
                <select
                  value={countryPrefix}
                  onChange={(e) => setCountryPrefix(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent outline-none"
                >
                  <option value="+258">+258 (MZ)</option>
                  <option value="+55">+55 (BR)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+351">+351 (PT)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">WhatsApp</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="841234567"
                  required
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Pagamento</h3>
            <div className="space-y-3">
              {paymentMethods.length === 0 ? (
                <div className="text-sm text-muted">Nenhum método de pagamento disponível.</div>
              ) : (
                paymentMethods.map((pm) => (
                  <div key={pm.id} className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedPayment === pm.id ? 'border-zuma-500 bg-zuma-50 dark:bg-zuma-900/20' : 'border-borderc bg-card hover:border-zuma-200'}`} onClick={() => onPaymentChange(pm.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === pm.id ? 'border-zuma-500' : 'border-muted'}`}>
                        {selectedPayment === pm.id && <div className="w-2 h-2 rounded-full bg-zuma-500" />}
                      </div>
                      <span className="font-medium">{pm.name}</span>
                    </div>

                    {selectedPayment === pm.id && pm.type === 'manual' && (
                      <div className="mt-4 pt-4 border-t border-borderc/50 pl-7">
                        <div className="text-sm text-muted">Instruções:</div>
                        {pm.instructions_md ? (
                          <div className="mt-2 text-sm text-text whitespace-pre-wrap bg-bg p-3 rounded border border-borderc">{pm.instructions_md}</div>
                        ) : (
                          <div className="mt-2 text-sm text-muted">Sem instruções adicionais.</div>
                        )}

                        {pm.details && typeof pm.details === 'object' && (
                          <div className="mt-3 grid grid-cols-1 gap-1 text-sm bg-bg p-3 rounded border border-borderc">
                            {Object.entries(pm.details).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-muted capitalize">{k.replace('_', ' ')}:</span>
                                <span className="font-medium select-all">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4">
                          <label className="flex items-start gap-2 text-sm cursor-pointer">
                            <input type="checkbox" className="mt-1 rounded text-zuma-500 focus:ring-zuma-500" checked={manualConfirmed} onChange={(e) => setManualConfirmed(e.target.checked)} />
                            <span className="text-muted">Confirmo que copiei os dados de pagamento para realizar a transferência.</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </form>
      </div>

      {/* Coluna Lateral - Resumo do Pedido */}
      <div className="space-y-6">
        <section className="sticky top-24 rounded-xl bg-card p-6 border border-borderc shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

          <div className="flex items-start gap-4 pb-4 border-b border-borderc">
            <div className="h-12 w-12 rounded-lg bg-zuma-100 flex items-center justify-center text-zuma-600 font-bold text-xs">
              IMG
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{offer.brand?.name ?? 'Produto'}</div>
              <div className="text-xs text-muted">Gift Card {offer.denomination_currency} {offer.denomination_value}</div>
            </div>
            <div className="text-sm font-semibold">
              {offer.price.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
            </div>
          </div>

          <div className="py-4 flex items-center justify-between border-b border-borderc">
            <span className="text-sm text-muted">Quantidade</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 flex items-center justify-center rounded-full border border-borderc hover:bg-bg transition">-</button>
              <span className="text-sm font-medium w-4 text-center">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-borderc hover:bg-bg transition">+</button>
            </div>
          </div>

          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{subtotal.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text">
              <span>Total a Pagar</span>
              <span>{subtotal.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={!valid || submitting}
            className={`w-full mt-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 shadow-md transform active:scale-95
              ${(!valid || submitting)
                ? 'bg-muted/20 text-muted cursor-not-allowed shadow-none'
                : 'bg-zuma-600 hover:bg-zuma-700 text-white hover:shadow-lg'
              }`}
          >
            {submitting ? 'Processando...' : 'Finalizar Pedido'}
          </button>

          {error && <div className="mt-3 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm text-center border border-danger-100">{error}</div>}

          <p className="mt-4 text-xs text-center text-muted">
            Ao finalizar, você concorda com nossos Termos de Uso.
          </p>
        </section>
      </div>
    </div>
  )
}
