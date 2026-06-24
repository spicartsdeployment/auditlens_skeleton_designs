import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      toggle: () =>
        set((s) => {
          const next: Theme = s.theme === 'light' ? 'dark' : 'light'
          applyTheme(next)
          return { theme: next }
        }),
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    { name: 'auditlens-theme' }
  )
)

/** Call once on app boot to apply persisted theme */
export function initTheme() {
  const raw = localStorage.getItem('auditlens-theme')
  try {
    const parsed = JSON.parse(raw ?? '{}')
    applyTheme(parsed?.state?.theme ?? 'light')
  } catch {
    applyTheme('light')
  }
}
