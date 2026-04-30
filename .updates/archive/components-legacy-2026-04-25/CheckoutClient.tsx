"use client";
import { useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "../lib/config";
import { useI18n } from "../lib/i18n";
import CheckoutSummary from "./storefront/Checkout/CheckoutSummary";

type Offer = {
  id: string;
  region_code: string;
  denomination_value: number;
  denomination_currency: string;
  price: number;
  brand?: { id: string; name: string; slug: string };
}

type PaymentMethod = { id: string; name: string; type: string; instructions_md?: string | null; details?: any }

// Fire-and-forget analytics. Uses sendBeacon when available so the request
// survives page navigation and never blocks rendering or surfaces errors.
function sendAnalytics(event_name: string, metadata: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify({ event_name, path: '/checkout', metadata });
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
      return;
    }
  } catch { /* fall through */ }
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => { });
}

// Provinces + cities now come from /api/locations (DB-backed). The previous
// hardcoded MOZ_DATA dictionary lived here.
type ProvinceWithCities = { name: string; cities: string[] }

export default function CheckoutClient({ offer, qty: initialQty, paymentMethods }: { offer: Offer; qty: number; paymentMethods: PaymentMethod[] }) {
  const { t, locale } = useI18n();
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<string | null>(paymentMethods[0]?.id ?? null)
  const [manualConfirmed, setManualConfirmed] = useState(false)
  const [qty, setQty] = useState(initialQty ?? 1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provincesData, setProvincesData] = useState<ProvinceWithCities[]>([])

  const selectedPaymentMethod = useMemo(() => paymentMethods.find((p) => p.id === selectedPayment) ?? null, [paymentMethods, selectedPayment])
  const localeTag = locale === 'pt' ? 'pt-MZ' : 'en-US'
  const unitPriceLabel = new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: APP_CONFIG.DEFAULT_CURRENCY,
  }).format(offer.price)
  const totalLabel = new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: APP_CONFIG.DEFAULT_CURRENCY,
  }).format(offer.price * qty)
  const denominationLabel = `${offer.denomination_currency} ${offer.denomination_value}`
  const detailLabel = [offer.region_code, denominationLabel].filter(Boolean).join(' • ')

  const provinceCities = useMemo(
    () => provincesData.find((p) => p.name === province)?.cities ?? [],
    [provincesData, province],
  );

  useEffect(() => {
    // analytics: checkout_started — non-blocking, won't delay paint or surface errors
    sendAnalytics('checkout_started', { offer_id: offer.id })

    // Fetch provinces + cities from DB-backed locations endpoint
    fetch('/api/locations?region=MZ')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.data)) setProvincesData(json.data)
      })
      .catch(() => { })
  }, [offer.id])

  function validEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
  }

  // Inline validation feedback — only show after user has typed something so we
  // don't yell at them on first paint.
  const emailError = email.length > 0 && !validEmail(email) ? t('checkout.errors.invalidEmail') || 'Email inválido' : null
  const whatsappError = whatsapp.length > 0 && !/^\d{8,}$/.test(whatsapp) ? t('checkout.errors.invalidWhatsapp') || 'Número inválido' : null

  const valid = Boolean(
    name.trim() !== ''
    && validEmail(email)
    && whatsapp.trim() !== ''
    && province.trim() !== ''
    && city.trim() !== ''
    && birthdate.trim() !== ''
    && selectedPayment
    && (selectedPaymentMethod?.type !== 'manual' || manualConfirmed)
    && qty > 0
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError(null)

    // analytics: payment_method_selected already sent on change; click_buy event
    sendAnalytics('click_buy', { offer_id: offer.id, qty })

    try {
      const items = [{ offer_id: offer.id, qty, unit_price: offer.price }]
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          customer_whatsapp: `${APP_CONFIG.DEFAULT_PHONE_PREFIX}${whatsapp}`,
          country: APP_CONFIG.DEFAULT_COUNTRY,
          province,
          city,
          birthdate,
          payment_method_id: selectedPayment,
          items,
          currency: APP_CONFIG.DEFAULT_CURRENCY,
          session_id: null
        })
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        const successPath = typeof json.successPath === 'string' ? json.successPath : null
        if (!successPath) {
          throw new Error(t('checkout.errors.orderDataNotFound'))
        }

        window.location.assign(successPath)
        return
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
    sendAnalytics('payment_method_selected', { payment_method_id: id })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Coluna Principal - Formulário */}
      <div className="md:col-span-2 space-y-6">
        <form id="checkout-form" onSubmit={submit} className="space-y-6">
          <section className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('checkout.customerData')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text/80">{t('checkout.fullName')}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('checkout.namePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('common.email')}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  aria-describedby="checkout-email-error"
                />
                {emailError && (
                  <p id="checkout-email-error" className="mt-1 text-xs text-danger-600">{emailError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('checkout.phoneCode')}</label>
                <div className="mt-1 w-full rounded-lg border border-borderc bg-muted/50 px-3 py-2 text-sm text-text cursor-not-allowed">
                  +258 (MZ)
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('common.whatsapp')}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="841234567"
                  required
                  aria-describedby="checkout-whatsapp-error"
                />
                {whatsappError && (
                  <p id="checkout-whatsapp-error" className="mt-1 text-xs text-danger-600">{whatsappError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('checkout.country')}</label>
                <div className="mt-1 w-full rounded-lg border border-borderc bg-muted/50 px-3 py-2 text-sm text-text cursor-not-allowed">
                  {t('common.mozambique')}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('checkout.province')}</label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setCity(""); // Reset city when province changes
                  }}
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent outline-none"
                  required
                  aria-label={t('checkout.province')}
                >
                  <option value="">{t('checkout.selectProvince')}</option>
                  {provincesData.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('checkout.city')}</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent outline-none disabled:opacity-50 disabled:bg-muted/30"
                  required
                  disabled={!province}
                  aria-label={t('checkout.city')}
                >
                  <option value="">{province ? t('checkout.cityPlaceholder') : t('checkout.selectProvinceFirst') || 'Seleccione a província primeiro'}</option>
                  {provinceCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text/80">{t('checkout.birthdate')}</label>
                <input
                  className="mt-1 w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text focus:ring-2 focus:ring-zuma-500 focus:border-transparent transition-all outline-none"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('checkout.payment')}</h3>
            <div className="space-y-3">
              {paymentMethods.length === 0 ? (
                <div className="text-sm text-muted">{t('checkout.noPaymentMethods')}</div>
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
                        <div className="text-sm text-muted">{t('checkout.instructionsLabel')}:</div>
                        {pm.instructions_md ? (
                          <div className="mt-2 text-sm text-text whitespace-pre-wrap bg-bg p-3 rounded border border-borderc">{pm.instructions_md}</div>
                        ) : (
                          <div className="mt-2 text-sm text-muted">{t('checkout.noAdditionalInstructions')}</div>
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
                            <input type="checkbox" aria-label={t('checkout.confirmCopied')} className="mt-1 rounded text-zuma-500 focus:ring-zuma-500" checked={manualConfirmed} onChange={(e) => setManualConfirmed(e.target.checked)} />
                            <span className="text-muted">{t('checkout.confirmCopied')}</span>
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
        <CheckoutSummary
          brandName={offer.brand?.name ?? 'Produto'}
          detail={detailLabel}
          unitPriceLabel={unitPriceLabel}
          quantity={qty}
          subtotalLabel={totalLabel}
          totalLabel={totalLabel}
          actionLabel={submitting ? t('common.processing') : t('checkout.finalizeOrder')}
          actionDisabled={!valid || submitting}
          actionType="submit"
          actionForm="checkout-form"
          onDecrease={() => setQty((q) => Math.max(1, q - 1))}
          onIncrease={() => setQty((q) => q + 1)}
          error={error}
          footerNote={t('checkout.termsAgreement')}
        />
      </div>
    </div>
  )
}
