"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/browser';
import Link from 'next/link';
import { getStatusColor, getStatusLabel } from '@/lib/orderStatus';
import { formatRelativeTime, resolveRelativeTimeLocale } from '@/lib/formatRelativeTime';
import { ORDER_OPEN_STATUSES } from '@/src/server/modules/orders/order-status';
import { normalizeOrderStatus } from '@/src/server/modules/orders/order-status.mapper';

type CustomerStats = {
    activeOrders: number;
    totalSpent: number;
    deliveredOrders: number;
    loyaltyPoints: number;
};

type RecentOrder = {
    order_id: string;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    payment_method_name: string;
    items_count: number;
};

export default function CustomerDashboard() {
    const { t, locale } = useI18n();
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const relativeTimeLocale = resolveRelativeTimeLocale(locale);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setStats(null);
            setRecentOrders([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Get customer data and stats
                const { data: customerData } = await supabase
                    .rpc('get_customer_by_auth_user', { p_auth_user_id: user.id });

                if (customerData && customerData.length > 0) {
                    const customer = customerData[0];

                    const [
                        { count: activeCount, error: activeCountError },
                        { count: deliveredCount, error: deliveredCountError },
                    ] = await Promise.all([
                        supabase
                            .from('orders')
                            .select('*', { count: 'exact', head: true })
                            .eq('customer_id', customer.customer_id)
                            .in('status', ORDER_OPEN_STATUSES),
                        supabase
                            .from('orders')
                            .select('*', { count: 'exact', head: true })
                            .eq('customer_id', customer.customer_id)
                            .eq('status', 'delivered'),
                    ]);

                    if (activeCountError) {
                        console.error('Error fetching active orders count:', activeCountError);
                    }

                    if (deliveredCountError) {
                        console.error('Error fetching delivered orders count:', deliveredCountError);
                    }

                    setStats({
                        activeOrders: activeCount || 0,
                        totalSpent: Number(customer.total_spent ?? 0),
                        deliveredOrders: deliveredCount || 0,
                        loyaltyPoints: customer.loyalty_points || 0,
                    });
                }

                // Get recent orders
                const { data: ordersData } = await supabase
                    .rpc('get_customer_orders', {
                        p_auth_user_id: user.id,
                        p_limit: 5,
                        p_offset: 0,
                    });

                if (ordersData) {
                    setRecentOrders(
                        (ordersData as RecentOrder[]).map((order) => ({
                            ...order,
                            status: normalizeOrderStatus(order.status) ?? String(order.status ?? 'new'),
                            total_amount: Number(order.total_amount ?? 0),
                            items_count: Number(order.items_count ?? 0),
                        }))
                    );
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authLoading, user]);

    if (loading) {
        return (
            <div className="space-y-6" aria-busy="true" aria-label={t('common.loading')}>
                <div className="h-28 rounded-xl bg-muted/10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-xl bg-muted/10 border border-borderc animate-pulse" />
                    ))}
                </div>
                <div className="h-64 rounded-xl bg-muted/10 border border-borderc animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2">
                    {t('customer.welcome', { name: user?.user_metadata?.name || 'Cliente' })} 👋
                </h1>
                <p className="text-white/90">
                    {t('customer.welcomeMessage')}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Orders */}
                <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">📦</div>
                        <div className="text-2xl font-bold text-foreground">
                            {stats?.activeOrders || 0}
                        </div>
                    </div>
                    <p className="text-sm text-muted">{t('customer.activeOrders')}</p>
                </div>

                {/* Loyalty Points */}
                <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">🎁</div>
                        <div className="text-2xl font-bold text-primary">
                            {stats?.loyaltyPoints || 0}
                        </div>
                    </div>
                    <p className="text-sm text-muted">{t('customer.points')}</p>
                </div>

                {/* Total Spent */}
                <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">💰</div>
                        <div className="text-2xl font-bold text-foreground">
                            {stats?.totalSpent?.toFixed(2) || '0.00'}
                        </div>
                    </div>
                    <p className="text-sm text-muted">{t('customer.totalSpent')}</p>
                </div>

                {/* Delivered Orders */}
                <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">📍</div>
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.deliveredOrders || 0}
                        </div>
                    </div>
                    <p className="text-sm text-muted">{t('customer.deliveredOrders')}</p>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl bg-card border border-borderc shadow-sm">
                <div className="p-6 border-b border-borderc flex items-center justify-between">
                    <h2 className="text-xl font-bold">{t('customer.recentOrders')}</h2>
                    <Link
                        href="/cliente/pedidos"
                        className="text-sm text-primary hover:underline font-semibold"
                    >
                        {t('customer.viewAll')} →
                    </Link>
                </div>

                <div className="divide-y divide-borderc">
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <p className="text-muted">{t('customer.noOrders')}</p>
                            <Link
                                href="/browse"
                                className="inline-block mt-4 text-primary hover:underline font-semibold"
                            >
                                {t('customer.startShopping')}
                            </Link>
                        </div>
                    ) : (
                        recentOrders.map((order) => (
                            <Link
                                key={order.order_id}
                                href={`/cliente/pedidos/${order.order_id}`}
                                className="block p-4 hover:bg-muted/10 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-sm font-semibold">
                                                #{order.order_number}
                                            </span>
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {getStatusLabel(order.status, t)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted">
                                            <span>
                                                {formatRelativeTime(order.created_at, relativeTimeLocale)}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {order.items_count} {locale === 'en'
                                                    ? order.items_count === 1 ? 'item' : 'items'
                                                    : order.items_count === 1 ? 'item' : 'itens'}
                                            </span>
                                            {order.payment_method_name && (
                                                <>
                                                    <span>•</span>
                                                    <span>{order.payment_method_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">
                                            {order.total_amount.toFixed(2)} {order.currency}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
