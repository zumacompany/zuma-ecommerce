"use client";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, input } from "../ui/classes";

type TrustPoint = { title: string; subtitle?: string };
type Faq = { question: string; answer: string };
type HomeValue = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_banner_image?: string | null;
  featured_brand_slugs?: string[];
  trust_points?: TrustPoint[];
  faqs?: Faq[];
}

type SiteValue = { whatsapp_number?: string }

export default function SiteAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [home, setHome] = useState<HomeValue>({});
  const [site, setSite] = useState<SiteValue>({});

  const [brands, setBrands] = useState<Array<{id:string;name:string;slug:string}>>([])

  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<Array<{id:number; type: 'success'|'error'|'info'; message: string}>>([])
  const [errors, setErrors] = useState<Record<string,string>>({})

  // Hero image crop/upload state
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null)
  const [selectedHeroDataUrl, setSelectedHeroDataUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [cropZoom, setCropZoom] = useState<number>(1)
  const cropAspect = 16 / 9

  useEffect(() => {
    fetchData()
    fetchBrands()
  }, [])

  // Simple toast helper
  function pushToast(type: 'success'|'error'|'info', message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 4000)
  }

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/site')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setHome(json.data.home ?? {})
      setSite(json.data.site ?? {})
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
      pushToast('error', 'Failed to load site data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBrands() {
    try {
      const res = await fetch('/api/admin/brands')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setBrands(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      // non-fatal
    }
  }

  // Home form handlers
  function updateHomeField<K extends keyof HomeValue>(k: K, v: HomeValue[K]) {
    setHome((h) => ({ ...h, [k]: v }))
  }

  function addTrustPoint() {
    setHome((h) => ({ ...h, trust_points: [...(h.trust_points ?? []), { title: '', subtitle: '' }] }))
  }

  function updateTrustPoint(i: number, key: keyof TrustPoint, val: string) {
    setHome((h) => ({ ...h, trust_points: (h.trust_points ?? []).map((t, idx) => idx === i ? { ...t, [key]: val } : t) }))
  }

  function removeTrustPoint(i: number) {
    setHome((h) => ({ ...h, trust_points: (h.trust_points ?? []).filter((_, idx) => idx !== i) }))
  }

  function addFaq() {
    setHome((h) => ({ ...h, faqs: [...(h.faqs ?? []), { question: '', answer: '' }] }))
  }

  function updateFaq(i: number, key: keyof Faq, val: string) {
    setHome((h) => ({ ...h, faqs: (h.faqs ?? []).map((f, idx) => idx === i ? { ...f, [key]: val } : f) }))
  }

  function removeFaq(i: number) {
    setHome((h) => ({ ...h, faqs: (h.faqs ?? []).filter((_, idx) => idx !== i) }))
  }

  function toggleFeaturedBrand(slug: string) {
    setHome((h) => ({ ...h, featured_brand_slugs: (h.featured_brand_slugs ?? []).includes(slug) ? (h.featured_brand_slugs ?? []).filter(s => s !== slug) : [...(h.featured_brand_slugs ?? []), slug] }))
  }

  function validate() {
    const next: Record<string,string> = {}
    if (!home.hero_title || home.hero_title.trim() === '') next['hero_title'] = 'Hero title is required'
    if (site.whatsapp_number && !/^\+\d{8,15}$/.test(site.whatsapp_number)) next['whatsapp_number'] = 'Use international format, e.g. +25884...'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function isPreviewEmpty(h: HomeValue) {
    const emptyHero = !(h.hero_title || h.hero_subtitle || h.hero_banner_image)
    const emptyBrands = !(h.featured_brand_slugs && h.featured_brand_slugs.length > 0)
    const emptyTrust = !(h.trust_points && h.trust_points.length > 0)
    const emptyFaqs = !(h.faqs && h.faqs.length > 0)
    return emptyHero && emptyBrands && emptyTrust && emptyFaqs
  }

  async function save() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)

    if (!validate()) {
      pushToast('error', 'Fix validation errors before saving')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'home', value: home }) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      const res2 = await fetch('/api/admin/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'site', value: site }) })
      const json2 = await res2.json()
      if (json2.error) throw new Error(json2.error)

      pushToast('success', 'Site content saved')
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
      pushToast('error', 'Failed to save: ' + (err?.message ?? 'unknown'))
    } finally {
      setIsSaving(false)
    }
  }

  function SkeletonSection({ lines = 3 }: { lines?: number }) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded w-full" />
        ))}
      </div>
    )
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Loading home...</h3>
        <div className="mt-4 grid grid-cols-1 gap-3"><SkeletonSection lines={3} /></div>
      </div>
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Loading settings...</h3>
        <div className="mt-3"><SkeletonSection lines={1} /></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl bg-card p-4 border border-borderc text-danger-500">{error}</div>}

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Home — Hero</h3>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <input className={input} placeholder="Hero title" value={home.hero_title ?? ''} onChange={(e) => updateHomeField('hero_title', e.target.value)} />
            {errors['hero_title'] && <div className="text-xs text-danger-500 mt-1">{errors['hero_title']}</div>}
          </div>
          <input className={input} placeholder="Hero subtitle" value={home.hero_subtitle ?? ''} onChange={(e) => updateHomeField('hero_subtitle', e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <div className="sm:col-span-2">
              <input className={input} placeholder="Hero banner image URL" value={home.hero_banner_image ?? ''} onChange={(e) => updateHomeField('hero_banner_image', e.target.value)} />
              <div className="mt-2 text-xs text-muted">Or upload an image file for the hero banner</div>
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setError(null)
                  const reader = new FileReader()
                  reader.onload = () => {
                    setSelectedHeroFile(f)
                    setSelectedHeroDataUrl(String(reader.result))
                    setCropZoom(1)
                    setShowCropper(true)
                  }
                  reader.readAsDataURL(f)
                }} />
                {home.hero_banner_image && <button className={`px-2 py-1 rounded border border-borderc ${btnSecondary}`} onClick={() => updateHomeField('hero_banner_image', '')}>Remove</button>}
              </div>

              {/* Cropper modal / inline */}
              {showCropper && selectedHeroDataUrl && (
                <div className="mt-4 p-4 border border-borderc rounded bg-white">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden" style={{ aspectRatio: `${cropAspect}` }}>
                        <img src={selectedHeroDataUrl} alt="To crop" style={{ transform: `scale(${cropZoom})`, maxWidth: '100%', maxHeight: '100%' }} />
                      </div>
                      <div className="mt-3">
                        <label className="text-sm text-muted">Zoom</label>
                        <input type="range" min="1" max="2" step="0.01" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                    <div className="w-56">
                      <div className="mb-2"><strong>Preview</strong></div>
                      <div className="w-full h-32 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                        <img src={selectedHeroDataUrl} alt="preview" style={{ transform: `scale(${cropZoom})`, maxWidth: '100%', maxHeight: '100%' }} />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className={btnPrimary} onClick={async () => {
                          // Crop and upload
                          try {
                            setError(null)
                            // create image element
                            const img = new Image()
                            img.src = selectedHeroDataUrl!
                            await new Promise((res, rej) => { img.onload = res; img.onerror = rej })

                            const naturalW = img.naturalWidth
                            const naturalH = img.naturalHeight
                            // compute crop box centered with zoom
                            const cropW = Math.min(naturalW, Math.round(naturalW / cropZoom))
                            const cropH = Math.round(cropW / cropAspect)
                            const sx = Math.max(0, Math.round((naturalW - cropW) / 2))
                            const sy = Math.max(0, Math.round((naturalH - cropH) / 2))

                            const canvas = document.createElement('canvas')
                            canvas.width = cropW
                            canvas.height = cropH
                            const ctx = canvas.getContext('2d')!
                            ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height)

                            const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9))
                            if (!blob) throw new Error('Failed to create cropped image')

                            const fileName = `hero-banners/${Date.now()}-cropped.jpg`
                            const file = new File([blob], fileName, { type: 'image/jpeg' })

                            const { supabase } = await import('../../lib/supabase/browser')
                            const { data: uploadData, error: uploadError } = await supabase.storage.from('public-assets').upload(fileName, file, { cacheControl: '3600', upsert: false })
                            if (uploadError) throw uploadError
                            const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(fileName)
                            updateHomeField('hero_banner_image', urlData.publicUrl)
                            pushToast('success', 'Hero image uploaded')
                            // reset cropper
                            setShowCropper(false)
                            setSelectedHeroDataUrl(null)
                            setSelectedHeroFile(null)
                          } catch (err: any) {
                            console.error('crop/upload failed', err)
                            setError(err?.message ?? 'Crop/upload failed')
                            pushToast('error', 'Crop/upload failed')
                          }
                        }}>Crop & upload</button>
                        <button className={btnSecondary} onClick={() => { setShowCropper(false); setSelectedHeroDataUrl(null); setSelectedHeroFile(null) }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              {home.hero_banner_image ? (
                <img src={home.hero_banner_image} alt="Hero banner" className="max-h-24 rounded" />
              ) : (
                <div className="text-sm text-muted">No image</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Featured brands</h3>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {brands.map((b) => (
            <label key={b.slug} className="inline-flex items-center gap-2 border border-borderc rounded-md p-2">
              <input type="checkbox" checked={(home.featured_brand_slugs ?? []).includes(b.slug)} onChange={() => toggleFeaturedBrand(b.slug)} />
              <div className="text-sm">{b.name}</div>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Trust points</h3>
        <div className="mt-3 space-y-2">
          {(home.trust_points ?? []).map((t, i) => (
            <div key={i} className="flex gap-2">
              <input className={input} placeholder="Title" value={t.title} onChange={(e) => updateTrustPoint(i, 'title', e.target.value)} />
              <input className={input} placeholder="Subtitle" value={t.subtitle ?? ''} onChange={(e) => updateTrustPoint(i, 'subtitle', e.target.value)} />
              <button className={btnSecondary} onClick={() => removeTrustPoint(i)}>Remove</button>
            </div>
          ))}
          <div>
            <button className={btnPrimary} onClick={addTrustPoint}>Add trust point</button>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">FAQs</h3>
        <div className="mt-3 space-y-2">
          {(home.faqs ?? []).map((f, i) => (
            <div key={i} className="space-y-1">
              <input className={input} placeholder="Question" value={f.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} />
              <textarea className="w-full rounded-lg border border-borderc p-2" placeholder="Answer" value={f.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} />
              <div><button className={btnSecondary} onClick={() => removeFaq(i)}>Remove</button></div>
            </div>
          ))}
          <div>
            <button className={btnPrimary} onClick={addFaq}>Add FAQ</button>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Site settings</h3>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div>
            <input className={input} placeholder="WhatsApp number (e.g. +25884...)" value={site.whatsapp_number ?? ''} onChange={(e) => setSite((s) => ({ ...s, whatsapp_number: e.target.value }))} />
            {errors['whatsapp_number'] && <div className="text-xs text-danger-500 mt-1">{errors['whatsapp_number']}</div>}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button className={`${btnPrimary} ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`} onClick={save} disabled={isSaving}>
          {isSaving ? <><span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />Saving...</> : 'Save'}
        </button>
        <button className={btnSecondary} onClick={fetchData} disabled={isSaving}>Reload</button>
      </div>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="mt-3">
          {isPreviewEmpty(home) ? (
            <div className="text-sm text-muted">No data</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded bg-zuma-50 p-4">
                {home.hero_banner_image && <img src={home.hero_banner_image} alt="Hero" className="w-full max-h-48 object-cover rounded mb-3" />}
                <h2 className="text-xl font-bold">{home.hero_title}</h2>
                {home.hero_subtitle && <p className="text-sm text-muted">{home.hero_subtitle}</p>}
              </div>

              {home.featured_brand_slugs && home.featured_brand_slugs.length > 0 && (
                <div>
                  <h4 className="font-semibold">Featured brands</h4>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {brands.filter(b => (home.featured_brand_slugs ?? []).includes(b.slug)).map(b => (
                      <div key={b.id} className="p-2 border border-borderc rounded text-sm">{b.name}</div>
                    ))}
                  </div>
                </div>
              )}

              {home.trust_points && home.trust_points.length > 0 && (
                <div>
                  <h4 className="font-semibold">Trust points</h4>
                  <ul className="mt-2 list-disc list-inside">
                    {(home.trust_points ?? []).map((t, i) => <li key={i}><strong>{t.title}</strong>{t.subtitle ? ` — ${t.subtitle}` : ''}</li>)}
                  </ul>
                </div>
              )}

              {home.faqs && home.faqs.length > 0 && (
                <div>
                  <h4 className="font-semibold">FAQs</h4>
                  <div className="mt-2 space-y-2">
                    {(home.faqs ?? []).map((f, i) => (
                      <div key={i}>
                        <div className="font-medium">Q: {f.question}</div>
                        <div className="text-sm text-muted">A: {f.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
