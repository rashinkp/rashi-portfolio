import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

export const notebookTheme = defineTheme({
  name: 'notebook',
  extends: neutralTheme,
  color: { accent: '#6D58C9', neutralStyle: 'warm', contrast: 'standard' },
  typography: {
    scale: { base: 18, ratio: 1.2 },
    body: { family: 'Gaegu', fallbacks: 'system-ui, sans-serif' },
    heading: { family: 'Solway', fallbacks: 'Georgia, serif', weight: 'bold' },
  },
  components: {
    button: { base: { ':active': { transform: 'scale(0.96)' }, transitionProperty: 'transform', transitionDuration: 'var(--duration-fast-min)', transitionTimingFunction: 'var(--ease-standard)' } },
  },
  tokens: {
    '--color-text-purple': ['#8774FF', '#B3A6FF'],
    '--color-text-red': ['#E52929', '#FF8585'],
    '--color-text-green': ['#398B25', '#80DE68'],
    '--color-background-blue': ['#4AA7EB', '#297BAD'],
    '--color-background-orange': ['#FFC38E', '#FFC38E'],
    '--color-on-light': ['#292729', '#292729'],
    '--color-background-body': ['#FCFBF8', '#171719'],
    '--color-background-surface': ['#FFFFFF', '#242427'],
    '--color-background-card': ['#FFFFFF', '#242427'],
    '--color-background-yellow': ['#FFF0B9', '#473D22'],
    '--color-background-pink': ['#FFD3E6', '#482B3B'],
    '--color-background-green': ['#DDF2BC', '#30412B'],
    '--color-background-cyan': ['#CAF1F4', '#233F44'],
    '--color-background-purple': ['#E6DCFC', '#39304D'],
    '--color-text-primary': ['#292729', '#EEEAE3'],
    '--color-text-secondary': ['#605B65', '#C2BBC8'],
  },
})
