import type { ClosingRankHistoryPoint } from '../data/generated'
import { formatRank } from '../lib/format'

const WIDTH = 244
const HEIGHT = 68
const PAD_X = 10
const PAD_Y = 10

export function ClosingRankTrend({ points }: { points: ClosingRankHistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="rank-trend__unavailable">
        <span className="section-label">Closing-rank trend</span>
        {points.length === 1
          ? 'One comparable cycle is on record. A trend line needs at least two real years, so none is drawn.'
          : 'No comparable historical cycle is available, so no trend line is drawn.'}
      </p>
    )
  }

  const values = points.map((point) => point.closingRank)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const xFor = (index: number) =>
    PAD_X + (index * (WIDTH - PAD_X * 2)) / Math.max(1, points.length - 1)
  const yFor = (rank: number) =>
    range === 0
      ? HEIGHT / 2
      : PAD_Y + ((rank - min) / range) * (HEIGHT - PAD_Y * 2)
  const coordinates = points.map((point, index) => `${xFor(index)},${yFor(point.closingRank)}`).join(' ')
  const spoken = points
    .map((point) => `${point.year}${point.round == null ? '' : ` round ${point.round}`}: ${formatRank(point.closingRank)}`)
    .join('; ')

  return (
    <figure className="rank-trend">
      <figcaption>
        <span className="section-label">Closing-rank history</span>
        <span>Lower rank means the seat closed earlier and was more competitive.</span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={spoken}>
        <line x1={PAD_X} y1={HEIGHT - PAD_Y} x2={WIDTH - PAD_X} y2={HEIGHT - PAD_Y} />
        <polyline points={coordinates} />
        {points.map((point, index) => (
          <circle key={`${point.year}-${point.round}`} cx={xFor(index)} cy={yFor(point.closingRank)} r="4" />
        ))}
      </svg>
      <ol>
        {points.map((point) => (
          <li key={`${point.year}-${point.round}`}>
            <span>{point.year}{point.round == null ? '' : ` · R${point.round}`}</span>
            <b className="mono">{formatRank(point.closingRank)}</b>
          </li>
        ))}
      </ol>
      <p>Official cycle points only. No missing year is estimated.</p>
    </figure>
  )
}
