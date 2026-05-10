// Shared admin UI primitives — light, minimal, hop-accent.
import { ReactNode } from 'react';

export function AdminHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 pb-4 border-b border-border">
      <div>
        <h1 className="font-display text-[26px] leading-tight" style={{ fontWeight: 900 }}>{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-[12px] p-5 ${className}`}>{children}</div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full px-3 py-2 text-[13px] bg-card border border-border rounded-[8px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary';

export const btnPrimary =
  'inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50';

export const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-muted-foreground border border-border rounded-full hover:bg-[hsl(var(--primary-light))] hover:text-primary';

export const btnDanger =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[hsl(var(--tertiary))] border border-border rounded-full hover:bg-[hsl(var(--tertiary-light))]';
