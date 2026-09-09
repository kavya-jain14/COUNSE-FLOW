import type { CollegeOption } from '../types'
import type { AuthorityId } from './authorities'
import rawOptions from './generated/options.json'
import rawCutoffs from './generated/cutoffs.json'

interface GeneratedOption extends CollegeOption {
  authority: AuthorityId
}

interface GeneratedCutoff {
  a: string
  y: number
  r: number
  o: string
  p: string
  c: number
}

export interface ClosingRankHistoryPoint {
  year: number
  round: number | null
  closingRank: number
}

const ALL_OPTIONS = rawOptions as GeneratedOption[]
const ALL_CUTOFFS = rawCutoffs as GeneratedCutoff[]

export const GENERATED_OPTIONS_BY_AUTHORITY: Partial<Record<AuthorityId, CollegeOption[]>> = {}
for (const option of ALL_OPTIONS) {
  const list = (GENERATED_OPTIONS_BY_AUTHORITY[option.authority] ??= [])
  const { authority: _authority, ...rest } = option
  void _authority
  list.push(rest)
}

const GENERATED_INDEX = new Map<string, number>()
for (const cutoff of ALL_CUTOFFS) {
  GENERATED_INDEX.set(`${cutoff.a}|${cutoff.y}|${cutoff.r}|${cutoff.o}|${cutoff.p}`, cutoff.c)
}

export function generatedClosingRank(
  authority: AuthorityId,
  year: number,
  round: number,
  optionId: string,
  seatPool: string,
): number | null {
  return GENERATED_INDEX.get(`${authority}|${year}|${round}|${optionId}|${seatPool}`) ?? null
}

/**
 * Returns one comparable closing rank per available cycle, using the latest
 * imported round and the candidate's first matching seat pool in each year.
 * No point is synthesized when a cycle or pool is absent.
 */
export function generatedClosingRankHistory(
  authority: AuthorityId,
  optionId: string,
  seatPools: string[],
): ClosingRankHistoryPoint[] {
  const optionRows = ALL_CUTOFFS.filter(
    (cutoff) => cutoff.a === authority && cutoff.o === optionId,
  )
  const comparablePool = seatPools.find((pool) =>
    optionRows.some((cutoff) => cutoff.p === pool),
  )
  if (!comparablePool) return []

  const years = [...new Set(
    optionRows
      .filter((cutoff) => cutoff.p === comparablePool)
      .map((cutoff) => cutoff.y),
  )].sort((left, right) => left - right)

  return years.flatMap((year) => {
    const latest = optionRows
      .filter((cutoff) => cutoff.y === year && cutoff.p === comparablePool)
      .sort((left, right) => right.r - left.r)[0]
    return latest ? [{ year, round: latest.r, closingRank: latest.c }] : []
  })
}

export const GENERATED_SETS = [...new Set(ALL_CUTOFFS.map((c) => `${c.a}|${c.y}|${c.r}`))].map(
  (key) => {
    const [authority, year, round] = key.split('|')
    return { authority: authority as AuthorityId, year: Number(year), round: Number(round) }
  },
)

export function latestSetFor(authority: AuthorityId): { year: number; round: number } | null {
  const sets = GENERATED_SETS.filter((s) => s.authority === authority)
  if (sets.length === 0) return null
  return sets.sort((a, b) => b.year - a.year || b.round - a.round)[0]
}
