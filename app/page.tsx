'use client'
// @ts-ignore
import { useEffect, useState, useMemo } from 'react'

// ─── Interfaces ───────────────────────────────────────────────────────────

interface Problem {
  id: number
  title: string
  pattern: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface DashboardStats {
  totalSolved: number
  byDifficulty: {
    Easy: number
    Medium: number
    Hard: number
  }
  byPattern: Record<string, number>
}

interface ProgressItem {
  problem_id: number
  solved_date: string
}

// ─── Theme-aware style maps ────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, Record<'dark' | 'light', string>> = {
  Easy: {
    dark: 'text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/30',
    light: 'text-emerald-700 bg-emerald-100 ring-1 ring-emerald-300',
  },
  Medium: {
    dark: 'text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30',
    light: 'text-amber-700 bg-amber-100 ring-1 ring-amber-300',
  },
  Hard: {
    dark: 'text-rose-400 bg-rose-400/10 ring-1 ring-rose-400/30',
    light: 'text-rose-700 bg-rose-100 ring-1 ring-rose-300',
  },
}

const PATTERN_ICONS: Record<string, string> = {
  Array: '⬡',
  DP: '◈',
  String: '≋',
  Graph: '⬡',
  Tree: '⟁',
  'Linked List': '⬦',
  'Two Pointers': '⇌',
}

// ─── Heatmap helpers ───────────────────────────────────────────────────────

function getColor(count: number, isDark: boolean) {
  if (isDark) {
    if (count === 0) return 'bg-zinc-800'
    if (count === 1) return 'bg-indigo-500/60'
    if (count === 2) return 'bg-indigo-500'
    return 'bg-indigo-400'
  } else {
    if (count === 0) return 'bg-slate-200'
    if (count === 1) return 'bg-indigo-200'
    if (count === 2) return 'bg-indigo-400'
    return 'bg-indigo-600'
  }
}

