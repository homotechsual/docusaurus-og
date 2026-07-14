"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocsPlugin = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const base_plugin_1 = require("./base.plugin");
class DocsPlugin extends base_plugin_1.BasePlugin {
    static plugin = 'docusaurus-plugin-content-docs';
    pluginName = DocsPlugin.plugin;
    pageType = 'docs';
    constructor(context, options, imageGenerator, imageRenderer, writeQueue) {
        super(context, options, imageGenerator, imageRenderer, writeQueue);
    }
    getPagePermalink(page) {
        return page.metadata.permalink;
    }
    getPageHtmlPath(doc) {
        // Custom path logic for docs, as it was in the original
        if (!doc.metadata?.permalink) {
            return undefined;
        }
        return path.join(this.stripLangFromPath(this.context.outDir), doc.metadata.permalink, 'index.html');
    }
    loadInstance = async (plugin) => {
        const content = plugin.content;
        const options = plugin.options;
        const { loadedVersions } = content;
        for (const version of loadedVersions) {
            await this.loadVersion(options, version);
        }
        this.loadDiscoveredHtmlPages(options);
    };
    loadVersion = async (options, version) => {
        this.pages.push(...version.docs.map((doc) => ({
            version,
            metadata: doc,
            plugin: options,
        })));
    };
    loadDiscoveredHtmlPages = (options) => {
        const routeBasePath = typeof options?.routeBasePath === 'string'
            ? options.routeBasePath.replace(/^\/|\/$/g, '')
            : '';
        if (!routeBasePath) {
            return;
        }
        const baseDir = path.join(this.stripLangFromPath(this.context.outDir), routeBasePath);
        if (!fs.existsSync(baseDir)) {
            return;
        }
        const knownPermalinks = new Set(this.pages
            .map((page) => page?.metadata?.permalink)
            .filter((permalink) => typeof permalink === 'string' && permalink.length > 0));
        const htmlFiles = this.findIndexFiles(baseDir);
        for (const filePath of htmlFiles) {
            const permalink = this.getPermalinkFromHtml(filePath, baseDir, routeBasePath);
            if (!permalink || knownPermalinks.has(permalink)) {
                continue;
            }
            const metadata = this.extractMetadataFromHtml(filePath, permalink);
            this.pages.push({
                version: undefined,
                metadata,
                plugin: options,
            });
            knownPermalinks.add(permalink);
        }
    };
    findIndexFiles = (directory) => {
        const files = [];
        let entries = [];
        try {
            entries = fs.readdirSync(directory, { withFileTypes: true });
        }
        catch {
            return files;
        }
        for (const entry of entries) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.findIndexFiles(entryPath));
                continue;
            }
            if (entry.isFile() && entry.name === 'index.html') {
                files.push(entryPath);
            }
        }
        return files;
    };
    getPermalinkFromHtml = (filePath, baseDir, routeBasePath) => {
        const relativeDir = path.relative(baseDir, path.dirname(filePath)).replace(/\\/g, '/');
        const basePermalink = `/${routeBasePath}`;
        if (!relativeDir || relativeDir === '.') {
            return basePermalink;
        }
        return `${basePermalink}/${relativeDir}`.replace(/\/+/g, '/');
    };
    extractMetadataFromHtml = (filePath, permalink) => {
        let html = '';
        try {
            html = fs.readFileSync(filePath, 'utf8');
        }
        catch {
            html = '';
        }
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i);
        const title = this.decodeHtml((titleMatch && titleMatch[1]) || permalink);
        const description = this.decodeHtml((descriptionMatch && descriptionMatch[1]) || '');
        return {
            permalink,
            slug: permalink,
            title,
            description,
        };
    };
    decodeHtml = (value) => value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
}
exports.DocsPlugin = DocsPlugin;
