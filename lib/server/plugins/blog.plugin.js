"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPlugin = void 0;
const tslib_1 = require("tslib");
const blogUtils_js_1 = require("@docusaurus/plugin-content-blog/lib/blogUtils.js");
const utils_1 = require("@docusaurus/utils");
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
        const posts = Array.isArray(content?.blogPosts) ? content.blogPosts : [];
        const blogTags = content?.blogTags && typeof content.blogTags === 'object'
            ? content.blogTags
            : {};
        // `content: BlogContent` doesn't expose the paginated blog-list pages
        // (Docusaurus only builds that locally while generating routes), so
        // recompute it the same way plugin-content-blog's own routes.ts does.
        const listedBlogPosts = posts.filter(blogUtils_js_1.shouldBeListed);
        const paginated = listedBlogPosts.length
            ? (0, blogUtils_js_1.paginateBlogPosts)({
                blogPosts: listedBlogPosts,
                blogTitle: content?.blogTitle ?? '',
                blogDescription: content?.blogDescription ?? '',
                postsPerPageOption: options.postsPerPage,
                basePageUrl: (0, utils_1.normalizeUrl)([
                    this.context.siteConfig.baseUrl,
                    options.routeBasePath,
                ]),
                pageBasePath: options.pageBasePath,
            })
            : [];
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
    };
}
exports.BlogPlugin = BlogPlugin;
