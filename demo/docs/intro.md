---
sidebar_position: 1
title: Getting started
description: Install Docusaurus OG and generate social preview images for your site.
---

# Getting started

**OpenGraph Images for Docusaurus** generates custom social preview images for
your docs, blog, and pages during a production build. You supply a renderer for
each content plugin you want to support.

## Installation

Requires Node.js 22 or later.

```bash
npm install @homotechsual/docusaurus-og
```

## Configure the plugin

Add the plugin and your renderers to `docusaurus.config.js`:

```js
const { docs, blog, pages } = require('./lib/ImageRenderers')

module.exports = {
  plugins: [
    [
      '@homotechsual/docusaurus-og',
      {
        path: 'og-images',
        imageRenderers: {
          'docusaurus-plugin-content-docs': docs,
          'docusaurus-plugin-content-blog': blog,
          'docusaurus-plugin-content-pages': pages,
        },
      },
    ],
  ],
}
```

Each renderer receives page data and Docusaurus context and returns a React
element and Satori options, including the image dimensions and fonts. See the
[demo renderer](https://github.com/homotechsual/docusaurus-og/blob/main/demo/imageRenderers.js)
for a working example, including a renderer for each content type.

Run `npm run build` in your Docusaurus site. The plugin writes PNG files to the
configured directory inside `build` and adds `og:image` metadata to the built
pages. Images are generated during the production build, not `docusaurus start`.
The site `url` and `baseUrl` should point to the deployed site so social
platforms can access the generated image URLs.

Next, learn how to [use a custom background](./backgrounds.mdx).
