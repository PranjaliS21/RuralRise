import { ReactNode } from 'react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-brand-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-stone-500">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 animate-pulse" aria-hidden="true">
      <div className="h-3 w-24 bg-stone-200 rounded mb-3" />
      <div className="h-5 w-3/4 bg-stone-200 rounded mb-2" />
      <div className="h-3 w-full bg-stone-100 rounded mb-1" />
      <div className="h-3 w-5/6 bg-stone-100 rounded mb-4" />
      <div className="h-8 w-28 bg-stone-200 rounded" />
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      {icon && <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">{icon}</div>}
      <h3 className="font-semibold text-stone-800 mb-1">{title}</h3>
      {body && <p className="text-sm text-stone-500 max-w-md mx-auto mb-4">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl" aria-hidden="true">!</div>
      <h3 className="font-semibold text-stone-800 mb-1">Something went wrong</h3>
      <p className="text-sm text-stone-500 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-brand-600 hover:text-brand-700 underline">
          Try again
        </button>
      )}
    </div>
  );
}