function getLast12Weeks() {
  const days: string[] = []
  const today = new Date()
  for (let i = 83; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

function getCountByDate(progressData: ProgressItem[]) {
  const countMap: Record<string, number> = {}
  progressData.forEach(item => {
    const date = item.solved_date
    countMap[date] = (countMap[date] || 0) + 1
  })
  return countMap
}

// ─── Component ────────────────────────────────────────────────────────────

export default function Home() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [pattern, setPattern] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [progressData, setProgressData] = useState<ProgressItem[]>([])
  const [isDark, setIsDark] = useState(true)

  // Derive solved IDs from progressData
  const solvedIds = useMemo(() => 
    new Set<number>(progressData.map(item => item.problem_id)), 
    [progressData]
  )

  const USER_ID = 'd4a4ea2e-298d-479f-b0f2-f336859b2515'

  const fetchData = async () => {
    setLoading(true)
    try {
      const pUrl = `/api${pattern || difficulty ? '?' : ''}${pattern ? `pattern=${pattern}` : ''}${pattern && difficulty ? '&' : ''}${difficulty ? `difficulty=${difficulty}` : ''}`
      
      const [pRes, sRes, prRes] = await Promise.all([
        fetch(pUrl),
        fetch(`/api/stats?userId=${USER_ID}`),
        fetch(`/api/progress?userId=${USER_ID}`)
      ])

      const [pData, sData, prData] = await Promise.all([
        pRes.json(),
        sRes.json(),
        prRes.json()
      ])

      setProblems(pData)
      setStats(sData)
      setProgressData(prData)
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pattern, difficulty])

  const handleMarkSolved = async (problemId: number) => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, problemId, confidence: 3, notes: '' }),
      })

      if (response.ok) {
        setMessage('Problem marked as solved!')
        fetchData() // Refresh everything
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to mark as solved')
      }
    } catch {
      setMessage('Error occurred')
    }
  }

  // Heatmap Logic
  const countMap = getCountByDate(progressData)
  const dates = getLast12Weeks()
  const heatmapData = dates.map(date => ({ date, count: countMap[date] || 0 }))
  const weeks: { date: string; count: number }[][] = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  // ─── Theme tokens ──────────────────────────────────────────────────────
  const t = {
    pageBg:         isDark ? 'bg-zinc-950'           : 'bg-slate-50',
    pageText:       isDark ? 'text-zinc-100'          : 'text-slate-900',
    mutedText:      isDark ? 'text-zinc-500'          : 'text-slate-400',
    accentText:     isDark ? 'text-indigo-400'        : 'text-indigo-600',
    accentDot:      isDark ? 'bg-indigo-400'          : 'bg-indigo-500',
    toastBg:        isDark ? 'bg-zinc-900'            : 'bg-white',
    toastBorder:    isDark ? 'border-indigo-500/40'   : 'border-indigo-200',
    toastText:      isDark ? 'text-zinc-200'          : 'text-slate-700',
    toastShadow:    isDark ? 'shadow-indigo-500/10'   : 'shadow-slate-200',
    cardBg:         isDark ? 'bg-zinc-900/70'         : 'bg-white',
    labelText:      isDark ? 'text-zinc-500'          : 'text-slate-400',
    statRings: {
      total:        isDark ? 'ring-zinc-700'          : 'ring-slate-200',
      easy:         isDark ? 'ring-emerald-800/50'    : 'ring-emerald-200',
      medium:       isDark ? 'ring-amber-800/50'      : 'ring-amber-200',
      hard:         isDark ? 'ring-rose-800/50'       : 'ring-rose-200',
    },
    statAccents: {
      total:        isDark ? 'text-zinc-100'          : 'text-slate-800',
      easy:         isDark ? 'text-emerald-400'       : 'text-emerald-600',
      medium:       isDark ? 'text-amber-400'         : 'text-amber-600',
      hard:         isDark ? 'text-rose-400'          : 'text-rose-600',
    },
    sectionBg:      isDark ? 'bg-zinc-900/50'         : 'bg-white',
    sectionRing:    isDark ? 'ring-zinc-800'          : 'ring-slate-200',
    badgeBg:        isDark ? 'bg-zinc-800/80'         : 'bg-slate-100',
    badgeRing:      isDark ? 'ring-zinc-700/50'       : 'ring-slate-200',
    badgeText:      isDark ? 'text-zinc-300'          : 'text-slate-700',
    badgeCount:     isDark ? 'text-zinc-500'          : 'text-slate-400',
    badgeIcon:      isDark ? 'text-indigo-400'        : 'text-indigo-500',
    heatLegendText: isDark ? 'text-zinc-600'          : 'text-slate-400',
    heatLegendCells: isDark
      ? ['bg-zinc-800', 'bg-indigo-500/60', 'bg-indigo-500', 'bg-indigo-400']
      : ['bg-slate-200', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'],
    selectBg:       isDark ? 'bg-zinc-900'            : 'bg-white',
    selectBorder:   isDark ? 'border-zinc-800'        : 'border-slate-200',
    selectText:     isDark ? 'text-zinc-300'          : 'text-slate-700',
    selectChevron:  isDark ? '%2371717a'              : '%2394a3b8',
    clearText:      isDark
      ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
    skeletonBg:     isDark ? 'bg-zinc-900/50'         : 'bg-slate-100',
    skeletonRing:   isDark ? 'ring-zinc-800'          : 'ring-slate-200',
    rowSolved:      isDark ? 'bg-emerald-950/20 ring-emerald-800/30' : 'bg-emerald-50 ring-emerald-200',
    rowDefault:     isDark
      ? 'bg-zinc-900/50 ring-zinc-800/80 hover:bg-zinc-900 hover:ring-zinc-700'
      : 'bg-white ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
    rowIndex:       isDark ? 'text-zinc-600'          : 'text-slate-300',
    rowTitleSolved: isDark ? 'text-zinc-500'          : 'text-slate-400',
    rowTitleActive: isDark ? 'text-zinc-200'          : 'text-slate-800',
    rowPattern:     isDark ? 'text-zinc-600'          : 'text-slate-400',
    btnSolved:      isDark ? 'text-emerald-600 bg-emerald-950/40' : 'text-emerald-600 bg-emerald-50',
    btnDefault:     isDark
      ? 'text-zinc-400 bg-zinc-800 hover:bg-indigo-500/20 hover:text-indigo-300 hover:ring-1 hover:ring-indigo-500/40 active:scale-95'
      : 'text-slate-500 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:ring-1 hover:ring-indigo-300 active:scale-95',
    emptyText:      isDark ? 'text-zinc-600'          : 'text-slate-300',
    footerBorder:   isDark ? 'border-zinc-900'        : 'border-slate-200',
    footerText:     isDark ? 'text-zinc-700'          : 'text-slate-400',
    toggleBg:       isDark
      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
      : 'bg-white hover:bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    glowA:          isDark ? 'bg-indigo-600/10'       : 'bg-indigo-300/20',
    glowB:          isDark ? 'bg-violet-600/8'         : 'bg-violet-200/20',
    glowC:          isDark ? 'bg-indigo-500/6'         : 'bg-indigo-200/20',
  }

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='${t.selectChevron}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '16px',
  }

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.pageText} font-mono selection:bg-indigo-500/30 transition-colors duration-300`}>
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl transition-colors duration-300 ${t.glowA}`} />
        <div className={`absolute top-1/3 right-0 w-80 h-80 rounded-full blur-3xl transition-colors duration-300 ${t.glowB}`} />
        <div className={`absolute bottom-0 left-1/3 w-72 h-72 rounded-full blur-3xl transition-colors duration-300 ${t.glowC}`} />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${t.accentDot} animate-pulse`} />
              <span className={`text-xs ${t.mutedText} tracking-widest uppercase`}>Practice Tracker</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              grind<span className={t.accentText}>.</span>log
            </h1>
            <p className={`${t.mutedText} text-sm mt-1`}>stay consistent. stay sharp.</p>
          </div>

          <button
            onClick={() => setIsDark(d => !d)}
            className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${t.toggleBg}`}
          >
            {isDark ? '☀ light' : '☾ dark'}
          </button>
        </div>

        {/* Toast */}
        {message && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 ${t.toastBg} border ${t.toastBorder} rounded-xl shadow-2xl ${t.toastShadow} text-sm ${t.toastText}`}>
            <span className={t.accentText}>✓</span>
            {message}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: 'Total Solved', value: stats.totalSolved, accent: t.statAccents.total,  ring: t.statRings.total },
              { label: 'Easy',         value: stats.byDifficulty.Easy,   accent: t.statAccents.easy,   ring: t.statRings.easy },
              { label: 'Medium',       value: stats.byDifficulty.Medium, accent: t.statAccents.medium, ring: t.statRings.medium },
              { label: 'Hard',         value: stats.byDifficulty.Hard,   accent: t.statAccents.hard,   ring: t.statRings.hard },
            ].map(({ label, value, accent, ring }) => (
              <div key={label} className={`${t.cardBg} backdrop-blur rounded-2xl p-5 ring-1 ${ring} transition-colors duration-300`}>
                <p className={`text-xs ${t.labelText} uppercase tracking-widest mb-2`}>{label}</p>
                <p className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pattern Breakdown */}
        {stats?.byPattern && (
          <div className={`${t.sectionBg} backdrop-blur rounded-2xl p-6 ring-1 ${t.sectionRing} mb-10 transition-colors duration-300`}>
            <p className={`text-xs ${t.labelText} uppercase tracking-widest mb-4`}>Pattern Breakdown</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byPattern).map(([pat, count]) => (
                <div
                  key={pat}
                  className={`flex items-center gap-2 px-3 py-1.5 ${t.badgeBg} rounded-lg ring-1 ${t.badgeRing} text-sm transition-colors duration-300`}
                >
                  <span className={`${t.badgeIcon} text-xs`}>{PATTERN_ICONS[pat] ?? '◆'}</span>
                  <span className={t.badgeText}>{pat}</span>
                  <span className={`${t.badgeCount} tabular-nums`}>{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap */}
        <div className={`${t.sectionBg} backdrop-blur rounded-2xl p-6 ring-1 ${t.sectionRing} mb-10 transition-colors duration-300`}>
          <p className={`text-xs ${t.labelText} uppercase tracking-widest mb-4`}>Activity — Last 12 Weeks</p>
          <div className="flex gap-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1.5">
                {week.map(({ date, count }) => (
                  <div
                    key={date}
                    title={`${date}: ${count} problem${count !== 1 ? 's' : ''}`}
                    className={`w-3.5 h-3.5 rounded-sm ${getColor(count, isDark)} transition-all duration-150 hover:scale-125 cursor-pointer`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`text-xs ${t.heatLegendText}`}>Less</span>
            {t.heatLegendCells.map(c => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className={`text-xs ${t.heatLegendText}`}>More</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            className={`${t.selectBg} border ${t.selectBorder} ${t.selectText} text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition-all cursor-pointer appearance-none pr-8`}
            style={selectStyle}
          >
            <option value="">All Patterns</option>
            {['Array', 'DP', 'String', 'Graph', 'Tree', 'Linked List', 'Two Pointers'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className={`${t.selectBg} border ${t.selectBorder} ${t.selectText} text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition-all cursor-pointer appearance-none pr-8`}
            style={selectStyle}
          >
            <option value="">All Difficulties</option>
            {['Easy', 'Medium', 'Hard'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {(pattern || difficulty) && (
            <button
              onClick={() => { setPattern(''); setDifficulty('') }}
              className={`text-xs px-3 py-2 rounded-xl transition-all ${t.clearText}`}
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* Problems List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-16 ${t.skeletonBg} rounded-2xl animate-pulse ring-1 ${t.skeletonRing}`} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {problems.length === 0 ? (
              <div className={`text-center py-16 ${t.emptyText}`}>
                <p className="text-4xl mb-3">◈</p>
                <p className="text-sm">No problems found</p>
              </div>
            ) : (
              problems.map((problem, idx) => {
                const isSolved = solvedIds.has(problem.id)
                return (
                  <div
                    key={problem.id}
                    className={`group flex items-center justify-between px-5 py-4 rounded-2xl ring-1 transition-all duration-200
                      ${isSolved ? t.rowSolved : t.rowDefault}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`text-xs ${t.rowIndex} tabular-nums w-7 text-right flex-shrink-0`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isSolved ? `${t.rowTitleSolved} line-through` : t.rowTitleActive}`}>
                          {problem.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${t.rowPattern}`}>
                            {PATTERN_ICONS[problem.pattern] ?? '◆'} {problem.pattern}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${DIFFICULTY_STYLES[problem.difficulty]?.[isDark ? 'dark' : 'light'] ?? ''}`}>
                        {problem.difficulty}
                      </span>
                      <button
                        onClick={() => handleMarkSolved(problem.id)}
                        disabled={isSolved}
                        className={`text-xs px-4 py-2 rounded-xl font-medium transition-all duration-200
                          ${isSolved ? `${t.btnSolved} cursor-default` : t.btnDefault}`}
                      >
                        {isSolved ? '✓ solved' : 'mark solved'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`mt-16 pt-8 border-t ${t.footerBorder} flex items-center justify-between text-xs ${t.footerText} transition-colors duration-300`}>
          <span>grind.log</span>
          <span>{problems.length} problems loaded</span>
        </div>
      </div>
    </div>
  )
}
