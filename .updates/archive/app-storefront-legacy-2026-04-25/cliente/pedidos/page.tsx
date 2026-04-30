"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/browser';
import Link from 'next/link';
import { getStatusColor, getStatusLabel } from '@/lib/orderStatus';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

type Order = {
    order_id: string;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    payment_method_name: string;
    items_count: number;
};

export default function OrdersPage() {
    const { t } = useI18n();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setOrders([]);
            setLoading(false);
            setError(null);
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: rpcError } = await supabase
                    .rpc('get_customer_orders', {
                        p_auth_user_id: user.id,
                        p_limit: 100,
                        p_offset: 0,
                    });

                if (rpcError) throw rpcError;

                const rows = Array.isArray(data) ? data : [];
                setOrders(rows.map((o: any) => ({
                    order_id: o.order_id,
                    order_number: o.order_number,
                    status: o.status === 'canceled' ? 'cancelled' : o.status,
                    total_amount: Number(o.total_amount ?? 0),
                    currency: o.currency,
                    created_at: o.created_at,
                    payment_method_name: o.payment_method_name ?? '',
                    items_count: o.items_count ?? 0,
                })));
            } catch (error) {
                console.error('Error fetching orders:', error);
                setError(error instanceof Error ? error.message : 'Failed to load orders');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [authLoading, user]);

    const filteredOrders = orders.filter((order) => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    if (loading) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label={t('common.loading')}>
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/10 border border-borderc animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">{t('customer.orders')}</h1>
                <p className="text-muted">{t('customer.ordersDescription')}</p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['all', 'new', 'pending', 'on_hold', 'delivered', 'cancelled'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === status
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-card border border-borderc text-foreground hover:bg-muted/20'
                            }`}
                    >
                        {status === 'all' ? t('common.all') : getStatusLabel(status, t)}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="rounded-xl bg-card border border-borderc shadow-sm overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-xl font-semibold mb-2">{t('customer.noOrders')}</p>
                        <p className="text-muted mb-6">{t('customer.noOrdersMessage')}</p>
                        <Link
                            href="/browse"
                            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                        >
                            {t('customer.startShopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-borderc">
                        {filteredOrders.map((order) => (
                            <Link
                                key={order.order_id}
                                href={`/cliente/pedidos/${order.order_id}`}
                                className="block p-6 hover:bg-muted/10 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-lg font-bold">
                                                #{order.order_number}
                                            </span>
                                            <span
                                                className={`text-xs px-3 py-1 rounded-full border font-semibold ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {getStatusLabel(order.status, t)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                                            <span className="flex items-center gap-1">
                                                <span>📅</span>
                                                {formatRelativeTime(order.created_at)}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <span>📦</span>
                                                {order.items_count} {order.items_count === 1 ? 'item' : 'itens'}
                                            </span>
                                            {order.payment_method_name && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <span>💳</span>
                                                        {order.payment_method_name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-foreground">
                                            {order.total_amount.toFixed(2)} <span className="text-lg text-muted">{order.currency}</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden md:block text-muted">
                                        →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
