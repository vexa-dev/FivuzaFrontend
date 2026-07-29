import { TextDecoder, TextEncoder } from 'node:util'
import '@testing-library/jest-dom'

// jsdom no expone TextEncoder/TextDecoder por defecto, y react-router los
// necesita en tiempo de import -sin este polyfill, cualquier test que
// importe react-router-dom falla antes de correr un solo assert.
Object.assign(globalThis, { TextEncoder, TextDecoder })

// jsdom tampoco implementa matchMedia -lo necesita ThemeProvider para
// detectar el tema preferido del sistema (theme/ThemeContext.tsx).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
