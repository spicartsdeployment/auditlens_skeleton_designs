import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay, addMonths, subMonths } from 'date-fns'
import { mockComplianceApi } from '@/mock/api'
import { G, PageHeader, TabBar, ContentCard, StatusBadge } from '@/shared/components/GrayKpi'

/**
 * Event type colors — minimal, purposeful:
 * - notice: red (urgent/legal)
 * - all others: slate dot for visual grouping without color noise
 */
const TYPE_DOT: Record<string, string> = {
  gst:     G.primary,
  tds:     G.secondary,
  audit:   G.icon,
  notice:  '#DC2626',
  meeting: '#0584C7',
}
const TYPE_LABELS: Record<string, string> = {
  gst: 'GST', tds: 'TDS', audit: 'Audit', notice: 'Notice', meeting: 'Meeting',
}

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1))
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const { data: events = [] } = useQuery({ queryKey: ['calendar-events'], queryFn: () => mockComplianceApi.calendarEvents().then(r => r.data) })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = monthStart.getDay()
  const paddedDays = Array.from({ length: startDay }).fill(null).concat(days) as (Date | null)[]

  const getEventsForDay = (day: Date) => (events as any[]).filter(e => isSameDay(parseISO(e.date), day))
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []
  const agendaEvents = (events as any[])
    .filter(e => parseISO(e.date) >= monthStart && parseISO(e.date) <= monthEnd)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="Compliance Calendar" sub="GST, TDS, Audit deadlines and meetings">
        <TabBar tabs={['month', 'agenda']} active={view} onChange={setView} />
      </PageHeader>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: TYPE_DOT[type] }} />
            <span className="text-xs" style={{ color: G.secondary }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="flex items-center justify-center h-8 w-8 rounded-xl transition-all"
          style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <ChevronLeft className="h-4 w-4" style={{ color: G.secondary }} />
        </button>
        <h2 className="text-base font-semibold" style={{ color: G.primary }}>{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="flex items-center justify-center h-8 w-8 rounded-xl transition-all"
          style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <ChevronRight className="h-4 w-4" style={{ color: G.secondary }} />
        </button>
      </div>

      {view === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar grid */}
          <ContentCard className="lg:col-span-2">
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase" style={{ color: G.icon }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="h-20 rounded-xl" />
                  const dayEvents = getEventsForDay(day)
                  const isSelected = selectedDay && isSameDay(day, selectedDay)
                  const today = isToday(day)
                  return (
                    <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                      className="relative h-20 rounded-xl p-1.5 text-left transition-all"
                      style={{
                        background: today ? G.canvas : isSelected ? G.canvas : 'transparent',
                        border: `1px solid ${isSelected ? G.primary : today ? G.border : 'transparent'}`,
                        outline: isSelected ? `1px solid ${G.primary}` : 'none',
                      }}>
                      <span className="text-xs font-semibold"
                        style={{ color: today ? '#0584C7' : !isSameMonth(day, currentMonth) ? G.icon : G.primary }}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((e, idx) => (
                          <div key={idx} className="flex items-center gap-0.5 rounded px-1 py-0.5"
                            style={{ background: G.canvas }}>
                            <div className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ background: TYPE_DOT[e.type] ?? G.icon }} />
                            <span className="text-[9px] font-medium truncate leading-none"
                              style={{ color: G.primary }}>{e.title.split('—')[0].trim()}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && <p className="text-[9px] pl-1" style={{ color: G.icon }}>+{dayEvents.length - 3}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </ContentCard>

          {/* Selected day events */}
          <ContentCard>
            <div className="p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>
                {selectedDay ? format(selectedDay, 'EEEE, d MMMM') : 'Select a day'}
              </h3>
              {!selectedDay ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <CalIcon className="h-10 w-10" style={{ color: G.icon }} />
                  <p className="text-sm" style={{ color: G.secondary }}>Click a day to see events</p>
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: G.secondary }}>No events on this day</p>
              ) : (
                <ul className="space-y-3">
                  {selectedDayEvents.map((e: any) => (
                    <li key={e.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full shrink-0"
                        style={{ background: TYPE_DOT[e.type] ?? G.icon }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: G.primary }}>{e.title}</p>
                        <span className="text-[10px] font-semibold uppercase" style={{ color: G.icon }}>{TYPE_LABELS[e.type]}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ContentCard>
        </div>
      )}

      {view === 'agenda' && (
        <ContentCard>
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>
              All Events — {format(currentMonth, 'MMMM yyyy')}
            </h3>
            {agendaEvents.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: G.secondary }}>No events this month</p>
            ) : (
              <div className="space-y-2">
                {agendaEvents.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-4 rounded-xl p-4 transition-all"
                    style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <div className="flex flex-col items-center w-12 shrink-0">
                      <span className="text-[10px]" style={{ color: G.secondary }}>{format(parseISO(e.date), 'MMM')}</span>
                      <span className="text-xl font-bold leading-none" style={{ color: G.primary }}>{format(parseISO(e.date), 'd')}</span>
                      <span className="text-[9px]" style={{ color: G.icon }}>{format(parseISO(e.date), 'EEE')}</span>
                    </div>
                    {/* Accent bar — type color */}
                    <div className="h-8 w-1 rounded-full shrink-0"
                      style={{ background: TYPE_DOT[e.type] ?? G.icon }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: G.primary }}>{e.title}</p>
                      <StatusBadge status={e.type} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContentCard>
      )}
    </div>
  )
}
