"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase/browser"
import { useI18n } from "../../lib/i18n"
import {
    Settings,
    Mail,
    MessageSquare,
    Globe,
    User,
    Shield,
    Loader2,
    Smartphone,
    CheckCircle2,
    AlertCircle
} from "lucide-react"

type SettingsTab = 'general' | 'contact' | 'profile' | 'security'

export default function GlobalSettingsPageUI() {
    const { t } = useI18n()
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [settings, setSettings] = useState({
        currency: 'MZN',
        language: 'pt',
        contact_email: '',
        contact_whatsapp: '',
        whatsapp_number: '', // For checkout integration
        admin_name: '',
        admin_title: '',
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const res = await fetch('/api/admin/settings', { cache: 'no-store' })
            if (!res.ok) throw new Error('Failed to fetch settings')
            const payload = await res.json()
            const data = payload.data ?? {}

            setSettings(prev => ({
                ...prev,
                currency: typeof data.currency === 'string' ? data.currency : 'MZN',
                language: data.language === 'en' ? 'en' : 'pt',
                contact_email: typeof data.contact_email === 'string' ? data.contact_email : '',
                contact_whatsapp: typeof data.contact_whatsapp === 'string' ? data.contact_whatsapp : '',
                whatsapp_number: typeof data.whatsapp_number === 'string' ? data.whatsapp_number : '',
                admin_name: typeof data.admin_name === 'string' ? data.admin_name : '',
                admin_title: typeof data.admin_title === 'string' ? data.admin_title : '',
            }))
        } catch (err) {
            console.error(err)
            setMessage({
                type: 'error',
                text: err instanceof Error ? err.message : t('errors.generic'),
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(key: string, value: any) {
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            })

            const payload = await res.json().catch(() => null)

            if (!res.ok) throw new Error(payload?.error || 'Failed to save')

            setMessage({ type: 'success', text: t('site.messages.saveSuccess') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-zuma-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
                    <p className="mt-2 text-sm text-muted">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <aside className="w-full md:w-64 space-y-1">
                    <TabButton
                        active={activeTab === 'general'}
                        onClick={() => setActiveTab('general')}
                        icon={<Globe className="w-4 h-4" />}
                        label={t('settings.tabs.general')}
                    />
                    <TabButton
                        active={activeTab === 'contact'}
                        onClick={() => setActiveTab('contact')}
                        icon={<Smartphone className="w-4 h-4" />}
                        label={t('settings.tabs.contact')}
                    />
                    <TabButton
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                        icon={<User className="w-4 h-4" />}
                        label={t('settings.tabs.profile')}
                    />
                    <TabButton
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                        icon={<Shield className="w-4 h-4" />}
                        label={t('settings.tabs.security')}
                    />
                </aside>

                {/* Content Area */}
                <main className="flex-1 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
                        {activeTab === 'general' && (
                            <SettingsSection
                                title={t('settings.general.title')}
                                description={t('settings.general.description')}
                            >
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <SelectField
                                        label={t('settings.general.currency')}
                                        value={settings.currency}
                                        onChange={(v: string) => handleInputChange('currency', v)}
                                        options={[
                                            { label: 'Mozambican Metical (MZN)', value: 'MZN' },
                                        ]}
                                        disabled
                                    />
                                    <SelectField
                                        label={t('settings.general.language')}
                                        value={settings.language}
                                        onChange={(v: string) => {
                                            handleInputChange('language', v)
                                            handleSave('language', v)
                                        }}
                                        options={[
                                            { label: 'Portuguese', value: 'pt' },
                                            { label: 'English', value: 'en' }
                                        ]}
                                    />
                                </div>
                                <p className="text-xs text-muted">
                                    {t('settings.general.currencyLockedHint')}
                                </p>
                            </SettingsSection>
                        )}

                        {activeTab === 'contact' && (
                            <SettingsSection
                                title={t('settings.contact.title')}
                                description={t('settings.contact.description')}
                            >
                                <div className="space-y-6">
                                    <InputField
                                        label={t('settings.contact.email')}
                                        type="email"
                                        icon={<Mail className="w-4 h-4" />}
                                        value={settings.contact_email}
                                        onChange={(v: string) => handleInputChange('contact_email', v)}
                                        onBlur={() => handleSave('contact_email', settings.contact_email)}
                                        placeholder="support@zuma.io"
                                    />
                                    <InputField
                                        label={t('settings.contact.whatsappBusiness')}
                                        type="tel"
                                        icon={<Smartphone className="w-4 h-4" />}
                                        value={settings.contact_whatsapp}
                                        onChange={(v: string) => handleInputChange('contact_whatsapp', v)}
                                        onBlur={() => handleSave('contact_whatsapp', settings.contact_whatsapp)}
                                        placeholder="+258 84 000 0000"
                                    />

                                    <div className="pt-4 border-t border-borderc">
                                        <h4 className="text-sm font-semibold text-foreground mb-3">{t('settings.contact.checkoutIntegration')}</h4>
                                        <InputField
                                            label={t('settings.contact.whatsappOrders')}
                                            type="tel"
                                            icon={<MessageSquare className="w-4 h-4" />}
                                            value={settings.whatsapp_number}
                                            onChange={(v: string) => handleInputChange('whatsapp_number', v)}
                                            onBlur={() => handleSave('whatsapp_number', settings.whatsapp_number)}
                                            placeholder="+258841234567"
                                        />
                                        <p className="mt-2 text-xs text-muted">
                                            {t('settings.contact.whatsappOrdersHint')}
                                        </p>
                                    </div>
                                </div>
                            </SettingsSection>
                        )}

                        {activeTab === 'profile' && (
                            <SettingsSection
                                title={t('settings.profile.title')}
                                description={t('settings.profile.description')}
                            >
                                <div className="space-y-6">
                                    <InputField
                                        label={t('settings.profile.displayName')}
                                        icon={<User className="w-4 h-4" />}
                                        value={settings.admin_name}
                                        onChange={(v: string) => handleInputChange('admin_name', v)}
                                        onBlur={() => handleSave('admin_name', settings.admin_name)}
                                        placeholder="John Doe"
                                    />
                                    <InputField
                                        label={t('settings.profile.proTitle')}
                                        icon={<Settings className="w-4 h-4" />}
                                        value={settings.admin_title}
                                        onChange={(v: string) => handleInputChange('admin_title', v)}
                                        onBlur={() => handleSave('admin_title', settings.admin_title)}
                                        placeholder="Chief Administrator"
                                    />
                                </div>
                            </SettingsSection>
                        )}

                        {activeTab === 'security' && (
                            <SettingsSection
                                title={t('settings.security.title')}
                                description={t('settings.security.description')}
                            >
                                <div className="space-y-6">
                                    <p className="text-sm text-muted italic">{t('settings.security.passwordHint')}</p>
                                    <button
                                        onClick={async () => {
                                            const email = (await supabase.auth.getUser()).data.user?.email
                                            if (email) {
                                                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                                    redirectTo: `${window.location.origin}/admin/reset-password`,
                                                })
                                                if (error) setMessage({ type: 'error', text: error.message })
                                                else setMessage({ type: 'success', text: t('settings.security.resetSuccess') })
                                            } else {
                                                setMessage({ type: 'error', text: t('errors.generic') })
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-zuma-500 text-white text-sm font-semibold rounded-xl hover:bg-zuma-600 transition-colors shadow-lg shadow-zuma-500/20"
                                    >
                                        <Shield className="w-4 h-4" />
                                        {t('settings.security.resetPassword')}
                                    </button>
                                </div>
                            </SettingsSection>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${active
                ? 'bg-zuma-500 text-white shadow-lg shadow-zuma-500/20'
                : 'text-muted hover:bg-muted/50 hover:text-foreground'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}

function SettingsSection({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">{description}</p>
            </div>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    )
}

function InputField({ label, type = "text", value, onChange, onBlur, placeholder, icon }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted ml-0.5">{label}</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/50 group-focus-within:text-zuma-500 transition-colors">
                    {icon}
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className="block w-full pl-10 pr-4 py-2.5 bg-background border border-borderc rounded-xl text-foreground placeholder-muted/40 focus:ring-2 focus:ring-zuma-500 focus:border-zuma-500 transition-all sm:text-sm"
                />
            </div>
        </div>
    )
}

function SelectField({ label, value, onChange, options, disabled = false }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted ml-0.5">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="block w-full px-4 py-2.5 bg-background border border-borderc rounded-xl text-foreground focus:ring-2 focus:ring-zuma-500 focus:border-zuma-500 transition-all sm:text-sm appearance-none disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}
