import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { BranchCode } from '../types'
import { BRANCHES, BRANCH_LABELS } from '../data/reference'
import { Field } from './ui'
import { SelectMenu } from './SelectMenu'

export function BranchPriority({
  value,
  error,
  onChange,
}: {
  value: BranchCode[]
  error?: string
  onChange: (next: BranchCode[]) => void
}) {
  const [toAdd, setToAdd] = useState<BranchCode | ''>('')
  const [dragging, setDragging] = useState<BranchCode | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const valueRef = useRef(value)
  const cleanupRef = useRef<(() => void) | null>(null)
  valueRef.current = value
  const available = BRANCHES.filter((b) => !value.includes(b))

  useEffect(() => () => cleanupRef.current?.(), [])

  function moveBranch(branch: BranchCode, target: number, announce = true) {
    const current = valueRef.current
    const from = current.indexOf(branch)
    if (from < 0 || target < 0 || target >= current.length || target === from) return
    const next = [...current]
    next.splice(from, 1)
    next.splice(target, 0, branch)
    valueRef.current = next
    onChange(next)
    if (announce) setAnnouncement(`${branch} is now priority ${target + 1} of ${next.length}.`)
  }

  function startDrag(branch: BranchCode, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus()
    cleanupRef.current?.()
    setDragging(branch)
    document.body.dataset.reordering = 'true'

    function move(event: PointerEvent) {
      event.preventDefault()
      const row = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-branch-index]')
      if (!row) return
      moveBranch(branch, Number(row.dataset.branchIndex), false)
    }

    function teardown() {
      delete document.body.dataset.reordering
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', finish)
      document.removeEventListener('pointercancel', finish)
      cleanupRef.current = null
    }

    function finish() {
      const current = valueRef.current
      const position = current.indexOf(branch)
      teardown()
      setDragging(null)
      setAnnouncement(`${branch} is now priority ${position + 1} of ${current.length}.`)
    }

    cleanupRef.current = teardown
    document.addEventListener('pointermove', move, { passive: false })
    document.addEventListener('pointerup', finish)
    document.addEventListener('pointercancel', finish)
  }

  return (
    <Field
      label="Branch priority"
      hint="Drag a grip to reorder. Position 1 is what you want most. Keyboard users can focus a grip and use the arrow keys."
      error={error}
    >
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      {value.length === 0 ? (
        <p className="empty" style={{ padding: '16px 0' }}>
          No branches yet. Add at least one below.
        </p>
      ) : (
        <ol className="branch-list">
          {value.map((branch, i) => (
            <li
              className="branch-item"
              key={branch}
              data-top={i === 0}
              data-dragging={dragging === branch}
              data-branch-index={i}
            >
              <button
                type="button"
                className="branch-drag-handle"
                aria-label={`Reorder ${branch}, currently priority ${i + 1} of ${value.length}. Use arrow keys or drag.`}
                onPointerDown={(event) => startDrag(branch, event)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    moveBranch(branch, Math.max(0, i - 1))
                  } else if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    moveBranch(branch, Math.min(value.length - 1, i + 1))
                  } else if (event.key === 'Home') {
                    event.preventDefault()
                    moveBranch(branch, 0)
                  } else if (event.key === 'End') {
                    event.preventDefault()
                    moveBranch(branch, value.length - 1)
                  }
                }}
              >
                <span className="branch-grip" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, dot) => <i key={dot} />)}
                </span>
              </button>
              <span className="branch-rank" aria-hidden="true">
                {i + 1}
              </span>
              <span className="branch-name">
                <b>{branch}</b>
                <small>{BRANCH_LABELS[branch] ?? branch}</small>
              </span>
              <span className="branch-item__actions">
                <button
                  type="button"
                  className="branch-remove"
                  onClick={() => onChange(value.filter((b) => b !== branch))}
                  aria-label={`Remove ${branch} from your branch order`}
                >
                  Remove
                </button>
              </span>
              <span className="sr-only">
                {branch} is priority {i + 1} of {value.length}.
              </span>
            </li>
          ))}
        </ol>
      )}

      {available.length > 0 && (
        <div className="row branch-add-row" style={{ marginTop: 4 }}>
          <SelectMenu
            id="branch-add"
            value={toAdd}
            ariaLabel="Add a branch to your priority order"
            options={[
              { value: '', label: 'Add a branch…' },
              ...available.map((branch) => ({
                value: branch,
                label: `${branch}: ${BRANCH_LABELS[branch]}`,
              })),
            ]}
            onChange={(next) => setToAdd(next as BranchCode | '')}
          />
          <button
            type="button"
            className="btn btn--sm"
            disabled={!toAdd}
            onClick={() => {
              if (!toAdd) return
              onChange([...value, toAdd])
              setToAdd('')
            }}
          >
            Add to bottom
          </button>
        </div>
      )}
    </Field>
  )
}
