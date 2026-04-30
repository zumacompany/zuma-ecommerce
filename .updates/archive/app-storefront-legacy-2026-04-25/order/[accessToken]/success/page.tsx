import Link from 'next/link'
import { notFound } from 'next/navigation'
import CheckoutSuccess from '../../../../../components/storefront/Checkout/CheckoutSuccess'
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../../../src/server/http/errors'
import { getPublicOrderSuccessData } from '../../../../../src/server/modules/orders/order-public.service'

type Props = { params: { accessToken: string } }

export default async function OrderSuccessPage({ params }: Props) {
  try {
    const { accessToken, order, items, whatsappNumber } = await getPublicOrderSuccessData(params.accessToken)

    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <CheckoutSuccess
            accessToken={accessToken}
            whatsappNumber={whatsappNumber}
            order={order}
            items={items}
          />
        </div>
      </main>
    )
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      notFound()
    }

    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <div className="mt-4">
              <Link href="/">Go back to home</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }
}
