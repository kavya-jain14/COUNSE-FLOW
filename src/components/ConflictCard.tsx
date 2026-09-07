import { useState } from 'react'
import type { Conflict, ConflictAction, Resolution, StrategyItem } from '../types'
import { Dialog, SEVERITY_META } from './ui'

const MIN_REASON = 8

export function ConflictCard({
  conflict,
  resolution,
  items,
  disabled,
  priority = false,
  onApply,
}: {
  conflict: Conflict
  resolution?: Resolution
  items: StrategyItem[]
  disabled?: boolean
  priority?: boolean
  onApply: (conflict: Conflict, action: ConflictAction, reason?: string) => void
}) {
  const [pending, setPending] = useState<ConflictAction | null>(null)
  const [reason, setReason] = useState('')
  const [reasonTouched, setReasonTouched] = useState(false)
  const [reopened, setReopened] = useState(false)

  const meta = SEVERITY_META[conflict.severity]
  const resolved = Boolean(resolution) && !reopened
  const ordered = [...conflict.actions].sort((a, b) =>
    a.intent === b.intent ? 0 : a.intent === 'primary' ? -1 : 1,
  )
  const suggested = ordered[0]
  const affected = items
    .filter((item) => conflict.itemIds.includes(item.itemId))
    .sort((left, right) => left.position - right.position)
  const visibleAffected = affected.slice(0, 4)
  const remainingAffected = affected.length - visibleAffected.length
  const basis = conflict.causedBy.includes('·')
    ? conflict.causedBy.split('·').slice(1).join('·').trim()
    : conflict.causedBy

  const suggestedRows = (() => {
    if (!suggested?.target) return null
    if (suggested.kind === 'SWAP' && suggested.target.itemId && suggested.target.withItemId) {
      const first = affected.find((item) => item.itemId === suggested.target?.itemId)
      const second = affected.find((item) => item.itemId === suggested.target?.withItemId)
      if (!first || !second) return null
      return visibleAffected.map((item) => {
        if (item.itemId === first.itemId) return { ...item, option: second.option }
        if (item.itemId === second.itemId) return { ...item, option: first.option }
        return item
      })
    }
    if (
      (suggested.kind === 'REMOVE_OPTION' || suggested.kind === 'DEDUPE') &&
      suggested.target.itemId
    ) {
      return visibleAffected.filter((item) => item.itemId !== suggested.target?.itemId)
    }
    return null
  })()

  function start(action: ConflictAction) {
    if (action.kind === 'SWAP' || action.requiresReason) {
      setPending(action)
      setReason('')
      setReasonTouched(false)
      return
    }
    onApply(conflict, action)
  }

  function commit() {
    if (!pending) return
    if (pending.requiresReason && reason.trim().length < MIN_REASON) {
      setReasonTouched(true)
      return
    }
    onApply(conflict, pending, pending.requiresReason ? reason.trim() : undefined)
    setPending(null)
    setReopened(false)
  }

  const swapPreview =
    pending?.kind === 'SWAP'
      ? {
          upper: items.find((it) => it.itemId === pending.target?.itemId),
          lower: items.find((it) => it.itemId === pending.target?.withItemId),
        }
      : null

  const reasonInvalid = reasonTouched && reason.trim().length < MIN_REASON

  return (
    <article
      id={`conflict-${conflict.id}`}
      className="conflict"
      data-severity={conflict.severity}
      data-resolved={resolved}
      data-priority={priority}
      tabIndex={priority ? -1 : undefined}
      aria-label={`${meta.label} decision ${conflict.code}: ${conflict.title}`}
    >
      <header className="conflict__head">
        <div className="conflict__kicker">
          <span>{meta.label}</span>
          <span className="mono">{conflict.code}</span>
          <span className="mono">{meta.blocking}</span>
        </div>
        <h3 className="conflict__title">{conflict.title}</h3>
        <p className="conflict__summary">{conflict.summary}</p>
        <p className="conflict__caused">
          <span className="mono">Checked against</span>
          {basis}
        </p>
      </header>

      <section className="conflict-glance" aria-label={`Current and suggested result for ${conflict.title}`}>
        <div className="conflict-glance__side">
          <span className="section-label">Right now</span>
          {visibleAffected.length > 0 ? (
            <ol>
              {visibleAffected.map((item) => (
                <li key={item.itemId}>
                  <span className="mono">#{String(item.position).padStart(2, '0')}</span>
                  <b>{item.option.collegeShort} · {item.option.branch}</b>
                </li>
              ))}
              {remainingAffected > 0 && <li className="conflict-glance__more">+{remainingAffected} more affected</li>}
            </ol>
          ) : (
            <p>{conflict.summary}</p>
          )}
        </div>

        <div className="conflict-glance__side" data-result="true">
          <span className="section-label">Suggested result</span>
          {suggestedRows ? (
            <ol>
              {suggestedRows.map((item) => (
                <li key={`${item.position}-${item.option.id}`}>
                  <span className="mono">#{String(item.position).padStart(2, '0')}</span>
                  <b>{item.option.collegeShort} · {item.option.branch}</b>
                </li>
              ))}
              {remainingAffected > 0 && <li className="conflict-glance__more">+{remainingAffected} more stay visible</li>}
            </ol>
          ) : (
            <p><b>{suggested?.label}</b><span>{suggested?.effect}</span></p>
          )}
        </div>
      </section>

      <details className="conflict-evidence">
        <summary>
          Show the {conflict.evidence.length} fact{conflict.evidence.length > 1 ? 's' : ''} used
        </summary>
        <ul className="evidence">
          {conflict.evidence.map((line, index) => (
            <li key={index}><span>{line}</span></li>
          ))}
        </ul>
      </details>

      {resolved && resolution ? (
        <div className="resolved-note">
          <span>
            <strong>
              {resolution.kind === 'FIXED'
                ? 'Fixed'
                : resolution.kind === 'OVERRIDDEN'
                  ? 'Overridden'
                  : 'Acknowledged'}
            </strong>
            {`: ${resolution.actionLabel}`}
          </span>
          {resolution.reason && <q>{resolution.reason}</q>}
          <div>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setReopened(true)}
              disabled={disabled}
            >
              Change my decision
            </button>
          </div>
        </div>
      ) : (
        <div className="conflict__actions">
          <span className="section-label">
            Pick one: {conflict.actions.length} way
            {conflict.actions.length > 1 ? 's' : ''} to settle this
          </span>
          {ordered.map((action) => (
            <button
              type="button"
              className="choice"
              key={action.id}
              data-recommended={action.intent === 'primary'}
              onClick={() => start(action)}
              disabled={disabled}
            >
              <span className="choice__text">
                <span className="choice__label">
                  {action.label}
                  {action.intent === 'primary' && (
                    <span className="choice__tag">Suggested</span>
                  )}
                  {action.requiresReason && (
                    <span className="badge badge--neutral">Needs a reason</span>
                  )}
                </span>
                <span className="choice__effect">{action.effect}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {pending && (
        <Dialog
          title={
            pending.kind === 'SWAP' ? 'Preview this swap' : `${pending.label}: tell us why`
          }
          onClose={() => setPending(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={commit}>
                {pending.kind === 'SWAP' ? 'Apply swap' : `Confirm: ${pending.label}`}
              </button>
            </>
          }
        >

          <p className="card__hint">
            {swapPreview?.upper && swapPreview.lower
              ? `Moves ${swapPreview.lower.option.collegeShort} · ${swapPreview.lower.option.branch} to #${swapPreview.upper.position} and ${swapPreview.upper.option.collegeShort} · ${swapPreview.upper.option.branch} to #${swapPreview.lower.position}.`
              : pending.effect}
          </p>

          {swapPreview?.upper && swapPreview.lower && (
            <div className="preview-swap">
              <span className="section-label">Now</span>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.upper.position}</span>
                <span>
                  {swapPreview.upper.option.collegeShort} · {swapPreview.upper.option.branch}
                </span>
              </div>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.lower.position}</span>
                <span>
                  {swapPreview.lower.option.collegeShort} · {swapPreview.lower.option.branch}
                </span>
              </div>
              <span className="section-label">Reordered result</span>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.upper.position}</span>
                <span>
                  <strong>
                    {swapPreview.lower.option.collegeShort} · {swapPreview.lower.option.branch}
                  </strong>
                </span>
              </div>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.lower.position}</span>
                <span>
                  <strong>
                    {swapPreview.upper.option.collegeShort} · {swapPreview.upper.option.branch}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {pending.requiresReason && (
            <div className="field">
              <label className="field__label" htmlFor={`reason-${conflict.id}`}>
                Your reason
              </label>
              <span className="field__hint">
                This stays with your saved list so you can remember why you kept the tradeoff.
              </span>
              <textarea
                id={`reason-${conflict.id}`}
                className="textarea"
                value={reason}
                aria-invalid={reasonInvalid}
                placeholder="e.g. I would rather have this college than my preferred branch elsewhere."
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setReasonTouched(true)}
              />
              {reasonInvalid && (
                <span className="field__error" role="alert">
                  <span aria-hidden="true">Field</span>
                  Write at least {MIN_REASON} characters so this choice is clear later.
                </span>
              )}
            </div>
          )}
        </Dialog>
      )}
    </article>
  )
}
