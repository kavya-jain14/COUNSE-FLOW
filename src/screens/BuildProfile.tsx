import { useMemo, useState } from 'react'
import type { Category, Domicile, RankType, SubQuota } from '../types'
import { CATEGORIES, SUB_QUOTAS } from '../data/reference'
import { AUTHORITY_LIST, AUTHORITIES } from '../data/authorities'
import { HOME_CITIES } from '../data/geo'
import { formatINR, formatKm } from '../lib/format'
import {
  MAX_BUDGET,
  MAX_DISTANCE,
  MIN_BUDGET,
  MIN_DISTANCE,
  validateProfile,
} from '../lib/validation'
import { useAppActions, useAppState } from '../state/store'
import { BranchPriority } from '../components/BranchPriority'
import { ConstraintControl } from '../components/ConstraintControl'
import { ExclusionPicker } from '../components/ExclusionPicker'
import { FactorWeightSliders } from '../components/FactorWeights'
import { Band, Banner, Field, HardSoftBadge, NextStep, PageHead } from '../components/ui'
import { SelectMenu } from '../components/SelectMenu'

const RANK_TYPES: Array<{ value: RankType; label: string }> = [
  { value: 'CRL', label: 'Common rank' },
  { value: 'CATEGORY', label: 'Category rank' },
]

