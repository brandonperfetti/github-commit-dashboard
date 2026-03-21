'use client'

import { useMemo, useState } from 'react'

type ContributionDay = {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const levelClasses = [
  'bg-white/[0.06] border-white/5',
  'bg-emerald-900/80 border-emerald-700/30',
  'bg-emerald-700/85 border-emerald-500/40',
  'bg-emerald-500/90 border-emerald-300/40',
  'bg-emerald-300 border-emerald-100/40',
]

function prettyDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function buildCalendarCells(days: ContributionDay[]) {
  const firstDayIndex = new Date(`${days[0].date}T00:00:00`).getDay()
  const lastDayIndex = new Date(`${days[days.length - 1].date}T00:00:00`).getDay()

  const leading = Array.from({ length: firstDayIndex }, () => null as ContributionDay | null)
  const trailing = Array.from({ length: 6 - lastDayIndex }, () => null as ContributionDay | null)

  return [...leading, ...days, ...trailing]
}

function chunkWeeks(cells: Array<ContributionDay | null>) {
  const weeks: Array<Array<ContributionDay | null>> = []

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
}

export default function ContributionHeatmap({ days }: { days: ContributionDay[] }) {
  const calendarCells = useMemo(() => buildCalendarCells(days), [days])
  const weeks = useMemo(() => chunkWeeks(calendarCells), [calendarCells])
  const defaultSelected = days[days.length - 1]
  const [selectedDay, setSelectedDay] = useState<ContributionDay>(defaultSelected)

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/5 px-3 py-2 text-sm text-zinc-200">
          <span className="font-medium text-white">{prettyDay(selectedDay.date)}</span>
          <span className="mx-2 text-zinc-500">·</span>
          <span>{selectedDay.count} contributions</span>
        </div>

        <div className="text-xs text-zinc-500">
          Hover on desktop or tap on mobile for details.
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto">
        <div className="grid grid-rows-7 gap-2 pt-1 text-[11px] text-zinc-500">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="flex h-5 items-center pr-2 md:h-6">
              {label}
            </div>
          ))}
        </div>

        <div
          className="grid min-w-0 flex-1 gap-2"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(48px, 1fr))`,
          }}
        >
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid gap-2" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="h-[18px] rounded-[6px] bg-transparent md:h-6"
                    />
                  )
                }

                const isSelected = selectedDay.date === day.date

                return (
                  <button
                    key={day.date}
                    type="button"
                    onMouseEnter={() => setSelectedDay(day)}
                    onFocus={() => setSelectedDay(day)}
                    onClick={() => setSelectedDay(day)}
                    className={`h-[18px] rounded-[6px] border transition md:h-6 ${levelClasses[day.level]} ${
                      isSelected ? 'ring-2 ring-emerald-200/70 ring-offset-1 ring-offset-[#0d1516]' : 'hover:ring-1 hover:ring-emerald-200/40'
                    }`}
                    aria-label={`${day.count} contributions on ${prettyDay(day.date)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
