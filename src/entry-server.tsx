import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { generateThemeCSS } from '@astryxdesign/core/theme'
import App from './App'
import { notebookTheme } from './theme/notebook'

export function render(initialPath = '/') {
  return {
    html: renderToString(<StrictMode><App initialPath={initialPath} /></StrictMode>),
    theme: generateThemeCSS(notebookTheme),
  }
}
