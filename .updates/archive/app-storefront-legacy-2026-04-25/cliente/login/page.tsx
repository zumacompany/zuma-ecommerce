"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/browser';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function CustomerLoginPage() {
    const { locale, t } = useI18n();
    const router = useRouter();
    const { signIn, signUp } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const resetSuccessMessage =
        locale === 'en'
            ? 'Your password has been reset. Sign in with your new password.'
            : 'A sua senha foi redefinida. Faça login com a nova senha.';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setResetSuccess(params.get('reset') === 'success');
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
        } else {
            router.push('/cliente/dashboard');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const whatsappE164 = whatsapp.startsWith('+258') ? whatsapp : `+258${whatsapp}`;

        const { error: signUpError } = await signUp(email, password, {
            name,
            whatsapp: whatsappE164,
            province,
            city,
            role: 'customer',
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            // Link guest orders if any
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                await supabase.rpc('link_guest_orders_to_account', {
                    p_auth_user_id: user.id,
                    p_whatsapp_e164: whatsappE164,
                });
            }

            router.push('/cliente/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-6 flex items-center justify-end gap-2">
                    <LanguageSwitcher compact />
                    <ThemeToggle compact />
                </div>

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-4xl font-bold text-primary">
                        ZUMA
                    </Link>
                    <p className="text-muted mt-2">
                        {mode === 'login' ? t('customer.login') : t('customer.register')}
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl bg-card p-8 border border-borderc shadow-lg">
                    {resetSuccess && (
                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            {resetSuccessMessage}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${mode === 'login'
                                ? 'bg-primary text-white'
                                : 'bg-muted/20 text-muted hover:bg-muted/30'
                                }`}
                        >
                            {t('customer.login')}
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${mode === 'register'
                                ? 'bg-primary text-white'
                                : 'bg-muted/20 text-muted hover:bg-muted/30'
                                }`}
                        >
                            {t('customer.register')}
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm border border-danger-100">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('common.email')}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('customer.password')}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <Link
                                href="/cliente/recuperar-senha"
                                className="text-sm text-primary hover:underline block"
                            >
                                {t('customer.forgotPassword')}
                            </Link>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.processing') : t('customer.login')}
                            </button>
                        </form>
                    )}

                    {/* Register Form */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('checkout.fullName')} *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder={t('checkout.namePlaceholder')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('common.email')} *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('common.whatsapp')} *
                                </label>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="841234567"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('customer.password')} *
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('common.processing') : t('customer.createAccount')}
                            </button>

                            <p className="text-xs text-center text-muted">
                                {t('customer.agreeToTerms')}
                            </p>
                        </form>
                    )}

                    {/* Benefits */}
                    {mode === 'register' && (
                        <div className="mt-6 pt-6 border-t border-borderc">
                            <p className="text-sm font-semibold mb-3">
                                {t('customer.benefits.title')}
                            </p>
                            <ul className="space-y-2 text-sm text-muted">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">✓</span>
                                    <span>{t('customer.benefits.orderHistory')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">✓</span>
                                    <span>{t('customer.benefits.fastCheckout')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">✓</span>
                                    <span>{t('customer.benefits.loyaltyPoints')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">✓</span>
                                    <span>{t('customer.benefits.exclusiveOffers')}</span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Back to homepage */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
                        ← {t('common.back')} {t('customer.toHomepage')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
