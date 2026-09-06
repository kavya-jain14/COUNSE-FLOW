import { useEffect, useMemo, useRef } from 'react'
import type { Step } from './types'
import { AppProvider, useAppActions, useAppState } from './state/store'
import { FLOW } from './state/flow'
import { Banner, LiveRegion } from './components/ui'
import { Landing } from './screens/Landing'
import { BuildProfile } from './screens/BuildProfile'
import { ProfileSummary } from './screens/ProfileSummary'
import { Strategy } from './screens/Strategy'
import { ConflictInspector } from './screens/ConflictInspector'
import { Locked } from './screens/Locked'
import { isProfileValid } from './lib/validation'
import { ENGINE_VERSION } from './data/reference'

function Screen({ step }: { step: Step }) {
  switch (step) {
    case 'landing':
      return <Landing />
    case 'profile':
      return <BuildProfile />
    case 'summary':
      return <ProfileSummary />
    case 'strategy':
      return <Strategy />
    case 'conflicts':
      return <ConflictInspector />
    case 'locked':
      return <Locked />
  }
}

function Shell() {
  const state = useAppState()
  const { goTo, lock } = useAppActions()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    mainRef.current?.focus({ preventScroll: true })
  }, [state.step])

  const profileReady = isProfileValid(state.profile)
  const counts = state.audit?.counts ?? { CRITICAL: 0, WARNING: 0, INFO: 0 }

  const reachable = useMemo(() => {
    if (state.lock) return ['strategy', 'conflicts', 'locked'] satisfies Step[]
    const steps: Step[] = ['profile']
    if (profileReady) steps.push('summary')
    if (state.items.length > 0) steps.push('strategy')
    if (state.audit) steps.push('conflicts')
    return steps
  }, [state.profile, state.items, state.audit, state.lock])

  const meta: Record<Step, string> = {
    landing: '',
    profile: profileReady ? 'Rank, limits, priorities' : 'Start with rank and limits',
    summary: profileReady ? 'Check before generating' : 'Finish your profile first',
    strategy:
      state.items.length > 0
        ? `${state.items.length} options ranked`
        : 'Generate from your summary',
    conflicts: state.audit
      ? counts.CRITICAL > 0
        ? `${counts.CRITICAL} must be fixed`
        : state.auditStale
          ? 'Re-audit pending'
          : counts.WARNING > 0
            ? `${counts.WARNING} decision${counts.WARNING > 1 ? 's' : ''} pending`
            : 'Review complete'
      : 'Opens after the first audit',
    locked: state.lock
      ? 'Snapshot saved'
      : counts.CRITICAL + counts.WARNING > 0
        ? 'Resolve required decisions'
        : 'Ready after review',
  }

  const currentIndex = FLOW.findIndex((f) => f.step === state.step)
  const canLock =
    state.items.length > 0 && Boolean(state.audit?.canLock) && !state.auditStale && !state.lock
  const showLockAction =
    !state.lock && Boolean(state.audit) && (state.step === 'strategy' || state.step === 'conflicts')
  const status = state.lock
    ? 'FILED'
    : state.auditStale
      ? 'REVIEW DUE'
      : counts.CRITICAL + counts.WARNING > 0
        ? 'ACTION NEEDED'
        : state.audit
          ? 'AUDIT CLEAR'
          : profileReady
            ? 'PROFILE READY'
            : 'WORKING COPY'
  const activeLabel = FLOW.find((f) => f.step === state.step)?.label ?? 'Overview'

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="workspace-header">
        <div className="workspace-header__masthead">
          <button
            className="brand"
            onClick={() => goTo(state.lock ? 'locked' : 'landing')}
            aria-label={state.lock ? 'CounselFlow locked snapshot' : 'CounselFlow home'}
          >
            <span className="brand__mark" aria-hidden="true">
              <img src="/brand/counselflow-mark.svg" alt="" />
            </span>
            <span>
              CounselFlow
              <small>Choice strategy workspace</small>
            </span>
          </button>
          <div className="workspace-header__context">
            <span className="workspace-header__eyebrow mono">ADMISSIONS CYCLE 2026</span>
            <strong>UPTAC / JoSAA / IPU</strong>
            <small>One preference strategy, three counselling systems</small>
          </div>
          <div className="workspace-header__actions">
            {showLockAction && (
              <button
                type="button"
                className="btn btn--sm"
                disabled={!canLock || state.busy === 'lock'}
                onClick={lock}
              >
                {canLock ? 'Lock strategy' : 'Resolve before locking'}
              </button>
            )}
            <span className="workspace-status mono" aria-label="Current strategy status">
              <span aria-hidden="true" />
              {status}
            </span>
          </div>
        </div>

        <div className="workflow-ledger">
          <div className="workflow-ledger__intro">
            <span className="mono">YOUR ROUTE</span>
            <small>{state.step === 'landing' ? 'Start with your candidate profile' : activeLabel}</small>
          </div>
          <nav className="workflow-nav" aria-label="Counselling flow">
            {FLOW.map((entry, i) => {
              const isCurrent = entry.step === state.step
              const isDone = currentIndex >= 0 && i < currentIndex
              const enabled = reachable.includes(entry.step)
              return (
                <button
                  key={entry.step}
                  type="button"
                  className="workflow-step"
                  data-state={isDone ? 'done' : isCurrent ? 'current' : 'todo'}
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={!enabled && !isCurrent}
                  onClick={() => goTo(entry.step)}
                >
                  <span className="workflow-step__number mono" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="workflow-step__copy">
                    <strong>{entry.short}</strong>
                    <small>{meta[entry.step]}</small>
                  </span>
                  <span className="workflow-step__state mono" aria-hidden="true">
                    {isCurrent ? 'NOW' : isDone ? 'DONE' : enabled ? 'READY' : 'LATER'}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="shell__body">
        <header className="topbar">
          <div className="topbar__document">
            <span className="topbar__section mono">ADMISSIONS STRATEGY FILE</span>
            <nav className="crumb" aria-label="Breadcrumb">
              <span>CounselFlow</span>
              <span aria-hidden="true">/</span>
              <strong>{activeLabel}</strong>
            </nav>
          </div>
          <div className="topbar__method">
            <span>Deterministic ordering</span>
            <strong className="mono">{ENGINE_VERSION}</strong>
          </div>
        </header>

        <main className="main" id="main" tabIndex={-1} ref={mainRef}>
          {state.error && (
            <Banner tone="critical" title="The last operation was rejected" live>
              <span>
                {state.error.error.message}
                {state.error.requestId ? ` Request: ${state.error.requestId}.` : ''}
              </span>
            </Banner>
          )}
          <Screen step={state.step} />
        </main>
      </div>

      <LiveRegion message={state.announcement} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
