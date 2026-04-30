"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btnPrimary, btnSecondary, input } from "../ui/classes";
import { Upload, Trash2, AlertCircle, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

type DigitalCode = {
    id: string;
    offer_id: string;
    code_content: string;
    status: 'available' | 'sold' | 'revoked';
    created_at: string;
    assigned_at?: string;
    offers?: {
        id: string;
        denomination_value: number;
        denomination_currency: string;
        brands?: {
            id: string;
            name: string;
        };
    };
};

type Offer = {
    id: string;
    brand_id?: string;
    brand_name: string;
    region_code?: string;
    denomination_value: number;
    denomination_currency: string;
    price: number;
    stock_quantity: number;
};

export default function DigitalCodesManager() {
    const { t, locale } = useI18n();
    const searchParams = useSearchParams();
    const preselectOfferId = searchParams.get('offer_id') || '';
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOfferId, setSelectedOfferId] = useState<string>('');
    const [codes, setCodes] = useState<DigitalCode[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold' | 'revoked'>('all');

    // Upload states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [bulkCodes, setBulkCodes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    function showMessage(text: string, type: 'success' | 'error' = 'success') {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    }

    useEffect(() => {
        fetchOffers();
    }, []);

    useEffect(() => {
        if (selectedOfferId) {
            fetchCodes();
        } else {
            setCodes([]);
        }
    }, [selectedOfferId]);

    async function fetchOffers() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/offers');
            const json = await res.json();
            const offersData = (json.data || []).map((offer: any) => ({
                ...offer,
                brand_name: offer.brand_name || offer.brand?.name || '—',
                brand_id: offer.brand_id || offer.brand?.id,
                stock_quantity: typeof offer.stock_quantity === 'number' ? offer.stock_quantity : 0,
                region_code: offer.region_code,
            }));
            setOffers(offersData);
            const nextSelected = preselectOfferId && offersData.some((o: Offer) => o.id === preselectOfferId)
                ? preselectOfferId
                : (selectedOfferId || offersData[0]?.id || '');
            if (nextSelected) setSelectedOfferId(nextSelected);
        } catch (err) {
            console.error('Failed to fetch offers:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchCodes() {
        try {
            const params = new URLSearchParams();
            if (selectedOfferId) params.append('offer_id', selectedOfferId);

            const res = await fetch(`/api/admin/digital-codes?${params}`);
            const json = await res.json();
            setCodes(json.data || []);
        } catch (err) {
            console.error('Failed to fetch codes:', err);
        }
    }

    async function handleBulkUpload() {
        if (!selectedOfferId || !bulkCodes.trim()) {
            showMessage(t('inventory.messages.selectOfferError'), 'error');
            return;
        }

        setUploading(true);
        try {
            const codesArray = bulkCodes
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            if (codesArray.length === 0) {
                showMessage(t('inventory.messages.noValidCodes'), 'error');
                return;
            }

            const res = await fetch('/api/admin/digital-codes/bulk-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offer_id: selectedOfferId,
                    codes: codesArray
                })
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.error);

            showMessage(`✅ ${t('inventory.messages.uploadSuccess', { count: json.count })}`);
            setBulkCodes('');
            setShowUploadModal(false);
            fetchCodes();
            fetchOffers(); // Refresh stock counts
        } catch (err: any) {
            showMessage(err.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    }

    async function revokeCode(id: string) {
        if (!confirm(t('inventory.messages.revokeConfirm'))) return;

        try {
            const res = await fetch(`/api/admin/digital-codes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'revoked' })
            });

            if (!res.ok) throw new Error();

            showMessage(t('inventory.messages.revokeSuccess'));
            fetchCodes();
            fetchOffers();
        } catch (err) {
            showMessage('Failed to revoke code', 'error');
        }
    }

    async function deleteCode(id: string) {
        if (!confirm(t('inventory.messages.deleteConfirm'))) return;

        try {
            const res = await fetch(`/api/admin/digital-codes/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error();

            showMessage(t('inventory.messages.deleteSuccess'));
            fetchCodes();
            fetchOffers();
        } catch (err) {
            showMessage('Failed to delete code', 'error');
        }
    }

    function downloadCSVTemplate() {
        const csv = `code1
code2
code3
CODE-XXXX-XXXX-XXXX
ABC123DEF456`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codes_template.csv';
        a.click();
    }

    const selectedOffer = offers.find(o => o.id === selectedOfferId);
    const availableCount = codes.filter(c => c.status === 'available').length;
    const soldCount = codes.filter(c => c.status === 'sold').length;
    const revokedCount = codes.filter(c => c.status === 'revoked').length;
    const visibleCodes = statusFilter === 'all'
        ? codes
        : codes.filter(c => c.status === statusFilter);

    if (loading) {
        return <div className="p-8 text-center text-muted">{t('common.loading')}</div>;
    }

    if (offers.length === 0) {
        return (
            <div className="p-10 text-center rounded-2xl border border-borderc bg-card shadow-card">
                <AlertCircle className="w-12 h-12 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-semibold">{t('inventory.noOffersTitle')}</h3>
                <p className="text-sm text-muted mt-2">{t('inventory.noOffersSubtitle')}</p>
            </div>
        );
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

            {/* Top Bar: Offer Selector + Upload Button */}
            <div className="bg-card rounded-2xl border border-borderc p-6 shadow-card">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">{t('inventory.selectOffer')}</label>
                        <select
                            className={`${input} max-w-md`}
                            value={selectedOfferId}
                            onChange={(e) => setSelectedOfferId(e.target.value)}
                        >
                            {offers.map((offer) => (
                                <option key={offer.id} value={offer.id}>
                                    {offer.brand_name} - {offer.denomination_currency} {offer.denomination_value} ({offer.stock_quantity} {t('inventory.available').toLowerCase()})
                                </option>
                            ))}
                        </select>
                        {selectedOffer && (
                            <div className="mt-2 text-xs text-muted">
                                {selectedOffer.brand_name} · {selectedOffer.denomination_currency} {selectedOffer.denomination_value}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {selectedOffer && (
                            <Link
                                href={`/admin/offers?brand=${selectedOffer.brand_id || ''}${selectedOffer.region_code ? `&region=${selectedOffer.region_code}` : ''}`}
                                className={btnSecondary}
                            >
                                {t('inventory.viewOffers')}
                            </Link>
                        )}
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className={`${btnPrimary} flex items-center gap-2`}
                        >
                            <Upload className="w-4 h-4" />
                            {t('inventory.uploadCodes')}
                        </button>
                    </div>
                </div>

                {selectedOffer && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-borderc bg-muted/10 p-4">
                            <div className="text-xs font-semibold uppercase text-muted mb-1">{t('inventory.totalCodes')}</div>
                            <div className="text-2xl font-bold text-foreground">{codes.length}</div>
                        </div>
                        <div className="rounded-xl border border-success-500/20 bg-success-50/70 p-4">
                            <div className="text-xs font-semibold uppercase text-success-700 mb-1">{t('inventory.available')}</div>
                            <div className="text-2xl font-bold text-success-700">{availableCount}</div>
                        </div>
                        <div className="rounded-xl border border-borderc bg-muted/10 p-4">
                            <div className="text-xs font-semibold uppercase text-muted mb-1">{t('inventory.sold')}</div>
                            <div className="text-2xl font-bold text-foreground">{soldCount}</div>
                        </div>
                        <div className="rounded-xl border border-danger-500/20 bg-danger-50/70 p-4">
                            <div className="text-xs font-semibold uppercase text-danger-700 mb-1">{t('inventory.revoked')}</div>
                            <div className="text-2xl font-bold text-danger-700">{revokedCount}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 rounded-2xl border border-borderc bg-card p-2">
                {(['all', 'available', 'sold', 'revoked'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${statusFilter === status
                            ? 'bg-zuma-500 text-white shadow-sm'
                            : 'text-muted hover:bg-muted/20 hover:text-foreground'
                            }`}
                    >
                        {t(`inventory.${status}`)}
                    </button>
                ))}
            </div>

            {/* Codes List */}
            <div className="bg-card rounded-2xl border border-borderc overflow-hidden">
                {visibleCodes.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                        {statusFilter === 'all'
                            ? t('inventory.noCodes')
                            : t('inventory.noStatusCodes', { status: t(`inventory.${statusFilter}`).toLowerCase() })
                        }
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/20 border-b border-borderc">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">{t('inventory.table.code')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">{t('inventory.table.status')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">{t('inventory.table.created')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">{t('inventory.table.sold')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase">{t('inventory.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleCodes.map((code) => (
                                    <tr key={code.id} className="border-b border-borderc last:border-0 hover:bg-muted/10">
                                        <td className="px-4 py-3 font-mono text-sm">{code.code_content}</td>
                                        <td className="px-4 py-3">
                                            {code.status === 'available' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-50 text-success-700 rounded-full text-xs font-semibold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t('inventory.available')}
                                                </span>
                                            )}
                                            {code.status === 'sold' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/30 text-muted rounded-full text-xs font-semibold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t('inventory.sold')}
                                                </span>
                                            )}
                                            {code.status === 'revoked' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-danger-50 text-danger-700 rounded-full text-xs font-semibold">
                                                    <XCircle className="w-3 h-3" />
                                                    {t('inventory.revoked')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted">
                                            {new Date(code.created_at).toLocaleDateString(locale)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted">
                                            {code.assigned_at ? new Date(code.assigned_at).toLocaleDateString(locale) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {code.status === 'available' && (
                                                    <button
                                                        onClick={() => revokeCode(code.id)}
                                                        className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                                    >
                                                        {t('inventory.revoked')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteCode(code.id)}
                                                    className="text-red-600 hover:text-red-700"
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

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl border border-borderc max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-borderc flex items-center justify-between">
                            <h3 className="text-lg font-bold">{t('inventory.modal.title')}</h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-muted hover:text-foreground"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="font-semibold mb-2">{t('inventory.modal.selectedOffer')}</h4>
                                <div className="p-4 bg-muted/20 rounded-lg text-sm">
                                    {selectedOffer?.brand_name} - {selectedOffer?.denomination_currency} {selectedOffer?.denomination_value}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="font-semibold">{t('inventory.modal.pasteCodes')}</label>
                                    <button
                                        onClick={downloadCSVTemplate}
                                        className="text-xs text-zuma-600 hover:text-zuma-700 flex items-center gap-1"
                                    >
                                        <Download className="w-3 h-3" />
                                        {t('inventory.modal.downloadTemplate')}
                                    </button>
                                </div>
                                <textarea
                                    className={`${input} min-h-[200px] font-mono text-sm`}
                                    placeholder={t('inventory.modal.placeholder')}
                                    value={bulkCodes}
                                    onChange={(e) => setBulkCodes(e.target.value)}
                                />
                                <p className="text-xs text-muted mt-2">
                                    {t('inventory.modal.readyToUpload', { count: bulkCodes.split('\n').filter(Boolean).length })}
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-borderc">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className={btnSecondary}
                                    disabled={uploading}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleBulkUpload}
                                    disabled={uploading || !bulkCodes.trim()}
                                    className={`${btnPrimary} flex items-center gap-2`}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('inventory.modal.uploading')}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            {t('inventory.uploadCodes')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
