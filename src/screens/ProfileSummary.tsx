import { useMemo } from 'react'
import { BRANCH_LABELS, CATEGORIES, FACTORS, SUB_QUOTAS } from '../data/reference'
import { AUTHORITIES } from '../data/authorities'
import { formatINRExact, formatKm, formatRank } from '../lib/format'
import { validateProfile } from '../lib/validation'
import { useAppActions, useAppState } from '../state/store'
import { Band, Banner, HardSoftBadge, NextStep, PageHead } from '../components/ui'

const WEIGHT_WORDS = ['ignored', 'slight', 'some', 'matters', 'important', 'decisive']

export function ProfileSummary() {
  const { profile, busy, authorityId } = useAppState()
  const { goTo, generate } = useAppActions()

  const errors = useMemo(() => validateProfile(profile), [profile])
  const valid = Object.keys(errors).length === 0

  const authority = AUTHORITIES[authorityId]
  const categoryLabel = CATEGORIES.find((c) => c.value === profile.category)?.label ?? 'Not set'
  const domicileLabel =
    profile.domicile === 'UP'
      ? authority.region.home
      : profile.domicile === 'OTHER'
        ? authority.region.other
        : 'Not set'
  const quotaLabels = profile.subQuotas.map(
    (q) => SUB_QUOTAS.find((s) => s.value === q)?.label ?? q,
  )
  const hardCount =
    (profile.budget.mode === 'hard' ? 1 : 0) +
    (profile.distance.mode === 'hard' ? 1 : 0) +
    profile.hardExclusions.length

  return (
    <>
      <PageHead
        step={2}
        total={5}
        kicker="Profile summary"
        title="Review what will shape your list"
        lede={
          hardCount === 0
            ? 'You set no hard limits, so every matching option can be ranked.'
            : `${hardCount} hard limit${hardCount > 1 ? 's' : ''} can remove options. Everything else only changes their order.`
        }
        actions={
          <button type="button" className="btn btn--sm" onClick={() => goTo('profile')}>
            Edit profile
          </button>
        }
      />

      {!valid && (
        <div style={{ marginBottom: 30 }}>
          <Banner tone="critical" title="Your profile is incomplete" live>
            <span>Go back and fix the highlighted fields: we will not guess missing inputs.</span>
          </Banner>
        </div>
      )}

      <section className="review-brief" aria-labelledby="review-brief-title">
        <div className="review-brief__copy">
          <span className="section-label">Check these four things first</span>
          <h2 id="review-brief-title">
            {valid ? 'Ready to build your preference list' : 'Your profile still needs attention'}
          </h2>
          <p>
            These inputs have the biggest effect on what appears and where it appears. The full
            record remains below if you want to inspect every detail.
          </p>
        </div>
        <dl className="review-brief__facts">
          <div><dt>Rank pool</dt><dd className="mono">{profile.rank == null ? 'Not set' : formatRank(profile.rank)} · {categoryLabel} · {authority.label}</dd></div>
          <div><dt>Branch order</dt><dd>{profile.branchPriority.join(' › ') || 'Not set'}</dd></div>
          <div><dt>Budget</dt><dd className="mono">{formatINRExact(profile.budget.value)} · {profile.budget.mode}</dd></div>
          <div><dt>Distance</dt><dd className="mono">{formatKm(profile.distance.value)} · {profile.distance.mode}</dd></div>
        </dl>
        <div className="review-brief__actions">
          <button type="button" className="btn" onClick={() => goTo('profile')}>Edit inputs</button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!valid || busy === 'generate'}
            onClick={generate}
          >
            {busy === 'generate' ? 'Building your list…' : 'Generate strategy'}
          </button>
        </div>
      </section>

      <Band
        num="01"
        title="Candidate"
        note="Check your counselling, rank, category and region before continuing."
      >
        <dl className="summary-grid">
          <div className="summary-cell">
            <dt>Counselling</dt>
            <dd>
              {authority.label}
              <small>{authority.rounds} counselling rounds supported</small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Rank</dt>
            <dd>
              {profile.rank == null ? ' - ' : formatRank(profile.rank)}
              <small>{profile.rankType === 'CRL' ? 'Common rank' : 'Category rank'}</small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Category</dt>
            <dd>
              {categoryLabel}
              <small>Decides which closing ranks apply to you</small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>{authority.region.label}</dt>
            <dd>
              {domicileLabel}
              <small>{profile.domicile ? authority.region.hint : 'Needed before we can pick the right seat pool'}</small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Quotas claimed</dt>
            <dd>
              {quotaLabels.length === 0 ? 'None' : quotaLabels.length}
              <small>
                {quotaLabels.length === 0
                  ? 'Only the standard category and region pools apply'
                  : `${quotaLabels.join(' · ')}. A quota is applied only where the selected counselling data includes it.`}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Branch order</dt>
            <dd>
              {profile.branchPriority.join(' › ') || ' - '}
              <small>
                {profile.branchPriority[0]
                  ? `Top choice: ${BRANCH_LABELS[profile.branchPriority[0]]}`
                  : 'No branches ranked'}
              </small>
            </dd>
          </div>
        </dl>
      </Band>

      <Band
        num="02"
        title="Hard limits"
        note="Anything outside a hard limit is removed before your preference order is built."
      >
        <div className="band__head">
          <span className="section-label">Can block your list</span>
          <HardSoftBadge mode="hard" />
        </div>
        <dl className="summary-grid">
          <div className="summary-cell">
            <dt>Annual budget</dt>
            <dd>
              {formatINRExact(profile.budget.value)}
              <small>
                {profile.budget.mode === 'hard'
                  ? 'Hard ceiling: over-budget options are removed before ranking'
                  : 'Soft preference: over-budget options only rank lower'}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Distance limit</dt>
            <dd>
              {formatKm(profile.distance.value)}
              <small>
                {profile.distance.mode === 'hard'
                  ? 'Hard limit: further colleges are removed before ranking'
                  : 'Soft preference: further colleges only rank lower'}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Never accept</dt>
            <dd>
              {profile.hardExclusions.length === 0 ? (
                <>
                  Nothing excluded
                  <small>No option will be removed on these grounds</small>
                </>
              ) : (
                <>
                  {profile.hardExclusions.length} exclusion
                  {profile.hardExclusions.length > 1 ? 's' : ''}
                  <small>{profile.hardExclusions.map((e) => e.label).join(' · ')}</small>
                </>
              )}
            </dd>
          </div>
        </dl>
      </Band>

      <Band
        num="03"
        title="Soft preferences"
        note="No option is ever removed because of these. They decide which of two acceptable options sits higher."
      >
        <div className="band__head">
          <span className="section-label">Only changes the order</span>
          <HardSoftBadge mode="soft" />
        </div>
        <div className="chips">
          {FACTORS.map((f) => (
            <span className="chip" key={f.key}>
              {f.label}: <strong>{WEIGHT_WORDS[profile.factorWeights[f.key]]}</strong>
            </span>
          ))}
        </div>
      </Band>

      {valid ? (
        <NextStep
          tone="go"
          what="Generate my strategy"
          why="Next, you will see the ranked list and any tradeoffs that need your decision. You can still edit and check it again."
        >
          <button type="button" className="btn" onClick={() => goTo('profile')}>
            Edit profile
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy === 'generate'}
            onClick={generate}
          >
            {busy === 'generate' ? 'Building your list…' : 'Generate my strategy'}
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="blocked"
          what="Finish your profile first"
          why="Some required inputs are still empty, and a guessed rank or category would change every position on your list."
        >
          <button type="button" className="btn btn--primary" onClick={() => goTo('profile')}>
            Back to profile
          </button>
        </NextStep>
      )}
    </>
  )
}