export function BuildProfile() {
  const { profile, authorityId } = useAppState()
  const { patchProfile, goTo, loadDemoProfile, setAuthority } = useAppActions()
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => validateProfile(profile), [profile])
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined)
  const errorCount = Object.keys(errors).length
  const authority = AUTHORITIES[authorityId]
  const availableCategories = CATEGORIES.filter((category) =>
    authority.categories.includes(category.value),
  )
  const availableQuotas = SUB_QUOTAS.filter((quota) =>
    authority.subQuotas.includes(quota.value),
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (errorCount === 0) {
      goTo('summary')
      return
    }

    const form = e.currentTarget
    window.setTimeout(() => {
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]')
      firstInvalid?.scrollIntoView({ block: 'center' })
      firstInvalid?.focus({ preventScroll: true })
    }, 0)
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHead
        step={1}
        total={5}
        kicker="Build my profile"
        title="Start with the facts that shape your list"
        lede="Enter your counselling details first, then decide what is non-negotiable and what is only a preference. You can review everything before the list is generated."
        actions={
          <button type="button" className="btn btn--sm" onClick={loadDemoProfile}>
            Use sample candidate
          </button>
        }
      />

      {submitted && errorCount > 0 && (
        <div style={{ marginBottom: 30 }}>
          <Banner
            tone="critical"
            title={`${errorCount} thing${errorCount > 1 ? 's' : ''} still to fill in`}
            live
          >
            <span>Fix the highlighted fields below, then continue to your summary.</span>
          </Banner>
        </div>
      )}

      <Band
        num="01 · Required"
        title="Your rank"
        note="Use the exact rank and seat category shown for the counselling you are filling."
      >
        <div className="grid-2 profile-core-grid">
          <Field
            label="Rank"
            hint={`${authority.label} supports ${authority.rankTypes.join(' and ')} ranks. Switching counselling starts a separate rank and region selection.`}
            error={show('rank')}
            htmlFor="rank"
          >
            <input
              id="rank"
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 12500"
              value={profile.rank ?? ''}
              aria-invalid={Boolean(show('rank'))}
              onChange={(e) =>
                patchProfile({ rank: e.target.value === '' ? null : Number(e.target.value) })
              }
            />
          </Field>

          <Field label="Which rank is this?" htmlFor="rank-type-group">
            <div
              className="segmented"
              role="radiogroup"
              aria-label="Rank type"
              id="rank-type-group"
            >
              {RANK_TYPES.map((rt) => (
                <label className="segmented__opt" key={rt.value}>
                  <input
                    type="radio"
                    name="rankType"
                    checked={profile.rankType === rt.value}
                    onChange={() => patchProfile({ rankType: rt.value })}
                  />
                  <span>{rt.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Counselling" htmlFor="authority">
            <SelectMenu
              id="authority"
              value={authorityId}
              options={AUTHORITY_LIST.map((entry) => ({
                value: entry.id,
                label: `${entry.label}: ${entry.fullName}`,
              }))}
              onChange={(next) => setAuthority(next as typeof authorityId)}
            />
            <span className="field__hint">
              {AUTHORITIES[authorityId].datasetLoaded
                ? `${AUTHORITIES[authorityId].rounds} rounds supported. Choose the counselling you are filling right now.`
                : AUTHORITIES[authorityId].datasetNote}
            </span>
          </Field>

          <Field label="Category" error={show('category')} htmlFor="category">
            <SelectMenu
              id="category"
              value={profile.category ?? ''}
              invalid={Boolean(show('category'))}
              options={[
                { value: '', label: 'Select your category…' },
                ...availableCategories.map((entry) => ({
                  value: entry.value,
                  label: entry.label,
                })),
              ]}
              onChange={(next) =>
                patchProfile({ category: next ? (next as Category) : null })
              }
            />
          </Field>

          <Field label={authority.region.label} error={show('domicile')} htmlFor="domicile">
            <SelectMenu
              id="domicile"
              value={profile.domicile ?? ''}
              invalid={Boolean(show('domicile'))}
              options={[
                { value: '', label: `Select ${authority.region.label.toLowerCase()}…` },
                { value: 'UP', label: authority.region.home },
                { value: 'OTHER', label: authority.region.other },
              ]}
              onChange={(next) =>
                patchProfile({ domicile: next ? (next as Domicile) : null })
              }
            />
            <span className="field__hint">{authority.region.hint}</span>
          </Field>
        </div>

        <fieldset className="quota-set">
          <legend className="field__label">Reservation quotas you can claim</legend>
          <span className="field__hint">
            Optional. Select only the quotas you can prove with a valid certificate; otherwise
            leave this blank.
          </span>
          <div className="quota-grid">
            {availableQuotas.map((quota) => {
              const checked = profile.subQuotas.includes(quota.value)
              return (
                <label className="quota-opt" key={quota.value} data-checked={checked}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      patchProfile({
                        subQuotas: e.target.checked
                          ? [...profile.subQuotas, quota.value]
                          : profile.subQuotas.filter((q: SubQuota) => q !== quota.value),
                      })
                    }
                  />
                  <span className="quota-opt__text">
                    <b>{quota.label}</b>
                    <small>{quota.hint}</small>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </Band>

      <Band
        num="02 · Required"
        title="What you want"
        note="Branch order is a preference, not a filter: a lower-ranked branch can still appear, it just has to earn its place."
      >
        <BranchPriority
          value={profile.branchPriority}
          error={show('branchPriority')}
          onChange={(branchPriority) => patchProfile({ branchPriority })}
        />
      </Band>

      <Band
        num="03 · You can adjust"
        title="Your limits"
        note="You decide whether each of these blocks an option outright, or only ranks it lower."
      >
        <div className="band__head">
          <span className="section-label">Hard limits can remove options</span>
          <HardSoftBadge mode="hard" />
        </div>

        <ConstraintControl
          label="Annual budget"
          hint="Maximum tuition fee per year you can actually pay."
          setting={profile.budget}
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={5000}
          format={formatINR}
          error={show('budget')}
          hardBehaviour="Any option above this is removed before ranking. If you later relax this limit, the regenerated list makes that change explicit."
          softBehaviour="Options above this stay on your list but rank lower, and we explain the cost in the reason."
          onChange={(budget) => patchProfile({ budget })}
        />

        <Field
          label="Home city"
          hint="We use this city to estimate how far each college is from home."
          error={show('homeCity')}
          htmlFor="homeCity"
        >
          <SelectMenu
            id="homeCity"
            value={profile.homeCity ?? ''}
            invalid={Boolean(show('homeCity'))}
            options={[
              { value: '', label: 'Select your home city…' },
              ...HOME_CITIES.map((city) => ({ value: city, label: city })),
            ]}
            onChange={(next) => patchProfile({ homeCity: next || null })}
          />
        </Field>

        <ConstraintControl
          label="Distance from home"
          hint="Furthest you are willing to travel from your home city."
          setting={profile.distance}
          min={MIN_DISTANCE}
          max={MAX_DISTANCE}
          step={10}
          format={formatKm}
          error={show('distance')}
          hardBehaviour="Anything further than this is removed before ranking. Unknown distances stay visible as an evidence gap rather than being guessed."
          softBehaviour="Further colleges stay on your list but rank lower if you weighted location."
          onChange={(distance) => patchProfile({ distance })}
        />

        <ExclusionPicker
          value={profile.hardExclusions}
          error={show('hardExclusions')}
          onChange={(hardExclusions) => patchProfile({ hardExclusions })}
        />
      </Band>

      <Band
        num="04 · You can adjust"
        title="Your preferences"
        note="Soft only. These decide which of two acceptable options sits higher: they never remove anything."
      >
        <div className="band__head">
          <span className="section-label">These only change the order</span>
          <HardSoftBadge mode="soft" />
        </div>
        <FactorWeightSliders
          weights={profile.factorWeights}
          error={show('factorWeights')}
          onChange={(factorWeights) => patchProfile({ factorWeights })}
        />
      </Band>

      {submitted && errorCount > 0 ? (
        <NextStep
          tone="blocked"
          what={`Fill in ${errorCount} more field${errorCount > 1 ? 's' : ''}`}
          why="We will not guess a missing input: a wrong rank or category changes every position on your list."
        >
          <button type="submit" className="btn btn--primary">
            Check again
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="go"
          what="Review your profile"
          why="Next you get a plain summary of what will block an option and what will only rank it lower. Nothing runs until you approve it."
        >
          <button type="button" className="btn" onClick={() => goTo('landing')}>
            Back
          </button>
          <button type="submit" className="btn btn--primary">
            Review my profile
          </button>
        </NextStep>
      )}
    </form>
  )
}
