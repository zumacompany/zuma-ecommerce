"use client";

import Link from "next/link";

type InfoSection = {
  title: string;
  body: string;
};

type InfoAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: ReadonlyArray<InfoSection>;
  actions?: ReadonlyArray<InfoAction>;
};

export default function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
  actions = [],
}: InfoPageProps) {
  return (
    <main className="py-12 md:py-16">
      <div className="container max-w-5xl px-4">
        <div className="rounded-[28px] border border-borderc bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-sm md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted md:text-lg">
            {intro}
          </p>

          {actions.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.tone === "secondary"
                      ? "inline-flex items-center justify-center rounded-xl border border-borderc px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/10"
                      : "inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-borderc bg-card p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted md:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
