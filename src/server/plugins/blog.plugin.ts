import {
    BlogContent,
    PluginOptions as BlogPluginOptions,
} from '@docusaurus/plugin-content-blog'
import { LoadedPlugin, Props } from '@docusaurus/types'
import * as fs from 'fs'
import * as path from 'path'
import { ImageGenerator } from '../imageGenerator'
import { BlogPageData } from '../types/blog.types'
import { ImageRenderer } from '../types/image.types'
import { PluginOptions } from '../types/plugin.types'
import { BasePlugin } from './base.plugin'
import { WriteQueue } from '../writeQueue'

type BlogPageItem = Omit<BlogPageData, 'document'>

export class BlogPlugin extends BasePlugin<BlogPageItem> {
    static readonly plugin = 'docusaurus-plugin-content-blog'

    protected pluginName = BlogPlugin.plugin
    protected pageType = 'blog'

    constructor(
        context: Props,
        options: PluginOptions,
        imageGenerator: ImageGenerator,
        imageRenderer: ImageRenderer,
        writeQueue: WriteQueue,
    ) {
        super(context, options, imageGenerator, imageRenderer, writeQueue)
    }

    protected getPagePermalink(page: BlogPageItem): string {
        return page.permalink
    }

    protected getPageHtmlPath(page: BlogPageItem): string | undefined {
        return this.getHtmlPathFromPermalink(page.permalink)
    }

    protected loadInstance = async (plugin: LoadedPlugin) => {
        const content = plugin.content as BlogContent
        const options = plugin.options as BlogPluginOptions
        const paginated = Array.isArray(content?.blogListPaginated)
            ? content.blogListPaginated
            : []
        const posts = Array.isArray(content?.blogPosts) ? content.blogPosts : []
        const blogTags =
            content?.blogTags && typeof content.blogTags === 'object'
                ? content.blogTags
                : {}

        paginated.forEach((value) => {
            const permalink = value?.metadata?.permalink

            if (typeof permalink !== 'string' || !permalink) {
                return
            }

            this.pages.push({
                data: value,
                plugin: options,
                pageType: 'list',
                permalink,
            })
        })

        posts.forEach((post) => {
            const permalink = post?.metadata?.permalink

            if (typeof permalink !== 'string' || !permalink) {
                return
            }

            this.pages.push({
                data: post,
                plugin: options,
                pageType: 'post',
                permalink,
            })
        })

        const blogTagsListPath =
            typeof content?.blogTagsListPath === 'string'
                ? content.blogTagsListPath
                : undefined

        if (blogTagsListPath) {
            const filePath = this.getHtmlPathFromPermalink(blogTagsListPath)

            fs.existsSync(filePath) &&
                this.pages.push({
                    pageType: 'tags',
                    plugin: options,
                    data: {
                        permalink: blogTagsListPath,
                    },
                    permalink: blogTagsListPath,
                })
        }

        if (options.archiveBasePath) {
            const permalink = path.join(
                '/',
                options.routeBasePath,
                options.archiveBasePath,
            )

            fs.existsSync(this.getHtmlPathFromPermalink(permalink)) &&
                this.pages.push({
                    plugin: options,
                    pageType: 'archive',
                    data: { permalink: permalink },
                    permalink,
                })
        }

        {
            Object.entries(blogTags).forEach(([, value]) => {
                const pages = Array.isArray(value?.pages) ? value.pages : []

                pages.forEach((page) => {
                    const permalink = page?.metadata?.permalink

                    if (typeof permalink !== 'string' || !permalink) {
                        return
                    }

                    this.pages.push({
                        pageType: 'tag',
                        plugin: options,
                        data: { ...page.metadata, label: value.label },
                        permalink,
                    })
                })
            })
        }
    }
}