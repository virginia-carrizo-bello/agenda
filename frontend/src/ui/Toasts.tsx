import { useUI } from './uiStore'

export function Toasts() {
  const toasts = useUI(s => s.toasts)
  const dismiss = useUI(s => s.dismissToast)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span>{t.text}</span>
          {t.onAction && (
            <button type="button" onClick={() => { t.onAction?.(); dismiss(t.id) }}>{t.actionLabel ?? 'Deshacer'}</button>
          )}
        </div>
      ))}
    </div>
  )
}
