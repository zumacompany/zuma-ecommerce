import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

type CustomerAuthShellProps = {
  children: ReactNode;
  header: ReactNode;
};

export default function CustomerAuthShell({
  children,
  header,
}: CustomerAuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-end gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle compact />
        </div>

        <div className="rounded-3xl border border-borderc bg-card p-8 shadow-lg">
          {header}
          {children}
        </div>
      </div>
    </div>
  );
}
