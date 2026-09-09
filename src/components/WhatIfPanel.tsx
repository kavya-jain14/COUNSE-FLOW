import { useMemo, useState } from 'react'
import type { CandidateProfile, StrategyItem } from '../types'
import type { EngineContext } from '../mock/engine'
import { BRANCHES, BRANCH_LABELS } from '../data/reference'
import {
  MAX_BUDGET,
  MAX_DISTANCE,
  MAX_RANK,
  MIN_BUDGET,
  MIN_DISTANCE,
} from '../lib/validation'
import { formatINR, formatKm, formatRank } from '../lib/format'
import { applyLever, describeLever, runWhatIf, type LeverId } from '../lib/whatif'
import { Dialog, RangeInput, TierBadge } from './ui'
import { SelectMenu } from './SelectMenu'

const LEVERS: Array<{ id: LeverId; label: string; blurb: string }> = [
  { id: 'rank', label: 'Rank', blurb: 'Test a better or worse result' },
  { id: 'distance', label: 'Distance', blurb: 'Change how far you would go' },
  { id: 'budget', label: 'Budget', blurb: 'Change your annual ceiling' },
  { id: 'placements', label: 'Placements', blurb: 'Change its importance' },
  { id: 'branchTop', label: 'Top branch', blurb: 'Test another first choice' },
  { id: 'budgetMode', label: 'Budget rule', blurb: 'Strict limit or preference' },
  { id: 'distanceMode', label: 'Distance rule', blurb: 'Strict limit or preference' },
]

function initialValue(profile: CandidateProfile, lever: LeverId): number | string {
  switch (lever) {
    case 'rank':
      return profile.rank ?? 1
    case 'distance':
      return profile.distance.value
    case 'budget':
      return profile.budget.value
    case 'placements':
      return profile.factorWeights.placements
    case 'branchTop':
      return profile.branchPriority[0] ?? 'CSE'
    case 'budgetMode':
      return profile.budget.mode
    case 'distanceMode':
      return profile.distance.mode
  }
}

function rowLabel(item: StrategyItem): string {
  return `${item.option.collegeShort} · ${item.option.branch}`
}

function clampRank(rank: number): number {
  return Math.max(1, Math.min(MAX_RANK, Math.round(rank)))
}

