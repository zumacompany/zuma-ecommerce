"use client";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, input } from "../ui/classes";
import { Plus, Trash2, Edit2, Save, X, CheckCircle, XCircle, Loader2, GripVertical } from "lucide-react";

type PaymentMethod = {
    id: string;
    name: string;
    type: 'manual' | 'stripe' | 'mpesa';
    instructions_md: string | null;
    details: any;
    status: 'active' | 'inactive';
    sort_order: number;
};

export default function PaymentMethodsManager() {
    const [loading, setLoading] = useState(true);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<PaymentMethod>>({
        name: '',
        type: 'manual',
        instructions_md: '',
        details: {},
        status: 'active',
        sort_order: 0
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    function showMessage(text: string, type: 'success' | 'error' = 'success') {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    }

    useEffect(() => {
        fetchMethods();
    }, []);

    async function fetchMethods() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/payment-methods');
            const json = await res.json();
            setMethods(json.data || []);
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        } finally {
            setLoading(false);
        }
    }

    function startCreate() {
        setFormData({
            name: '',
            type: 'manual',
            instructions_md: '',
            details: {},
            status: 'active',
            sort_order: methods.length
        });
        setCreating(true);
        setEditing(null);
    }

    function startEdit(method: PaymentMethod) {
        setFormData({ ...method });
        setEditing(method.id);
        setCreating(false);
    }

    function cancelEdit() {
        setEditing(null);
        setCreating(false);
        setFormData({
            name: '',
            type: 'manual',
            instructions_md: '',
            details: {},
            status: 'active',
            sort_order: 0
        });
    }

    async function handleSave() {
        if (!formData.name || !formData.type) {
            showMessage('Name and type are required', 'error');
            return;
        }

        setSaving(true);
        try {
            const url = creating
                ? '/api/admin/payment-methods'
                : `/api/admin/payment-methods/${editing}`;

            const method = creating ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Failed to save');

            showMessage(`Payment method ${creating ? 'created' : 'updated'} successfully!`);
            cancelEdit();
            fetchMethods();
        } catch (err: any) {
            showMessage(err.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete payment method "${name}"? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/admin/payment-methods/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error();

            showMessage('Payment method deleted successfully');
            fetchMethods();
        } catch (err) {
            showMessage('Failed to delete payment method', 'error');
        }
    }

    async function toggleStatus(method: PaymentMethod) {
        try {
            const newStatus = method.status === 'active' ? 'inactive' : 'active';
            const res = await fetch(`/api/admin/payment-methods/${method.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error();

            showMessage(`Payment method ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchMethods();
        } catch (err) {
            showMessage('Failed to update status', 'error');
        }
    }

    const TypeLabels = {
        manual: 'Manual Transfer',
        stripe: 'Stripe',
        mpesa: 'M-Pesa'
    };

    if (loading) {
        return <div className="p-8 text-center text-muted">Loading payment methods...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Message Banner */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Payment Methods</h2>
                    <p className="text-sm text-muted mt-1">Manage payment options for your customers</p>
                </div>
                {!creating && !editing && (
                    <button onClick={startCreate} className={`${btnPrimary} flex items-center gap-2`}>
                        <Plus className="w-4 h-4" />
                        Add Payment Method
                    </button>
                )}
            </div>

            {/* Create/Edit Form */}
            {(creating || editing) && (
                <div className="bg-card rounded-2xl border border-borderc p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {creating ? 'Create Payment Method' : 'Edit Payment Method'}
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Name *</label>
                                <input
                                    type="text"
                                    className={input}
                                    placeholder="Bank Transfer, M-Pesa, etc."
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Type *</label>
                                <select
                                    className={input}
                                    value={formData.type || 'manual'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="manual">Manual Transfer</option>
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="stripe">Stripe</option>
                                </select>
                            </div>
                        </div>

                        {/* Type-specific fields */}
                        {formData.type === 'manual' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        className={input}
                                        placeholder="1234567890"
                                        value={formData.details?.account_number || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            details: { ...formData.details, account_number: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Account Name</label>
                                    <input
                                        type="text"
                                        className={input}
                                        placeholder="Company Name"
                                        value={formData.details?.account_name || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            details: { ...formData.details, account_name: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}

                        {formData.type === 'mpesa' && (
                            <div>
                                <label className="block text-sm font-semibold mb-2">M-Pesa Number</label>
                                <input
                                    type="text"
                                    className={input}
                                    placeholder="+258 84 000 0000"
                                    value={formData.details?.phone || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        details: { ...formData.details, phone: e.target.value }
                                    })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold mb-2">Instructions (Markdown supported)</label>
                            <textarea
                                className={`${input} min-h-[120px] font-mono text-sm`}
                                placeholder="1. Go to your bank app&#10;2. Transfer to account above&#10;3. Send proof to WhatsApp"
                                value={formData.instructions_md || ''}
                                onChange={(e) => setFormData({ ...formData, instructions_md: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Status</label>
                                <select
                                    className={input}
                                    value={formData.status || 'active'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Sort Order</label>
                                <input
                                    type="number"
                                    min="0"
                                    className={input}
                                    value={formData.sort_order ?? 0}
                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-borderc">
                            <button
                                onClick={cancelEdit}
                                className={btnSecondary}
                                disabled={saving}
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`${btnPrimary} flex items-center gap-2`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {creating ? 'Create' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Methods List */}
            <div className="bg-card rounded-2xl border border-borderc overflow-hidden">
                {methods.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                        No payment methods yet. Click "Add Payment Method" to create one.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/20 border-b border-borderc">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Order</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {methods.map((method) => (
                                    <tr key={method.id} className="border-b border-borderc last:border-0 hover:bg-muted/10">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-muted">
                                                <GripVertical className="w-4 h-4" />
                                                <span className="font-mono text-sm">{method.sort_order}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{method.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-muted">{TypeLabels[method.type]}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleStatus(method)}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${method.status === 'active'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {method.status === 'active' ? (
                                                    <><CheckCircle className="w-3 h-3" /> Active</>
                                                ) : (
                                                    <><XCircle className="w-3 h-3" /> Inactive</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEdit(method)}
                                                    className="text-blue-600 hover:text-blue-700 p-2"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(method.id, method.name)}
                                                    className="text-red-600 hover:text-red-700 p-2"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
