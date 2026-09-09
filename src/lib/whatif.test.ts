import { describe, expect, it } from 'vitest'
import { DEMO_PROFILE } from '../state/store'
import { runStrategyEngine } from '../mock/engine'
import { applyLever, runWhatIf } from './whatif'

const context = { authority: 'UPTAC' as const, year: 2024, round: 1 }

describe('scenario planning', () => {
  it('changes a cloned profile without mutating the current plan', () => {
    const current = {
      ...DEMO_PROFILE,
      budget: { ...DEMO_PROFILE.budget },
      branchPriority: [...DEMO_PROFILE.branchPriority],
    }
    const next = applyLever(current, 'rank', 12_000)

    expect(next).not.toBe(current)
    expect(next.rank).toBe(12_000)
    expect(current.rank).toBe(12_500)
    expect(next.branchPriority).not.toBe(current.branchPriority)
  })

  it('clamps a tested rank to the accepted domain', () => {
    expect(applyLever(DEMO_PROFILE, 'rank', -50).rank).toBe(1)
    expect(applyLever(DEMO_PROFILE, 'rank', 4_000_000).rank).toBe(2_000_000)
  })

  it('reports reach-band changes even when the option remains in the list', () => {
    const before = runStrategyEngine(DEMO_PROFILE, context)
    const result = runWhatIf(DEMO_PROFILE, before, 'rank', 13_000, context)
    const changed = result.retiered.find(
      ({ item }) => item.option.id === 'iet-lucknow-it',
    )

    expect(changed).toMatchObject({ from: 'TARGET', to: 'DREAM' })
    expect(result.entered).toHaveLength(0)
    expect(result.dropped).toHaveLength(0)
    expect(DEMO_PROFILE.rank).toBe(12_500)
  })
})
