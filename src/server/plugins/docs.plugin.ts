import {
    PluginOptions as DocsPluginOptions,
    LoadedContent,
    LoadedVersion,
} from '@docusaurus/plugin-content-docs'
import { LoadedPlugin, Props } from '@docusaurus/types'
import * as fs from 'fs'
import * as path from 'path'
import { ImageGenerator } from '../imageGenerator'
import { DocsPageData } from '../types/docs.types'
import { ImageRenderer } from '../types/image.types'
import { PluginOptions } from '../types/plugin.types'
import { BasePlugin } from './base.plugin'
import { WriteQueue } from '../writeQueue'

type DocsPageItem = Omit<DocsPageData, 'document'>

export class DocsPlugin extends BasePlugin<DocsPageItem> {
    static readonly plugin = 'docusaurus-plugin-content-docs'
    
    protected pluginName = DocsPlugin.plugin
    protected pageType = 'docs'

    constructor(
        context: Props,
        options: PluginOptions,
        imageGenerator: ImageGenerator,
        imageRenderer: ImageRenderer,
        writeQueue: WriteQueue,
    ) {
        super(context, options, imageGenerator, imageRenderer, writeQueue)
    }

    protected getPagePermalink(page: DocsPageItem): string {
        return page.metadata.permalink
    }

    protected getPageHtmlPath(doc: DocsPageItem): string | undefined {
        // Custom path logic for docs, as it was in the original
        if (!doc.metadata?.permalink) {
            return undefined
        }
        return path.join(
            this.stripLangFromPath(this.context.outDir),
            doc.metadata.permalink,
            'index.html',
        )
    }

    protected loadInstance = async (plugin: LoadedPlugin) => {
        const content = plugin.content as LoadedContent
        const options = plugin.options as DocsPluginOptions

        const { loadedVersions } = content

        for (const version of loadedVersions) {
            await this.loadVersion(options, version)
        }

        this.loadDiscoveredHtmlPages(options)
    }

    private loadVersion = async (
        options: DocsPluginOptions,
        version: LoadedVersion,
    ) => {
        this.pages.push(
            ...version.docs.map((doc) => ({
                version,
                metadata: doc,
                plugin: options,
            })),
        )
    }

    /**
     * The standard docs content loader (`loadVersion`) only sees pages the
     * docs plugin itself generated from source files. Some routes under the
     * docs base path (e.g. pages added by other plugins/swizzled components)
     * never show up there, so we walk the built output directory for any
     * `index.html` under the docs route that isn't already accounted for,
     * and backfill minimal metadata for it by scraping the built HTML the
     * same way `Document` reads title/description elsewhere in this plugin.
     */
    private loadDiscoveredHtmlPages = (options: DocsPluginOptions) => {
        const routeBasePath =
            typeof options?.routeBasePath === 'string'
                ? options.routeBasePath.replace(/^\/|\/$/g, '')
                : ''

        if (!routeBasePath) {
            return
        }

        const baseDir = path.join(
            this.stripLangFromPath(this.context.outDir),
            routeBasePath,
        )

        if (!fs.existsSync(baseDir)) {
            return
        }

        const knownPermalinks = new Set(
            this.pages
                .map((page) => page?.metadata?.permalink)
                .filter(
                    (permalink): permalink is string =>
                        typeof permalink === 'string' && permalink.length > 0,
                ),
        )

        const htmlFiles = this.findIndexFiles(baseDir)

        for (const filePath of htmlFiles) {
            const permalink = this.getPermalinkFromHtml(
                filePath,
                baseDir,
                routeBasePath,
            )

            if (!permalink || knownPermalinks.has(permalink)) {
                continue
            }

            const metadata = this.extractMetadataFromHtml(filePath, permalink)

            this.pages.push({
                version: undefined,
                metadata,
                plugin: options,
            } as unknown as DocsPageItem)

            knownPermalinks.add(permalink)
        }
    }

    private findIndexFiles = (directory: string): string[] => {
        const files: string[] = []
        let entries: fs.Dirent[] = []

        try {
            entries = fs.readdirSync(directory, { withFileTypes: true })
        } catch {
            return files
        }

        for (const entry of entries) {
            const entryPath = path.join(directory, entry.name)

            if (entry.isDirectory()) {
                files.push(...this.findIndexFiles(entryPath))
                continue
            }

            if (entry.isFile() && entry.name === 'index.html') {
                files.push(entryPath)
            }
        }

        return files
    }

    private getPermalinkFromHtml = (
        filePath: string,
        baseDir: string,
        routeBasePath: string,
    ): string => {
        const relativeDir = path
            .relative(baseDir, path.dirname(filePath))
            .replace(/\\/g, '/')
        const basePermalink = `/${routeBasePath}`

        if (!relativeDir || relativeDir === '.') {
            return basePermalink
        }

        return `${basePermalink}/${relativeDir}`.replace(/\/+/g, '/')
    }

    private extractMetadataFromHtml = (filePath: string, permalink: string) => {
        let html = ''

        try {
            html = fs.readFileSync(filePath, 'utf8')
        } catch {
            html = ''
        }

        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
        const descriptionMatch = html.match(
            /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i,
        )
        const title = this.decodeHtml((titleMatch && titleMatch[1]) || permalink)
        const description = this.decodeHtml(
            (descriptionMatch && descriptionMatch[1]) || '',
        )

        return {
            permalink,
            slug: permalink,
            title,
            description,
        }
    }

    private decodeHtml = (value: string): string =>
        value
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .trim()
}