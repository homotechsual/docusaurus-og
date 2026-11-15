import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import ogPlugin from '@homotechsual/docusaurus-og'
import { blog, docs, pages } from './imageRenderers.js'

const config: Config = {
  title: 'Docusaurus OG Demo',
  tagline: 'A working example of generated OpenGraph images',
  url: 'https://og.docusaurus.homotechsual.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  plugins: [
    [
      ogPlugin,
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
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Docusaurus OG Demo',
      items: [
        { to: '/docs/intro', label: 'Docs', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { to: '/', label: 'Home', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: 'Demo site for @homotechsual/docusaurus-og',
    },
  } satisfies Preset.ThemeConfig,
}

export default config
