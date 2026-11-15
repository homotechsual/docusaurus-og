import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { docs } from '../imageRenderers.js'

const demoDirectory = fileURLToPath(new URL('../', import.meta.url))
const buildDirectory = path.join(demoDirectory, 'build')
const expectedPages = [
  'index.html',
  path.join('docs', 'intro', 'index.html'),
  path.join('docs', 'backgrounds', 'index.html'),
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
  const image = readFileSync(imagePath)
  const signature = image.subarray(0, pngSignature.length)

  assert.deepEqual(signature, pngSignature, `${page} OG image is not a PNG`)
  assert.ok(image.length >= 24, `${page} OG image has an incomplete PNG header`)
  assert.equal(image.readUInt32BE(16), 1200, `${page} OG image width is not 1200px`)
  assert.equal(image.readUInt32BE(20), 630, `${page} OG image height is not 630px`)

  if (page === path.join('docs', 'backgrounds', 'index.html')) {
    const dataUrl = `data:image/png;base64,${image.toString('base64')}`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><image href="${dataUrl}" width="1200" height="630"/></svg>`
    const pixels = new Resvg(svg).render().pixels
    const offset = (620 * 1200 + 1190) * 4
    const actual = [...pixels.subarray(offset, offset + 4)]
    assert.ok(
      actual[0] >= 70 && actual[0] <= 110 &&
      actual[1] >= 35 && actual[1] <= 60 &&
      actual[2] >= 55 && actual[2] <= 80 && actual[3] === 255,
      `SVG background did not render as expected: ${actual}`,
    )
  }
}

const [svgExample] = docs({
  metadata: { title: 'Example', frontMatter: { og_background: 'svg' } },
})
assert.ok(
  svgExample.props.children[0].props.src.startsWith('data:image/svg+xml;base64,'),
  'The SVG example must use an SVG background',
)

console.log(`Verified OG images for ${expectedPages.length} demo pages.`)
