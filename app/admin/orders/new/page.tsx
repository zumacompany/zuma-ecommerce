import { supabaseAdmin } from '../../../../lib/supabase/server'
import OrderCreateForm from '../../../../components/admin/OrderCreateForm'

export const dynamic = 'force-dynamic'

export default async function AdminOrderCreatePage() {
  const { data: offers, error: offersError } = await supabaseAdmin
    .from('offers')
    .select('id, price, denomination_value, denomination_currency, brand:brands(id, name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: paymentMethods, error: paymentError } = await supabaseAdmin
    .from('payment_methods')
    .select('id, name')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })

  if (offersError || paymentError) {
    const message = offersError?.message || paymentError?.message || 'unknown'
    return (
      <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Erro ao carregar dados</h3>
        <p className="mt-2 text-sm text-muted max-w-xs">{message}</p>
      </div>
    )
  }

  const normalizedOffers = (offers || []).map((offer: any) => ({
    ...offer,
    brand: Array.isArray(offer.brand) ? offer.brand[0] ?? null : offer.brand ?? null,
  }))

  return (
    <OrderCreateForm offers={normalizedOffers} paymentMethods={paymentMethods || []} />
  )
}
