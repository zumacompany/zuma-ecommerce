"use client";
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { t } = useI18n();
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isAuthPage =
        pathname === '/cliente/login' || pathname === '/cliente/recuperar-senha';

    const handleSignOut = async () => {
        await signOut();
        router.push('/cliente/login');
    };

    const navItems = [
        { href: '/cliente/dashboard', label: t('customer.dashboard'), icon: '🏠' },
        { href: '/cliente/pedidos', label: t('customer.orders'), icon: '📦' },
        { href: '/cliente/pontos', label: t('customer.points'), icon: '🎁' },
        { href: '/cliente/perfil', label: t('customer.profile'), icon: '👤' },
    ];

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-bg">
            {/* Top Navigation */}
            <nav className="border-b border-borderc bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold text-primary">
                            ZUMA
                        </Link>

                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <aside className="md:col-span-1">
                        <div className="rounded-xl bg-card p-4 border border-borderc shadow-sm sticky top-6">
                            {user && (
                                <div className="mb-6 pb-6 border-b border-borderc">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{user.email}</p>
                                            <p className="text-xs text-muted">{t('customer.account')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-foreground hover:bg-muted/20'
                                                }`}
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}

                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-danger-50 hover:text-danger-600 transition-all"
                                >
                                    <span className="text-xl">🚪</span>
                                    <span>{t('customer.logout')}</span>
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="md:col-span-3">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
