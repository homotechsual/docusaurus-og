import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const declared = new Set([
  ...Object.keys(manifest.dependencies),
  ...Object.keys(manifest.peerDependencies),
])

test('compiled runtime imports are declared dependencies or peers', () => {
  const lib = join(root, 'lib')
  const files = readdirSync(lib, { recursive: true }).filter((file) => file.endsWith('.js'))
  assert.ok(files.length > 0, 'Build the package before checking runtime dependencies')

  for (const file of files) {
    const source = readFileSync(join(lib, file), 'utf8')
    for (const [, specifier] of source.matchAll(/(?:require\(|import\()\s*['"]([^'"]+)['"]/g)) {
      if (specifier.startsWith('.') || isBuiltin(specifier)) continue
      const name = specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0]
      assert.ok(declared.has(name), `${file} imports undeclared runtime dependency ${name}`)
    }
  }
})
