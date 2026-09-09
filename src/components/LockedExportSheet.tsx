import type { CounsellingAuthority } from '../data/authorities'
import type { CandidateProfile, LockState, StrategyItem } from '../types'
import { formatINRExact, formatKm, formatRank } from '../lib/format'

export function LockedExportSheet({
  authority,
  round,
  profile,
  items,
  lock,
}: {
  authority: CounsellingAuthority
  round: number
  profile: CandidateProfile
  items: StrategyItem[]
  lock: LockState
}) {
  return (
    <section className="print-sheet" aria-hidden="true">
      <header>
        <span>COUNSELFLOW · LOCKED PREFERENCE REGISTER</span>
        <h1>{authority.label}</h1>
        <p>
          Round {round} · Rank {profile.rank == null ? 'not entered' : formatRank(profile.rank)} ·{' '}
          {items.length} choices
        </p>
      </header>
      <dl>
        <div><dt>Locked</dt><dd>{new Date(lock.lockedAt).toLocaleString('en-IN')}</dd></div>
        <div><dt>Record</dt><dd>{lock.snapshotId}</dd></div>
        <div><dt>Dataset</dt><dd>{lock.datasetVersion}</dd></div>
        <div><dt>Engine</dt><dd>{lock.engineVersion}</dd></div>
      </dl>
      <table>
        <thead>
          <tr><th>Order</th><th>College and branch</th><th>Reach</th><th>Evidence</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.itemId}>
              <td>{String(item.position).padStart(2, '0')}</td>
              <td>
                <b>{item.option.collegeShort} · {item.option.branch}</b>
                <small>
                  {item.option.city} ·{' '}
                  {item.option.annualFee == null ? 'fee not on record' : `${formatINRExact(item.option.annualFee)}/yr`} ·{' '}
                  {item.option.distanceKm == null ? 'distance unknown' : formatKm(item.option.distanceKm)}
                </small>
              </td>
              <td>{item.tier}</td>
              <td>{item.option.sourceYear}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        Fill choices in this exact order. Closing ranks guide planning and do not guarantee admission.
      </footer>
    </section>
  )
}
