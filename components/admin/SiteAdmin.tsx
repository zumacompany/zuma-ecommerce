"use client";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, input } from "../ui/classes";
import { Plus, Trash2, X, ChevronDown, ChevronRight, Save, Image as ImageIcon, Loader2 } from "lucide-react";

type HomeContent = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_banner_image?: string | null;
  featured_brands_title?: string | null;
  trust_points_title?: string | null;
  faq_title?: string | null;
  whatsapp_number?: string | null;
}

type TrustPoint = { id: string; title: string; subtitle?: string; sort_order: number };
type Faq = { id: string; question: string; answer: string; sort_order: number };
type Brand = { id: string; name: string; slug: string };

export default function SiteAdmin() {
  const [loading, setLoading] = useState(true);

  // Data States
  const [home, setHome] = useState<HomeContent>({});
  const [trustPoints, setTrustPoints] = useState<TrustPoint[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [featuredSlugs, setFeaturedSlugs] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<'home' | 'brands' | 'trust' | 'faqs'>('home');
  const [savingHome, setSavingHome] = useState(false);
  const [savingTrust, setSavingTrust] = useState(false);
  const [savingFaqs, setSavingFaqs] = useState(false);
  const [savingBrands, setSavingBrands] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Hero Image Upload State
  const [uploadingHero, setUploadingHero] = useState(false);

  function showMessage(text: string, type: 'success' | 'error' = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/home').then(r => r.json()),
      fetch('/api/admin/trust-points').then(r => r.json()),
      fetch('/api/admin/faqs').then(r => r.json()),
      fetch('/api/admin/home-featured-brands').then(r => r.json()),
      fetch('/api/admin/brands').then(r => r.json())
    ]).then(([homeRes, trustRes, faqRes, featRes, brandsRes]) => {
      setHome(homeRes.data || {});
      setTrustPoints(trustRes.data || []);
      setFaqs(faqRes.data || []);
      setFeaturedSlugs(featRes.data || []);
      setAllBrands(brandsRes.data || []);
      setLoading(false);
    });
  }, []);

  async function saveHomeSettings() {
    setSavingHome(true);
    try {
      const res = await fetch('/api/admin/home', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(home)
      });
      if (!res.ok) throw new Error();
      showMessage('General settings saved successfully!');
    } catch (err) {
      showMessage('Failed to save general settings', 'error');
    } finally {
      setSavingHome(false);
    }
  }

  // --- Featured Brands Logic ---
  async function toggleFeaturedBrand(slug: string) {
    const isAdded = featuredSlugs.includes(slug);
    setFeaturedSlugs(prev => isAdded ? prev.filter(s => s !== slug) : [...prev, slug]);
  }

  async function saveFeaturedBrands() {
    setSavingBrands(true);
    try {
      const res = await fetch('/api/admin/home-featured-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: featuredSlugs })
      });
      if (!res.ok) throw new Error();
      showMessage('Featured brands selection saved!');
    } catch (err) {
      showMessage('Failed to save featured brands', 'error');
    } finally {
      setSavingBrands(false);
    }
  }

  // --- Trust Points CRUD ---
  const [newTP, setNewTP] = useState({ title: '', subtitle: '' });
  async function createTrustPoint() {
    if (!newTP.title) return;
    const res = await fetch('/api/admin/trust-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTP)
    });
    if (res.ok) {
      setNewTP({ title: '', subtitle: '' });
      // Refresh list
      const json = await fetch('/api/admin/trust-points').then(r => r.json());
      setTrustPoints(json.data);
    }
  }
  async function deleteTrustPoint(id: string) {
    if (!confirm('Delete this trust point?')) return;
    await fetch(`/api/admin/trust-points/${id}`, { method: 'DELETE' });
    setTrustPoints(prev => prev.filter(p => p.id !== id));
  }
  async function updateTrustPoint(id: string, field: string, val: string) {
    setTrustPoints(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  }

  async function saveTrustPoints() {
    setSavingTrust(true);
    try {
      const res = await fetch('/api/admin/trust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trustPoints)
      });
      if (!res.ok) throw new Error();
      showMessage('Trust points saved successfully!');
    } catch (err) {
      showMessage('Failed to save trust points', 'error');
    } finally {
      setSavingTrust(false);
    }
  }

  // --- FAQ CRUD ---
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  async function createFaq() {
    if (!newFaq.question || !newFaq.answer) return;
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFaq)
    });
    if (res.ok) {
      setNewFaq({ question: '', answer: '' });
      const json = await fetch('/api/admin/faqs').then(r => r.json());
      setFaqs(json.data);
    }
  }
  async function deleteFaq(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
    setFaqs(prev => prev.filter(f => f.id !== id));
  }
  async function updateFaq(id: string, field: string, val: string) {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f));
  }

  async function saveFaqs() {
    setSavingFaqs(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqs)
      });
      if (!res.ok) throw new Error();
      showMessage('FAQs saved successfully!');
    } catch (err) {
      showMessage('Failed to save FAQs', 'error');
    } finally {
      setSavingFaqs(false);
    }
  }

  // --- Image Upload ---
  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    try {
      const { supabase } = await import('../../lib/supabase/browser')
      const filePath = `hero/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('public-assets').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('public-assets').getPublicUrl(filePath);

      setHome(prev => ({ ...prev, hero_banner_image: data.publicUrl }));
      // Auto-save
      await fetch('/api/admin/home', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero_banner_image: data.publicUrl })
      });
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadingHero(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted">Loading Builder...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-borderc pb-4">
        <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'home' ? 'bg-zuma-100 text-zuma-700' : 'hover:bg-muted/50'}`}>Home Settings</button>
        <button onClick={() => setActiveTab('brands')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'brands' ? 'bg-zuma-100 text-zuma-700' : 'hover:bg-muted/50'}`}>Featured Brands</button>
        <button onClick={() => setActiveTab('trust')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'trust' ? 'bg-zuma-100 text-zuma-700' : 'hover:bg-muted/50'}`}>Trust Points</button>
        <button onClick={() => setActiveTab('faqs')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'faqs' ? 'bg-zuma-100 text-zuma-700' : 'hover:bg-muted/50'}`}>FAQs</button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
          <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="bg-card rounded-2xl border border-borderc p-6 space-y-6 animate-in fade-in">
          <h3 className="text-lg font-bold">General Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Hero Title</label>
                <input className={input} value={home.hero_title || ''} onChange={e => setHome({ ...home, hero_title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Hero Subtitle</label>
                <input className={input} value={home.hero_subtitle || ''} onChange={e => setHome({ ...home, hero_subtitle: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">WhatsApp Number (Global)</label>
                <input className={input} placeholder="+258..." value={home.whatsapp_number || ''} onChange={e => setHome({ ...home, whatsapp_number: e.target.value })} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold">Hero Banner Image</label>
              {home.hero_banner_image ? (
                <div className="relative group">
                  <img src={home.hero_banner_image} className="w-full h-48 object-cover rounded-lg border border-borderc" />
                  <button
                    onClick={() => setHome({ ...home, hero_banner_image: null })}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-borderc rounded-lg flex flex-col items-center justify-center text-muted hover:border-zuma-500 hover:text-zuma-600 transition-colors cursor-pointer relative">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleHeroUpload(e.target.files[0])} />
                  {uploadingHero ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8 mb-2" />}
                  <span>Click to upload banner</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-borderc">
            <h4 className="font-semibold text-muted text-sm uppercase">Section Titles</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted">Featured Brands Title</label>
                <input className={input} value={home.featured_brands_title || ''} onChange={e => setHome({ ...home, featured_brands_title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted">Trust Points Title</label>
                <input className={input} value={home.trust_points_title || ''} onChange={e => setHome({ ...home, trust_points_title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted">FAQ Title</label>
                <input className={input} value={home.faq_title || ''} onChange={e => setHome({ ...home, faq_title: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={saveHomeSettings} disabled={savingHome} className={`${btnPrimary} flex items-center gap-2`}>
              {savingHome ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {activeTab === 'brands' && (
        <div className="bg-card rounded-2xl border border-borderc p-6 animate-in fade-in">
          <h3 className="text-lg font-bold mb-4">Featured Brands Selection</h3>
          <p className="text-sm text-muted mb-6">Select which brands appear on the homepage. They will be displayed in the order selected (future feature: drag sort).</p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allBrands.map(brand => {
              const isSelected = featuredSlugs.includes(brand.slug);
              return (
                <div
                  key={brand.id}
                  onClick={() => toggleFeaturedBrand(brand.slug)}
                  className={`
                              cursor-pointer rounded-xl border p-4 transition-all text-center select-none
                              ${isSelected
                      ? 'border-zuma-500 bg-zuma-50 text-zuma-700 ring-2 ring-zuma-200'
                      : 'border-borderc hover:border-zuma-300 hover:bg-muted/20'}
                           `}
                >
                  <div className="font-semibold">{brand.name}</div>
                  {isSelected && <div className="text-xs mt-1 font-bold text-zuma-600">SELECTED</div>}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-borderc">
            <button onClick={saveFeaturedBrands} disabled={savingBrands} className={`${btnPrimary} flex items-center gap-2 px-8`}>
              {savingBrands ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Selection & Order
            </button>
          </div>
        </div>
      )}

      {activeTab === 'trust' && (
        <div className="space-y-6 animate-in fade-in">
          {/* CREATE FORM */}
          <div className="bg-card rounded-2xl border border-borderc p-6">
            <h4 className="text-sm font-bold uppercase text-muted mb-4">Add New Trust Point</h4>
            <div className="flex gap-3">
              <input className={`${input} flex-1`} placeholder="Title (e.g. Instant Delivery)" value={newTP.title} onChange={e => setNewTP({ ...newTP, title: e.target.value })} />
              <input className={`${input} flex-1`} placeholder="Subtitle (e.g. Code via WhatsApp)" value={newTP.subtitle} onChange={e => setNewTP({ ...newTP, subtitle: e.target.value })} />
              <button onClick={createTrustPoint} disabled={!newTP.title} className={btnPrimary}>Add</button>
            </div>
          </div>

          {/* LIST */}
          <div className="bg-card rounded-2xl border border-borderc overflow-hidden">
            {trustPoints.map((tp, idx) => (
              <div key={tp.id} className="p-4 border-b border-borderc last:border-0 flex gap-4 items-center hover:bg-muted/10">
                <span className="text-muted font-mono text-xs w-6">{idx + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input
                    className="bg-transparent border-none focus:ring-0 font-semibold p-0 text-foreground"
                    value={tp.title}
                    onChange={e => updateTrustPoint(tp.id, 'title', e.target.value)}
                  />
                  <input
                    className="bg-transparent border-none focus:ring-0 text-muted p-0"
                    value={tp.subtitle || ''}
                    onChange={e => updateTrustPoint(tp.id, 'subtitle', e.target.value)}
                  />
                </div>
                <button onClick={() => deleteTrustPoint(tp.id)} className="text-muted hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {trustPoints.length === 0 && <div className="p-8 text-center text-muted">No trust points added.</div>}
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={saveTrustPoints} disabled={savingTrust} className={`${btnPrimary} flex items-center gap-2`}>
              {savingTrust ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Trust Points
            </button>
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="space-y-6 animate-in fade-in">
          {/* CREATE FORM */}
          <div className="bg-card rounded-2xl border border-borderc p-6">
            <h4 className="text-sm font-bold uppercase text-muted mb-4">Add New FAQ</h4>
            <div className="space-y-3">
              <input className={input} placeholder="Question" value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} />
              <textarea className={`${input} min-h-[80px]`} placeholder="Answer" value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} />
              <div className="flex justify-end">
                <button onClick={createFaq} disabled={!newFaq.question} className={btnPrimary}>Add FAQ</button>
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="space-y-4">
            {faqs.map((f, idx) => (
              <div key={f.id} className="bg-card rounded-xl border border-borderc p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <input
                      className="w-full bg-transparent border-none focus:ring-0 font-bold text-lg p-0 text-foreground"
                      value={f.question}
                      onChange={e => updateFaq(f.id, 'question', e.target.value)}
                    />
                    <textarea
                      className="w-full bg-transparent border-none focus:ring-0 text-muted p-0 resize-none min-h-[60px]"
                      value={f.answer}
                      onChange={e => updateFaq(f.id, 'answer', e.target.value)}
                    />
                  </div>
                  <button onClick={() => deleteFaq(f.id)} className="text-muted hover:text-red-600 p-2"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <div className="p-8 text-center text-muted bg-card rounded-2xl border border-borderc">No FAQs added.</div>}
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={saveFaqs} disabled={savingFaqs} className={`${btnPrimary} flex items-center gap-2`}>
              {savingFaqs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save FAQs
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
