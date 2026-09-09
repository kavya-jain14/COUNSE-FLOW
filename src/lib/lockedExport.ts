import type { CandidateProfile, LockState, StrategyItem } from '../types'
import { formatINRExact, formatKm, formatRank } from './format'

export interface LockedExportData {
  authorityLabel: string
  round: number
  profile: CandidateProfile
  items: StrategyItem[]
  lock: LockState
}

function fileName(data: LockedExportData): string {
  const authority = data.authorityLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `counselflow-${authority}-round-${data.round}.png`
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (context.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) {
    shortened = shortened.slice(0, -1)
  }
  return `${shortened}…`
}

export async function downloadLockedListPng(data: LockedExportData): Promise<void> {
  const width = 1400
  const rowHeight = 74
  const headerHeight = 294
  const footerHeight = 126
  const height = headerHeight + data.items.length * rowHeight + footerHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot create the image export.')

  const ink = '#172a38'
  const petrol = '#456a75'
  const rule = '#96a5a6'
  const paper = '#f4f1e9'
  const docket = '#dfe7e7'
  const margin = 82

  context.fillStyle = paper
  context.fillRect(0, 0, width, height)
  context.fillStyle = ink
  context.fillRect(0, 0, width, 18)

  context.fillStyle = petrol
  context.font = '600 20px "Azeret Mono", monospace'
  context.fillText('COUNSELFLOW · LOCKED PREFERENCE REGISTER', margin, 74)

  context.fillStyle = ink
  context.font = '700 54px Alegreya, Georgia, serif'
  context.fillText(data.authorityLabel, margin, 140)
  context.font = '500 26px "Alegreya Sans", Arial, sans-serif'
  context.fillText(
    `Round ${data.round} · Rank ${data.profile.rank == null ? 'not entered' : formatRank(data.profile.rank)} · ${data.items.length} choices`,
    margin,
    184,
  )
  context.fillStyle = petrol
  context.font = '500 18px "Azeret Mono", monospace'
  context.fillText(`LOCKED ${new Date(data.lock.lockedAt).toLocaleString('en-IN')}`, margin, 224)
  context.fillText(`RECORD ${data.lock.snapshotId}`, margin, 254)

  let y = headerHeight
  data.items.forEach((item, index) => {
    if (index % 2 === 0) {
      context.fillStyle = docket
      context.fillRect(margin - 14, y, width - margin * 2 + 28, rowHeight)
    }
    context.strokeStyle = rule
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(margin - 14, y + rowHeight)
    context.lineTo(width - margin + 14, y + rowHeight)
    context.stroke()

    context.fillStyle = ink
    context.font = '700 22px "Azeret Mono", monospace'
    context.fillText(String(item.position).padStart(2, '0'), margin, y + 32)
    context.font = '700 24px "Alegreya Sans", Arial, sans-serif'
    context.fillText(
      fitText(context, `${item.option.collegeShort} · ${item.option.branch}`, 760),
      margin + 88,
      y + 31,
    )
    context.fillStyle = petrol
    context.font = '500 17px "Alegreya Sans", Arial, sans-serif'
    const details = [
      item.option.city,
      item.option.annualFee == null ? 'Fee not on record' : `${formatINRExact(item.option.annualFee)}/yr`,
      item.option.distanceKm == null ? 'Distance unknown' : formatKm(item.option.distanceKm),
    ].join(' · ')
    context.fillText(fitText(context, details, 780), margin + 88, y + 56)

    context.fillStyle = ink
    context.font = '700 18px "Azeret Mono", monospace'
    context.fillText(item.tier, width - margin - 250, y + 31)
    context.fillStyle = petrol
    context.font = '500 16px "Azeret Mono", monospace'
    context.fillText(String(item.option.sourceYear), width - margin - 86, y + 31)
    y += rowHeight
  })

  context.fillStyle = ink
  context.font = '600 18px "Alegreya Sans", Arial, sans-serif'
  context.fillText('Fill choices in this exact order.', margin, y + 54)
  context.fillStyle = petrol
  context.font = '500 16px "Alegreya Sans", Arial, sans-serif'
  context.fillText(
    'Closing ranks guide planning; they do not guarantee admission. Missing facts are never estimated.',
    margin,
    y + 84,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('The image could not be prepared.'))
    }, 'image/png')
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName(data)
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function printLockedList(): void {
  window.print()
}