export function WhatIfPanel({
  profile,
  items,
  context,
  onClose,
  onApply,
}: {
  profile: CandidateProfile
  items: StrategyItem[]
  context: EngineContext
  onClose: () => void
  onApply?: (next: CandidateProfile) => void
}) {
  const baselineRank = profile.rank ?? 1
  const [lever, setLever] = useState<LeverId>('rank')
  const [value, setValue] = useState<number | string>(() => clampRank(baselineRank - 500))

  const result = useMemo(
    () => runWhatIf(profile, items, lever, value, context),
    [profile, items, lever, value, context],
  )
  const change = describeLever(lever, profile, value)
  const touched = change.from !== change.to
  const delta = result.after.length - result.before.length
  const enteredIds = useMemo(
    () => new Set(result.entered.map((item) => item.option.id)),
    [result.entered],
  )
  const droppedIds = useMemo(
    () => new Set(result.dropped.map((item) => item.option.id)),
    [result.dropped],
  )
  const movedById = useMemo(
    () => new Map(result.moved.map((move) => [move.item.option.id, move])),
    [result.moved],
  )
  const retieredById = useMemo(
    () => new Map(result.retiered.map((move) => [move.item.option.id, move])),
    [result.retiered],
  )

  function pick(next: LeverId) {
    setLever(next)
    setValue(initialValue(profile, next))
  }

  function preview(nextLever: LeverId, nextValue: number | string) {
    setLever(nextLever)
    setValue(nextValue)
  }

  function changeLabel(item: StrategyItem, side: 'before' | 'after'): string | null {
    const optionId = item.option.id
    if (side === 'before' && droppedIds.has(optionId)) return 'Leaves list'
    if (side === 'after' && enteredIds.has(optionId)) return 'New option'
    const tier = retieredById.get(optionId)
    if (tier) return `${tier.from} to ${tier.to}`
    const move = movedById.get(optionId)
    if (move) return side === 'before' ? `Moves to #${move.to}` : `Was #${move.from}`
    return null
  }

  const quickScenarios = [
    {
      label: '500 better',
      detail: `${formatRank(clampRank(baselineRank - 500))} rank`,
      onClick: () => preview('rank', clampRank(baselineRank - 500)),
    },
    {
      label: '500 worse',
      detail: `${formatRank(clampRank(baselineRank + 500))} rank`,
      onClick: () => preview('rank', clampRank(baselineRank + 500)),
    },
    {
      label: profile.distance.mode === 'hard' ? 'Relax distance' : 'Make distance strict',
      detail: profile.distance.mode === 'hard' ? 'Treat it as a preference' : 'Use it as a hard limit',
      onClick: () => preview('distanceMode', profile.distance.mode === 'hard' ? 'soft' : 'hard'),
    },
    {
      label: profile.budget.mode === 'hard' ? 'Relax budget' : 'Make budget strict',
      detail: profile.budget.mode === 'hard' ? 'Treat it as a preference' : 'Use it as a hard limit',
      onClick: () => preview('budgetMode', profile.budget.mode === 'hard' ? 'soft' : 'hard'),
    },
  ]

  return (
    <Dialog
      title={onApply ? 'Scenario Lab: test a different plan' : 'Compare an alternate plan'}
      onClose={onClose}
      className="dialog--scenario"
    >
      <div className="scenario-intro">
        <span className="section-label">Safe preview</span>
        <p>
          {onApply
            ? 'Change one assumption and CounselFlow will rebuild the list beside your current plan. Nothing changes until you choose to use the scenario.'
            : 'This alternate is calculated beside your saved list. Your locked order stays unchanged.'}
        </p>
      </div>

      <section className="scenario-presets" aria-labelledby="scenario-presets-title">
        <span className="section-label" id="scenario-presets-title">Try a useful scenario</span>
        <div className="scenario-presets__grid">
          {quickScenarios.map((scenario) => (
            <button type="button" key={scenario.label} onClick={scenario.onClick}>
              <b>{scenario.label}</b>
              <small>{scenario.detail}</small>
            </button>
          ))}
        </div>
      </section>

      <details className="scenario-more">
        <summary>Test a different assumption</summary>
        <div className="whatif__levers" role="tablist" aria-label="Preference to test">
          {LEVERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={lever === item.id}
              className="whatif__lever"
              data-active={lever === item.id}
              onClick={() => pick(item.id)}
            >
              <b>{item.label}</b>
              <small>{item.blurb}</small>
            </button>
          ))}
        </div>
      </details>

      <div className="whatif__control">
        {lever === 'rank' && (
          <div className="field">
            <label className="field__label" htmlFor="scenario-rank">Rank to test</label>
            <span className="field__hint">A smaller number is a better rank. The alternate list updates as you type.</span>
            <input
              id="scenario-rank"
              className="input mono"
              type="number"
              min={1}
              max={MAX_RANK}
              step={100}
              value={Number(value)}
              onChange={(event) => setValue(clampRank(Number(event.target.value)))}
            />
            <div className="scenario-nudges" aria-label="Adjust tested rank">
              {[-1000, -500, 500, 1000].map((changeBy) => (
                <button
                  type="button"
                  key={changeBy}
                  onClick={() => setValue(clampRank(baselineRank + changeBy))}
                >
                  {Math.abs(changeBy).toLocaleString('en-IN')} {changeBy < 0 ? 'better' : 'worse'}
                </button>
              ))}
            </div>
          </div>
        )}
        {lever === 'distance' && (
          <label className="field">
            <span className="field__label">Distance limit: {formatKm(Number(value))}</span>
            <RangeInput min={MIN_DISTANCE} max={MAX_DISTANCE} step={10} value={Number(value)} onChange={setValue} />
          </label>
        )}
        {lever === 'budget' && (
          <label className="field">
            <span className="field__label">Annual budget: {formatINR(Number(value))}</span>
            <RangeInput min={MIN_BUDGET} max={MAX_BUDGET} step={5000} value={Number(value)} onChange={setValue} />
          </label>
        )}
        {lever === 'placements' && (
          <label className="field">
            <span className="field__label">Placement weight: {value} of 5</span>
            <RangeInput min={0} max={5} step={1} value={Number(value)} onChange={setValue} />
          </label>
        )}
        {lever === 'branchTop' && (
          <div className="field">
            <span className="field__label">Put this branch first</span>
            <SelectMenu
              value={String(value)}
              ariaLabel="Put this branch first"
              options={BRANCHES.map((branch) => ({ value: branch, label: `${branch}: ${BRANCH_LABELS[branch]}` }))}
              onChange={setValue}
            />
          </div>
        )}
        {(lever === 'budgetMode' || lever === 'distanceMode') && (
          <div className="segmented" role="radiogroup" aria-label="Treat as">
            {(['hard', 'soft'] as const).map((mode) => (
              <label className="segmented__opt" key={mode}>
                <input type="radio" name="whatif-mode" checked={value === mode} onChange={() => setValue(mode)} />
                <span>{mode === 'hard' ? 'Hard limit' : 'Soft preference'}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <section className="scenario-impact" aria-label="Scenario impact">
        <div><span>Options</span><b>{result.after.length}</b><small>{delta === 0 ? 'same total' : `${delta > 0 ? '+' : ''}${delta} from current`}</small></div>
        <div><span>Entered</span><b>{result.entered.length}</b><small>new choices</small></div>
        <div><span>Dropped</span><b>{result.dropped.length}</b><small>no longer qualify</small></div>
        <div><span>Reordered</span><b>{result.moved.length}</b><small>changed position</small></div>
        <div><span>Reach changed</span><b>{result.retiered.length}</b><small>Dream / Target / Safe</small></div>
      </section>

      <p className="whatif__explain" aria-live="polite">{result.explanation}</p>

      <div className="scenario-compare" aria-label="Current and alternate preference lists">
        {([
          { side: 'before' as const, label: onApply ? 'Current draft' : 'Saved list', rows: result.before },
          { side: 'after' as const, label: 'Alternate plan', rows: result.after },
        ]).map((column) => (
          <section className="scenario-compare__column" data-side={column.side} key={column.side}>
            <header>
              <span className="section-label">{column.label}</span>
              <b>{column.side === 'before' ? change.from : change.to}</b>
            </header>
            {column.rows.length > 0 ? (
              <ol>
                {column.rows.slice(0, 7).map((item) => {
                  const marker = changeLabel(item, column.side)
                  return (
                    <li key={item.option.id} data-changed={Boolean(marker)}>
                      <span className="mono">#{String(item.position).padStart(2, '0')}</span>
                      <span><b>{rowLabel(item)}</b>{marker && <small>{marker}</small>}</span>
                      <TierBadge tier={item.tier} />
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="scenario-compare__empty">No option survives this scenario.</p>
            )}
            {column.rows.length > 7 && <small className="scenario-compare__more">+{column.rows.length - 7} more choices</small>}
          </section>
        ))}
      </div>

      <div className="scenario-actions">
        <button type="button" className="btn" onClick={onClose}>
          {onApply ? 'Keep current plan' : 'Close comparison'}
        </button>
        {onApply && (
          <button
            type="button"
            className="btn btn--primary"
            disabled={!touched}
            onClick={() => onApply(applyLever(profile, lever, value))}
          >
            Use this scenario
          </button>
        )}
      </div>
    </Dialog>
  )
}
