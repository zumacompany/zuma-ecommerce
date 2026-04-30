"use client";
import { useState, useEffect } from 'react';
import { useI18n } from '../../../lib/i18n';
import { supabase } from '../../../lib/supabase/browser';
import { Loader2, UserPlus, Mail, Lock, Calendar, Trash2 } from 'lucide-react';

type AdminUser = {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
};

export default function AdminUsersPage() {
    const { t } = useI18n();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('Not authenticated');
                return;
            }

            const res = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to load users');
            }

            const data = await res.json();
            setUsers(data.users);
        } catch (err: any) {
            console.error('Error loading users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAdmin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setCreating(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create admin');
            }

            setSuccess(t('admin.users.successCreate'));
            setEmail('');
            setPassword('');
            setShowForm(false);

            // Reload users list
            await loadUsers();
        } catch (err: any) {
            console.error('Error creating admin:', err);
            setError(err.message);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('admin.users.title')}</h1>
                    <p className="text-muted mt-1">{t('admin.users.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    {t('admin.users.createNew')}
                </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
                    {success}
                </div>
            )}

            {/* Create Form */}
            {showForm && (
                <div className="mb-6 p-6 bg-card border border-borderc rounded-xl">
                    <h2 className="text-xl font-semibold mb-4">{t('admin.users.createNew')}</h2>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                {t('admin.users.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-card border border-borderc rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                placeholder="admin@zuma.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                {t('admin.users.password')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-card border border-borderc rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                                minLength={8}
                                required
                            />
                            <p className="text-xs text-muted mt-1">{t('admin.users.passwordHint')}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        {t('admin.users.create')}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-borderc rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-card border border-borderc rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted" />
                        <p className="text-muted mt-2">{t('common.loading')}</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                        {t('admin.users.noUsers')}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-borderc">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold">{t('admin.users.email')}</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold">{t('admin.users.createdAt')}</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold">{t('admin.users.lastSignIn')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-borderc last:border-0 hover:bg-muted/20">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-muted" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t('admin.users.never')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
