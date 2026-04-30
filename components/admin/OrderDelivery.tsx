"use client"

import { useMemo, useState } from "react"
import { Loader2, Mail, MessageCircle, Save } from "lucide-react"
import { useI18n } from "../../lib/i18n"

type FeedbackState =
  | { type: "success" | "error"; text: string }
  | null

const copy = {
  pt: {
    saveError: "Não foi possível guardar as alterações.",
    saveSuccess: "Alterações guardadas.",
    noWhatsapp: "Este cliente não tem um número de WhatsApp registado.",
    noEmail: "Este cliente não tem um email registado.",
    missingCodes: "Adicione os códigos antes de enviar.",
    whatsappReady: "Registo guardado. A conversa do WhatsApp foi aberta.",
    emailReady: "Registo guardado. O email foi preparado no seu cliente de correio.",
  },
  en: {
    saveError: "Could not save the changes.",
    saveSuccess: "Changes saved.",
    noWhatsapp: "This customer does not have a WhatsApp number on file.",
    noEmail: "This customer does not have an email address on file.",
    missingCodes: "Add the delivery codes before sending.",
    whatsappReady: "Saved. The WhatsApp conversation was opened.",
    emailReady: "Saved. The email draft was prepared in your mail app.",
  },
} as const

export default function OrderDelivery({
  orderId,
  initialCodes,
  initialNotes,
  customerName,
  customerWhatsapp,
  customerEmail,
}: {
  orderId: string
  initialCodes: string
  initialNotes: string
  customerName?: string
  customerWhatsapp?: string | null
  customerEmail?: string | null
}) {
  const { t, locale } = useI18n()
  const text = copy[locale]

  const [codes, setCodes] = useState(initialCodes || "")
  const [notes, setNotes] = useState(initialNotes || "")
  const [savedState, setSavedState] = useState({
    codes: initialCodes || "",
    notes: initialNotes || "",
  })
  const [activeAction, setActiveAction] = useState<"save" | "whatsapp" | "email" | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const hasChanges = codes !== savedState.codes || notes !== savedState.notes
  const busy = activeAction !== null

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "pt" ? "pt-MZ" : "en-US", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [locale]
  )

  async function persistChanges(nextCodes: string, nextNotes: string) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delivery_codes: nextCodes,
        admin_notes: nextNotes,
        updated_by_email: "admin@system",
      }),
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(json?.error || text.saveError)
    }

    setCodes(nextCodes)
    setNotes(nextNotes)
    setSavedState({ codes: nextCodes, notes: nextNotes })
    setLastSaved(new Date())
  }

  function buildActionNote(channelLabel: string, destination: string) {
    const timestamp = timestampFormatter.format(new Date())
    const previous = notes.trimEnd()
    const nextLine = `[${timestamp}] Sent via ${channelLabel} to ${destination}`
    return previous ? `${previous}\n${nextLine}` : nextLine
  }

  async function handleSave() {
    setFeedback(null)
    setActiveAction("save")

    try {
      await persistChanges(codes, notes)
      setFeedback({ type: "success", text: text.saveSuccess })
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : text.saveError,
      })
    } finally {
      setActiveAction(null)
    }
  }

  async function handleSendWhatsApp() {
    if (!customerWhatsapp) {
      setFeedback({ type: "error", text: text.noWhatsapp })
      return
    }

    if (!codes.trim()) {
      setFeedback({ type: "error", text: text.missingCodes })
      return
    }

    const cleanNumber = customerWhatsapp.replace(/\D/g, "")
    const message = `Olá ${customerName || "Cliente"}! 👋\n\nAqui estão os seus códigos de gift card:\n\n${codes}\n\nObrigado pela sua compra! 🎉\n\n- Equipe Zuma`
    const whatsappURL = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    const pendingWindow = window.open("", "_blank", "noopener,noreferrer")

    setFeedback(null)
    setActiveAction("whatsapp")

    try {
      await persistChanges(codes, buildActionNote("WhatsApp", customerWhatsapp))
      if (pendingWindow) {
        pendingWindow.location.href = whatsappURL
      } else {
        window.open(whatsappURL, "_blank", "noopener,noreferrer")
      }
      setFeedback({ type: "success", text: text.whatsappReady })
    } catch (error) {
      pendingWindow?.close()
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : text.saveError,
      })
    } finally {
      setActiveAction(null)
    }
  }

  async function handleSendEmail() {
    if (!customerEmail) {
      setFeedback({ type: "error", text: text.noEmail })
      return
    }

    if (!codes.trim()) {
      setFeedback({ type: "error", text: text.missingCodes })
      return
    }

    const subject = "Seus Códigos de Gift Card - Zuma"
    const body = `Olá ${customerName || "Cliente"}!\n\nAqui estão os seus códigos de gift card:\n\n${codes}\n\nObrigado pela sua compra!\n\nEquipe Zuma`
    const mailtoURL = `mailto:${customerEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`

    setFeedback(null)
    setActiveAction("email")

    try {
      await persistChanges(codes, buildActionNote("Email", customerEmail))
      window.location.href = mailtoURL
      setFeedback({ type: "success", text: text.emailReady })
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : text.saveError,
      })
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Fulfillment</p>
          <h3 className="text-lg font-semibold text-foreground">Delivery & Notes</h3>
          <p className="text-sm text-muted">
            Manage codes, send updates, and track internal notes.
          </p>
        </div>
        {lastSaved && (
          <span className="rounded-full border border-success-500/20 bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
            Saved at {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {feedback && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-success-500/20 bg-success-50 text-success-700"
              : "border-danger-500/20 bg-danger-50 text-danger-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-borderc bg-muted/10 p-4">
        <h4 className="text-sm font-semibold text-foreground">Customer contact</h4>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Name</p>
            <p className="mt-1 font-medium text-foreground">{customerName || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">WhatsApp</p>
            <p className="mt-1 font-mono text-xs">
              {customerWhatsapp ? (
                <a
                  href={`https://wa.me/${customerWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-success-700 hover:underline"
                >
                  {customerWhatsapp}
                </a>
              ) : (
                <span className="text-muted">Not provided</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Email</p>
            <p className="mt-1 font-mono text-xs">
              {customerEmail ? (
                <a href={`mailto:${customerEmail}`} className="text-zuma-600 hover:underline">
                  {customerEmail}
                </a>
              ) : (
                <span className="text-muted">Not provided</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-semibold text-foreground">
            Gift card codes (customer facing)
          </label>
          <div className="relative mt-2">
            <textarea
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              className="w-full min-h-[130px] rounded-xl border border-borderc bg-muted/5 px-4 py-3 text-sm font-mono text-foreground outline-none transition focus:border-zuma-500 focus:ring-2 focus:ring-ring"
              placeholder="Netflix: 1234-5678-9012\nSpotify: ABCD-EFGH-IJKL"
            />
            <span className="absolute right-3 top-3 rounded-md bg-success-50 px-2 py-1 text-[10px] font-semibold uppercase text-success-700">
              Visible to client
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Enter the codes exactly as you want the customer to receive them.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleSendWhatsApp}
            disabled={busy || !codes.trim() || !customerWhatsapp}
            className="flex items-center justify-center gap-2 rounded-xl bg-success-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-success-700 disabled:opacity-50"
          >
            {activeAction === "whatsapp" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            Send via WhatsApp
          </button>

          <button
            onClick={handleSendEmail}
            disabled={busy || !codes.trim() || !customerEmail}
            className="flex items-center justify-center gap-2 rounded-xl bg-zuma-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zuma-600 disabled:opacity-50"
          >
            {activeAction === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send via Email
          </button>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground">Internal admin notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full min-h-[100px] rounded-xl border border-borderc bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-zuma-500 focus:ring-2 focus:ring-ring"
            placeholder="Notes visible only to admins..."
          />
          <p className="mt-2 text-xs text-muted">
            Only visible to admins. Delivery timestamps are added when you send codes.
          </p>
        </div>

        <div className="flex justify-end border-t border-borderc pt-4">
          <button
            onClick={handleSave}
            disabled={busy || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl bg-zuma-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zuma-700 disabled:opacity-50"
          >
            {activeAction === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {activeAction === "save" ? t("common.processing") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  )
}
