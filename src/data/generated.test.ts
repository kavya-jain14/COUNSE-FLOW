import { describe, expect, it } from 'vitest'
import { generatedClosingRankHistory } from './generated'

describe('closing-rank history integrity', () => {
  it('returns only imported JoSAA cycle points in chronological order', () => {
    expect(
      generatedClosingRankHistory(
        'JOSAA',
        'josaa-punjab-engineering-college-chandigarh-cse',
        ['JOSAA:EWS:OS'],
      ),
    ).toEqual([
      { year: 2024, round: 5, closingRank: 2514 },
      { year: 2025, round: 6, closingRank: 2549 },
    ])
  })

  it('does not invent a historical cycle when only one year exists', () => {
    expect(
      generatedClosingRankHistory(
        'IPU',
        'ipu-bhagwan-parshuram-institute-of-technology-p-s-p-4-sector-1-cse',
        ['IPU:GEN:HS'],
      ),
    ).toEqual([{ year: 2026, round: 3, closingRank: 406916 }])
  })

  it('does not substitute another seat pool when the requested pool is missing', () => {
    expect(
      generatedClosingRankHistory(
        'JOSAA',
        'josaa-punjab-engineering-college-chandigarh-cse',
        ['JOSAA:GEN:AI'],
      ),
    ).toEqual([])
  })
})
