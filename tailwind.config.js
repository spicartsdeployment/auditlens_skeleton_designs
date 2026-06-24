/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand: matches reference #0584C7 as primary action
        primary: {
          50:  '#EBF5FD',
          100: '#C5E5F8',
          200: '#8CCCF2',
          300: '#52B2EB',
          400: '#2499E0',
          500: '#0584C7',
          600: '#0470A9',
          700: '#035D8D',
          800: '#024A71',
          900: '#013754',
        },
        // Accent (teal)
        accent: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          500: '#0D9488',
          600: '#0F766E',
          700: '#115E59',
        },
        // Warning (amber)
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
        // Danger (red)
        danger: {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          500: '#DC2626',
          600: '#B91C1C',
        },
        // Neutral — slate scale (enterprise secondary framework 20%)
        neutral: {
          50:  '#F8FAFC',   // bg-app
          100: '#F1F5F9',
          200: '#E2E8F0',   // border-subtle
          300: '#CBD5E1',
          400: '#94A3B8',   // text-muted (decorative only)
          500: '#64748B',   // text-secondary (on white surfaces 4.6:1 ✓)
          600: '#475569',   // text on bg-app (5.4:1 ✓)
          700: '#334155',   // table cell text (10.7:1 ✓)
          800: '#1E293B',   // btn-primary hover
          900: '#0F172A',   // text-primary, CTA fill (19.6:1 ✓ AAA)
        },
        // Dominant canvas (70%)
        surface: '#FFFFFF',
        canvas: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',   { lineHeight: '1rem' }],
        sm:   ['0.875rem',  { lineHeight: '1.25rem' }],
        base: ['1rem',      { lineHeight: '1.5rem' }],
        lg:   ['1.125rem',  { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',    { lineHeight: '2rem' }],
        '3xl':['1.875rem',  { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        sm:    '4px',
        DEFAULT:'8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        full:  '9999px',
      },
      boxShadow: {
        sm:       '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card:     '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        md:       '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        lg:       '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        xl:       '0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        '2xl':    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        dropdown: '0 8px 16px -2px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        glow:     '0 0 15px rgba(5, 132, 199, 0.20)',
        soft:     '0 4px 20px -2px rgba(0,0,0,0.05)',
        sidebar:  '0 25px 50px -12px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)',
        'brand-gradient':   'linear-gradient(135deg, #0584C7, #035D8D)',
        'page-gradient':    'linear-gradient(135deg, rgba(5,132,199,0.03) 0%, #f8fafc 50%, rgba(235,245,253,0.5) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
