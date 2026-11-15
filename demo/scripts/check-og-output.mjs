import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const demoDirectory = fileURLToPath(new URL('../', import.meta.url))
const buildDirectory = path.join(demoDirectory, 'build')
const expectedPages = [
  'index.html',
  path.join('docs', 'intro', 'index.html'),
  path.join('blog', 'index.html'),
  path.join('blog', 'archive', 'index.html'),
  path.join('blog', 'first-post', 'index.html'),
]
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

for (const page of expectedPages) {
  const html = readFileSync(path.join(buildDirectory, page), 'utf8')
  const imageMatch = html.match(
    /<meta property="og:image" content="([^"]+)"/,
  )

  assert.ok(imageMatch, `${page} does not contain an og:image meta tag`)

  const imageUrl = new URL(imageMatch[1])
  const imagePath = path.join(
    buildDirectory,
    decodeURIComponent(imageUrl.pathname.replace(/^\/+/, '')),
  )
  const signature = readFileSync(imagePath).subarray(0, pngSignature.length)

  assert.deepEqual(signature, pngSignature, `${page} OG image is not a PNG`)
}

console.log(`Verified OG images for ${expectedPages.length} demo pages.`)
