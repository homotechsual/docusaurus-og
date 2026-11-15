import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import { DOCUSAURUS_VERSION } from '@docusaurus/utils'
import { themes as prismThemes } from 'prism-react-renderer'
import { blog, docs, pages } from './imageRenderers.js'

const config: Config = {
  title: 'OpenGraph Images for Docusaurus',
  tagline: 'Generate custom social preview images for your Docusaurus site',
  favicon: 'img/favicon.svg',
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
      title: 'Docusaurus OG',
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', label: 'Docs', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { href: 'https://docs.homotechsual.dev/', label: 'Other Projects', position: 'right' },
        { href: 'https://github.com/sponsors/homotechsual', label: 'Sponsor', position: 'right' },
        { href: 'https://github.com/homotechsual/docusaurus-og', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting started', to: '/docs/intro' },
            { label: 'Custom backgrounds', to: '/docs/backgrounds' },
            { label: 'Blog example', to: '/blog/first-post' },
          ],
        },
        {
          title: 'Links',
          items: [
            { label: 'GitHub', href: 'https://github.com/homotechsual/docusaurus-og' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@homotechsual/docusaurus-og' },
            { label: 'Other Projects', href: 'https://docs.homotechsual.dev/' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mikey O'Toole.<br />Built with <a href="https://docusaurus.io">Docusaurus v${DOCUSAURUS_VERSION}</a>.<br /><span class="designedBy">Designed with <span class="heart" aria-label="love">♥</span> by <a href="https://homotechsual.dev">homotechsual</a></span>`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
