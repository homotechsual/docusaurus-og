# Docusaurus OG

Docusaurus OG enables you to automate the generation of custom OpenGraph (OG) images for your Docusaurus website, enhancing the visual representation of your content when shared on social media and other platforms.

This plugin leverages [Vercel's Satori](https://github.com/vercel/satori) to convert your HTML and CSS into images. It lets you define image renderers tailored to each Docusaurus content plugin, allowing you to create unique OG images for your website's content.

This is the [Homotechsual](https://github.com/homotechsual) maintained fork of [Kas-tle/docusaurus-og](https://github.com/Kas-tle/docusaurus-og). It is maintained independently of upstream.

## Demo

The repository includes a Docusaurus site that exercises the docs, blog, and
pages renderers. Run it from the repository root:

```bash
yarn install
yarn workspace docusaurus-og-demo start
```

To build the site and generate its OpenGraph images:

```bash
yarn workspace docusaurus-og-demo build
```

The generated site is written to `demo/build`, with OG images under
`demo/build/og-images`.

## Installation

Requires Node.js 22 or later.

To get started, simply follow these steps:

1. Install the plugin:

```bash
yarn add @homotechsual/docusaurus-og

# or

npm install @homotechsual/docusaurus-og
```

2. Integrate the plugin into your `docusaurus.config.js`:

```js
plugins: [
  [
    '@homotechsual/docusaurus-og',
    {
      path: './preview-images', // relative to the build directory
      imageRenderers: {},
    },
  ],
]
```

3. Define your image renderers for the content plugins of your choice. Here's an example:

```js
imageRenderers: {
  'docusaurus-plugin-content-docs': require('./lib/ImageRenderers').docs,
  'docusaurus-plugin-content-pages': require('./lib/ImageRenderers').pages,
  'docusaurus-plugin-content-blog': require('./lib/ImageRenderers').blog,
}
```

## Create an Image Renderer

An image renderer is a function that receives a `data` object representing page data and a `context` object representing the Docusaurus context. This function returns HTML or JSX content, which serves as input for Satori, the image generation tool. Satori processes this content to produce the corresponding OpenGraph image.

For example, here's an image renderer for the `@docusaurus/plugin-content-docs` plugin:

```tsx
// src/ImageRenderers.tsx
import type { DocsPageData, ImageRenderer } from '@homotechsual/docusaurus-og'
import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'

export const docs: ImageRenderer<DocsPageData> = (data, context) => [
  <div style={{ display: 'flex', background: 'black', color: 'white' }}>
    {data.metadata.title}
  </div>,
  {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: readFileSync(
          join(__dirname, '../../static/Inter/Inter-Regular.ttf'),
        ),
        weight: 400,
        style: 'normal',
      },
    ],
  },
]
```

### Background Images

Image generation goes through `satori(element) → svg string → new Resvg(svg).render().asPng()`. Satori doesn't rasterize `<img>` sources itself — it just emits an `<image href="...">` reference into the SVG it produces, and the final rasterization to PNG is entirely [`@resvg/resvg-js`](https://github.com/thx/resvg-js)'s job.

`resvg` has limited-to-no support for `<image>` elements whose source is itself an SVG (i.e. `<image href="data:image/svg+xml;base64,...">`, or a `.svg` file loaded the same way). It resolves the reference without erroring, but silently renders nothing for that element — so a background built as a composited SVG (rotation transforms, clip-paths, an embedded raster image, gradients, etc.) referenced via `<img src="data:image/svg+xml;...">` in your renderer can come out blank where the background should be, with everything else on the image rendering fine.

Flat raster images (PNG/JPEG) referenced via `<image>` work as expected. Simple flat SVGs (e.g. a `<rect>` with a `linearGradient` fill, no nested `<image>`) also work fine. If your background needs to be a more complex composite, rasterize it to a PNG ahead of time rather than shipping it as SVG — don't rely on `resvg` to flatten a background SVG containing its own embedded images at render time.

### JSX Support

If you wish to use JSX within your image renderer, you'll need to compile your code to JavaScript. Here's a TypeScript example:

1. Create a `tsconfig.client.json` file in your project root to compile your `src` directory:

```json
// tsconfig.client.json
{
  "compilerOptions": {
    "noEmit": false,
    "composite": true,
    "incremental": true,
    "esModuleInterop": true,
    "tsBuildInfoFile": "./lib/.tsbuildinfo-client",
    "rootDir": "src",
    "outDir": "lib",
    "module": "CommonJS",
    "target": "esnext",
    "jsx": "react",
    "types": ["node"],
    "baseUrl": "./",
    "lib": ["DOM"]
  },
  "include": ["src"]
}
```

2. Add `prestart` and `prebuild` scripts to your `package.json`:

```json
// package.json
{
  "scripts": {
    "prestart": "tsc --project tsconfig.client.json",
    "prebuild": "tsc --project tsconfig.client.json"
  }
}
```

3. Exclude the `lib` directory from your version control by adding it to your `.gitignore` file:

```bash
echo "lib" >> .gitignore
```

4. Import your image renderer from the `lib` directory:

```js
plugins: [
  [
    '@homotechsual/docusaurus-og',
    {
      path: './preview-images', // relative to the build directory
      imageRenderers: {
        'docusaurus-plugin-content-docs': require('./lib/ImageRenderers').docs,
        'docusaurus-plugin-content-pages': require('./lib/ImageRenderers')
          .pages,
        'docusaurus-plugin-content-blog': require('./lib/ImageRenderers').blog,
      },
    },
  ],
]
```
