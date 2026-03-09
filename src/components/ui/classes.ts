export const uiCardClass =
  "rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.06)]";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(13,148,136,0.16)] disabled:cursor-not-allowed disabled:opacity-50";

export const uiPrimaryButtonClass = `${buttonBase} border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_16px_35px_rgba(13,148,136,0.24)] hover:-translate-y-px hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]`;

export const uiSecondaryButtonClass = `${buttonBase} border-[var(--border-strong)] bg-white text-gray-900 shadow-[0_10px_24px_rgba(17,24,39,0.08)] hover:-translate-y-px hover:bg-[var(--surface-subtle)]`;

export const uiDangerButtonClass = `${buttonBase} border-[#b91c1c] bg-[#b91c1c] text-white shadow-[0_16px_35px_rgba(185,28,28,0.2)] hover:-translate-y-px hover:bg-[#991b1b]`;

export const uiInputClass =
  "w-full rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_24px_rgba(17,24,39,0.05)] outline-none transition-all placeholder:text-[var(--muted-soft)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,148,136,0.12)]";

export const uiTextareaClass = `${uiInputClass} min-h-[120px] resize-y`;

export const uiSelectClass = `${uiInputClass} appearance-none bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf9_100%)]`;

export const uiTabGroupClass =
  "inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]";

const tabBase =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all";

export const uiActiveTabClass = `${tabBase} bg-[var(--accent)] text-white shadow-[0_10px_24px_rgba(13,148,136,0.24)]`;

export const uiInactiveTabClass = `${tabBase} text-gray-700 hover:bg-white hover:text-gray-900`;

export const uiSectionTitleClass = "text-lg font-semibold tracking-[-0.02em] text-gray-900";
