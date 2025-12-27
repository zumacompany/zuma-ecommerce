export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zuma-50 to-white p-6 print:bg-white">
      <div className="max-w-2xl w-full text-center p-10 bg-card border border-borderc rounded-xl shadow print:bg-white print:border-0 print:shadow-none print:p-4">
        {/* Screen view (hidden in print) */}
        <div className="print:hidden">
          <div className="mx-auto w-28 h-28">
            <svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="penguin guard">
              <defs>
                <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              {/* penguin body */}
              <ellipse cx="32" cy="36" rx="18" ry="20" fill="#111827" />
              <ellipse cx="32" cy="36" rx="12" ry="16" fill="#fff" />
              {/* head */}
              <circle cx="32" cy="18" r="12" fill="#111827" />
              <circle cx="28" cy="16" r="2" fill="#fff" />
              <circle cx="36" cy="16" r="2" fill="#fff" />
              {/* beak */}
              <path d="M30 20 q2 4 4 0" fill="#f59e0b" />
              {/* accessory: cookie */}
              <circle cx="48" cy="46" r="5" fill="url(#g1)" />
              <circle cx="46" cy="44" r="1" fill="#fff" opacity="0.7" />
            </svg>
          </div>

          <h1 className="mt-4 text-3xl font-bold">401 — Unauthorized</h1>
          <p className="mt-3 text-sm text-muted">Whoa there! This area requires a secret handshake (or a session cookie).</p>
          <p className="mt-4 text-sm">If you were trying to sneak in, the security guard is a penguin and he takes snacks only. 🍪🐧</p>

          <div className="mt-6 flex justify-center gap-3">
            <a href="/" className="px-4 py-2 rounded bg-zuma-500 text-white">Take me home</a>
            <a href="/admin" className="px-4 py-2 rounded border border-borderc">Admin login</a>
          </div>

          <p className="mt-6 text-xs text-muted">If this looks wrong, please <strong>poke</strong> the developer—gently.</p>
        </div>

        {/* Print-friendly view (visible only when printing) */}
        <div className="hidden print:block text-left">
          <h1 className="text-xl font-semibold">401 — Unauthorized</h1>
          <p className="mt-2">This page requires authentication. If you require access, please contact the site administrator.</p>
          <p className="mt-3">Suggested contact: <strong>admin@yourdomain.com</strong></p>
          <p className="mt-3 text-xs text-muted">Note: This print-friendly page omits graphics and interactive elements.</p>
        </div>
      </div>
    </div>
  )
}
