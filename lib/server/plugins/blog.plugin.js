"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPlugin = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const base_plugin_1 = require("./base.plugin");
class BlogPlugin extends base_plugin_1.BasePlugin {
    static plugin = 'docusaurus-plugin-content-blog';
    pluginName = BlogPlugin.plugin;
    pageType = 'blog';
    constructor(context, options, imageGenerator, imageRenderer, writeQueue) {
        super(context, options, imageGenerator, imageRenderer, writeQueue);
    }
    getPagePermalink(page) {
        return page.permalink;
    }
    getPageHtmlPath(page) {
        return this.getHtmlPathFromPermalink(page.permalink);
    }
    loadInstance = async (plugin) => {
        const content = plugin.content;
        const options = plugin.options;
        const paginated = Array.isArray(content?.blogListPaginated)
            ? content.blogListPaginated
            : [];
        const posts = Array.isArray(content?.blogPosts) ? content.blogPosts : [];
        const blogTags = content?.blogTags && typeof content.blogTags === 'object'
            ? content.blogTags
            : {};
        paginated.forEach((value) => {
            const permalink = value?.metadata?.permalink;
            if (typeof permalink !== 'string' || !permalink) {
                return;
            }
            this.pages.push({
                data: value,
                plugin: options,
                pageType: 'list',
                permalink,
            });
        });
        posts.forEach((post) => {
            const permalink = post?.metadata?.permalink;
            if (typeof permalink !== 'string' || !permalink) {
                return;
            }
            this.pages.push({
                data: post,
                plugin: options,
                pageType: 'post',
                permalink,
            });
        });
        const blogTagsListPath = typeof content?.blogTagsListPath === 'string'
            ? content.blogTagsListPath
            : undefined;
        if (blogTagsListPath) {
            const filePath = this.getHtmlPathFromPermalink(blogTagsListPath);
            fs.existsSync(filePath) &&
                this.pages.push({
                    pageType: 'tags',
                    plugin: options,
                    data: {
                        permalink: blogTagsListPath,
                    },
                    permalink: blogTagsListPath,
                });
        }
        if (options.archiveBasePath) {
            const permalink = path.join('/', options.routeBasePath, options.archiveBasePath);
            fs.existsSync(this.getHtmlPathFromPermalink(permalink)) &&
                this.pages.push({
                    plugin: options,
                    pageType: 'archive',
                    data: { permalink: permalink },
                    permalink,
                });
        }
        {
            Object.entries(blogTags).forEach(([, value]) => {
                const pages = Array.isArray(value?.pages) ? value.pages : [];
                pages.forEach((page) => {
                    const permalink = page?.metadata?.permalink;
                    if (typeof permalink !== 'string' || !permalink) {
                        return;
                    }
                    this.pages.push({
                        pageType: 'tag',
                        plugin: options,
                        data: { ...page.metadata, label: value.label },
                        permalink,
                    });
                });
            });
        }
        this.loadDiscoveredHtmlPages(options);
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
        const knownPermalinks = new Set(this.pages.map((page) => page.permalink));
        const htmlFiles = this.findIndexFiles(baseDir);
        for (const filePath of htmlFiles) {
            const permalink = this.getPermalinkFromHtml(filePath, baseDir, routeBasePath);
            if (!permalink || knownPermalinks.has(permalink)) {
                continue;
            }
            const pageType = this.inferPageType(permalink, routeBasePath);
            const data = pageType === 'tag'
                ? { permalink, label: this.extractTagLabel(permalink) }
                : { permalink };
            this.pages.push({
                pageType,
                plugin: options,
                data,
                permalink,
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
    inferPageType = (permalink, routeBasePath) => {
        const normalized = permalink.replace(/\/+$/g, '');
        const base = `/${routeBasePath}`;
        if (normalized === base || normalized.startsWith(`${base}/page/`)) {
            return 'list';
        }
        if (normalized === `${base}/archive`) {
            return 'archive';
        }
        if (normalized === `${base}/tags`) {
            return 'tags';
        }
        if (normalized.startsWith(`${base}/tags/`)) {
            return 'tag';
        }
        if (normalized === `${base}/authors` || normalized.startsWith(`${base}/authors/`)) {
            return 'authors';
        }
        return 'list';
    };
    extractTagLabel = (permalink) => {
        const raw = permalink.split('/').filter(Boolean).pop() || '';
        try {
            return decodeURIComponent(raw).replace(/-/g, ' ');
        }
        catch {
            return raw.replace(/-/g, ' ');
        }
    };
}
exports.BlogPlugin = BlogPlugin;
