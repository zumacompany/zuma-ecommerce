"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

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
  const countryPrefix = "+258" // Locked to +258
  const country = "Moçambique" // Locked to Moçambique
  const [whatsapp, setWhatsapp] = useState("")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<string | null>(paymentMethods[0]?.id ?? null)
  const [manualConfirmed, setManualConfirmed] = useState(false)
  const [qty, setQty] = useState(initialQty ?? 1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<any>(null)
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const [loadingComplete, setLoadingComplete] = useState(false)

  const selectedPaymentMethod = useMemo(() => paymentMethods.find((p) => p.id === selectedPayment) ?? null, [paymentMethods, selectedPayment])

  useEffect(() => {
    // analytics: checkout_started
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: 'checkout_started', path: '/checkout', metadata: { offer_id: offer.id } }) }).catch(() => { })

    // Fetch WhatsApp number from settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number)
        }
      })
      .catch(() => { })
  }, [offer.id])

  function validEmail(e: string) {
    return /\S+@\S+\.\S+/.test(e)
  }

  const valid = name.trim() !== '' && validEmail(email) && whatsapp.trim() !== '' && province.trim() !== '' && city.trim() !== '' && birthdate.trim() !== '' && selectedPayment && (selectedPaymentMethod?.type !== 'manual' || manualConfirmed) && qty > 0

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
          customer_whatsapp: `+258${whatsapp}`,
          country: "Moçambique",
          province: province,
          city: city, // Send both
          birthdate: birthdate,
          payment_method_id: selectedPayment,
          items,
          currency: 'MZN', // Force MZN
          session_id: null
        })
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setSuccessOrderNumber(json.orderNumber ?? null)
        // Store order data for WhatsApp message
        setOrderData({
          orderNumber: json.orderNumber,
          customerName: name,
          customerWhatsapp: `${countryPrefix}${whatsapp}`,
          items: items.map(item => ({
            product: offer.brand?.name ?? 'Produto',
            denomination: `${offer.denomination_value} ${offer.denomination_currency}`, // Use actual currency
            qty: item.qty,
            price: item.unit_price
          })),
          total: subtotal,
          currency: 'MZN', // Force MZN
          paymentMethod: selectedPaymentMethod?.name ?? 'N/A'
        })
        // Start 6-second timer
        setTimeout(() => setLoadingComplete(true), 6000)
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

  // Generate WhatsApp message
  function generateWhatsAppMessage() {
    if (!orderData) return ''

    const message = `*NOVO PEDIDO - ${orderData.orderNumber}*\n\n` +
      `*Cliente:* ${orderData.customerName}\n` +
      `*WhatsApp:* ${orderData.customerWhatsapp}\n\n` +
      `*Itens do Pedido:*\n` +
      orderData.items.map((item: any) =>
        `- ${item.product} (${item.denomination}) x${item.qty} - ${item.price.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}`
      ).join('\n') +
      `\n\n*Total:* ${orderData.total.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}\n` +
      `*Método de Pagamento:* ${orderData.paymentMethod}\n\n` +
      `_Aguardando confirmacao de pagamento..._`

    return encodeURIComponent(message)
  }

  function openWhatsApp() {
    console.log('WhatsApp Number:', whatsappNumber)
    console.log('Order Data:', orderData)

    if (!whatsappNumber) {
      alert('Número de WhatsApp não configurado. Entre em contato com o suporte.')
      return
    }

    if (!orderData) {
      alert('Dados do pedido não encontrados.')
      return
    }

    const message = generateWhatsAppMessage()
    console.log('Generated Message:', message)

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${cleanNumber}?text=${message}`

    console.log('WhatsApp URL:', url)
    console.log('Opening WhatsApp...')

    window.open(url, '_blank')
  }

  if (successOrderNumber) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-card p-8 border border-borderc shadow-lg">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Order Details */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Pedido Criado com Sucesso!</h3>
            <p className="text-muted mb-4">Olá <strong>{orderData?.customerName?.split(' ')[0]}</strong>, seu pedido foi registrado.</p>

            <div className="inline-block bg-primary/10 border border-primary/20 rounded-lg px-6 py-3 mb-6">
              <div className="text-sm text-muted mb-1">Número do Pedido</div>
              <div className="text-2xl font-bold text-primary">{successOrderNumber}</div>
            </div>

            <div className="bg-muted/10 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold mb-3 text-sm text-muted">Resumo do Pedido</h4>
              {orderData?.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm mb-2">
                  <span>{item.product} ({item.denomination}) x{item.qty}</span>
                  <span className="font-medium">{item.price.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</span>
                </div>
              ))}
              <div className="border-t border-borderc pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{orderData?.total.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-borderc text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Método de Pagamento:</span>
                  <span className="font-medium">{orderData?.paymentMethod}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading or Button */}
          {!loadingComplete ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted">Preparando informações de pagamento...</p>
              <p className="text-xs text-muted mt-2">Por favor, aguarde alguns segundos</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={openWhatsApp}
                className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>Realizar Pagamento via WhatsApp</span>
              </button>

              <p className="text-xs text-center text-muted">
                Clique no botão acima para enviar os detalhes do pedido e receber as instruções de pagamento.
              </p>
            </div>
          )}
        </div>
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
                <label className="text-sm font-medium text-text/80">Código</label>
                <div className="mt-1 w-full rounded-lg border border-borderc bg-muted/50 px-3 py-2 text-sm text-text cursor-not-allowed">
                  +258 (MZ)
                </div>
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
              <div>
                <label className="text-sm font-medium text-text/80">País</label>
                <div className="mt-1 w-full rounded-lg border border-borderc bg-muted/50 px-3 py-2 text-sm text-text cursor-not-allowed">
                  Moçambique
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">Província</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Selecione a província</option>
                  <option value="Maputo Cidade">Maputo Cidade</option>
                  <option value="Maputo Província">Maputo Província</option>
                  <option value="Gaza">Gaza</option>
                  <option value="Inhambane">Inhambane</option>
                  <option value="Sofala">Sofala</option>
                  <option value="Manica">Manica</option>
                  <option value="Tete">Tete</option>
                  <option value="Zambézia">Zambézia</option>
                  <option value="Nampula">Nampula</option>
                  <option value="Niassa">Niassa</option>
                  <option value="Cabo Delgado">Cabo Delgado</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">Cidade / Distrito</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Matola, Xai-Xai"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  required
                  max={new Date().toISOString().split('T')[0]}
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
              <div className="text-xs text-muted">Gift Card {offer.denomination_value} MZN</div>
            </div>
            <div className="text-sm font-semibold">
              {offer.price.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}
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
              <span>{subtotal.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text">
              <span>Total a Pagar</span>
              <span>{subtotal.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</span>
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
