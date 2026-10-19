import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { generateThemeCSS } from '@astryxdesign/core/theme'
import App from './App'
import { notebookTheme } from './theme/notebook'

export function render() {
  return {
    html: renderToString(<StrictMode><App /></StrictMode>),
    theme: generateThemeCSS(notebookTheme),
  }
}
