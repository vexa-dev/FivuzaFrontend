// Falla si algun var(--token) usado en src/ no esta definido en ningun lado.
// Un token inexistente no rompe el build: el navegador simplemente ignora la
// declaracion y el componente se ve sin borde/fondo/color (ya paso en la
// pantalla de Usuarios). Se consideran definidos los tokens declarados en
// CSS (--x: ...) y los que se fijan desde TSX via style ('--x': valor).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(css|tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

const defined = new Set()
const used = new Map()
for (const file of walk(ROOT)) {
  const source = readFileSync(file, 'utf8')
  for (const [, name] of source.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(name)
  for (const [, name] of source.matchAll(/['"](--[a-z0-9-]+)['"]/gi)) defined.add(name)
  for (const [, name] of source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    if (!used.has(name)) used.set(name, new Set())
    used.get(name).add(file.slice(ROOT.length))
  }
}

const missing = [...used].filter(([name]) => !defined.has(name))
if (missing.length > 0) {
  console.error('Tokens CSS usados pero no definidos:')
  for (const [name, files] of missing) console.error(`  ${name}  (${[...files].join(', ')})`)
  process.exit(1)
}
console.log(`OK: ${used.size} tokens usados, todos definidos.`)
