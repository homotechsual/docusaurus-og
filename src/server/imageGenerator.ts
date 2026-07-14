import * as fs from 'fs'
import * as fsp from 'fs/promises'
import hashObj from 'object-hash'
import path from 'path'
import React from 'react'
import logger from '@docusaurus/logger'

import type Satori from 'satori'
import { type SatoriOptions } from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { WriteQueue } from './writeQueue'


export type ImageGeneratorOptions = SatoriOptions
export type ImageGeneratorResult = {
    url: string
    relativePath: string
    absolutePath: string
}

const UNSUPPORTED_STYLE_PROPS = new Set(['zindex'])

export class ImageGenerator {
    private satori: typeof Satori
    private siteCache: Set<string> = new Set()
    private runCache: Set<string> = new Set()
    private writeQueue = new WriteQueue()

    private outDir: string = ''
    private cacheDir: string = ''

    constructor(
        private args: {
            dir: string
            websiteUrl: string
            websiteOutDir: string
            pluginDir: string
            currentLocale: string
        },
    ) {
        this.outDir = path.join(this.args.websiteOutDir, this.args.dir)
        this.cacheDir = path.join(this.args.pluginDir, this.args.currentLocale, 'cache')
    }

    public init = async () => {
        this.satori = await import('satori').then((mod) => mod.default)

        if (!fs.existsSync(this.outDir))
            await fsp.mkdir(this.outDir, { recursive: true })

        if (!fs.existsSync(this.cacheDir)) {
            await fsp.mkdir(this.cacheDir, { recursive: true })
        } else {
            const siteCacheFiles = await fsp.readdir(this.cacheDir)
            siteCacheFiles.forEach((file) => {
                if (file.endsWith('.png')) {
                    const hash = path.basename(file, '.png')
                    this.siteCache.add(hash)
                }
            })
        }

        const runCacheFiles = await fsp.readdir(this.outDir)
        runCacheFiles.forEach((file) => {
            if (file.endsWith('.png')) {
                const hash = path.basename(file, '.png')
                this.runCache.add(hash)
            }
        })
    }

    public generate = async (
        element: React.ReactNode,
        options: ImageGeneratorOptions,
    ): Promise<ImageGeneratorResult> => {
        const sanitizedElement = sanitizeSatoriNode(element)

        if (!isRenderableSatoriNode(sanitizedElement)) {
            throw new Error('Renderer returned an unsupported root node for Satori')
        }

        const hash = hashObj([sanitizedElement, options])

        const imageName = `${hash}.png`
        const absolutePath = path.join(this.outDir, imageName)
        const relativePath = path.join(
            '/',
            this.args.dir,
            absolutePath.slice(this.outDir.length),
        )
        const url = new URL(this.args.websiteUrl)
        url.pathname = relativePath

        const result = {
            relativePath,
            absolutePath,
            url: url.toString(),
        }

        if (this.runCache.has(hash)) {
            return result
        }

        const cachePath = path.join(this.cacheDir, imageName)

        if (this.siteCache.has(hash)) {
            this.writeQueue.addCopy(cachePath, absolutePath)
            this.runCache.add(hash)
            return result
        }

        const svg = await this.satori(sanitizedElement, options)
        const pngBuffer = new Resvg(svg).render().asPng()
        this.writeQueue.addWrite(absolutePath, pngBuffer)
        
        this.writeQueue.addWrite(cachePath, pngBuffer)
        this.runCache.add(hash)

        return result
    }

    public cleanup = async () => {
        await this.writeQueue.waitForIdle()
        const files = await fsp.readdir(this.cacheDir)
        for (const file of files) {
            if (file.endsWith('.png') && !this.runCache.has(path.basename(file, '.png'))) {
                await fsp.unlink(path.join(this.cacheDir, file))
                this.siteCache.delete(path.basename(file, '.png'))
            }
        }
    }
}

function sanitizeSatoriNode(node: React.ReactNode): React.ReactNode {
    if (Array.isArray(node)) {
        let changed = false
        const sanitizedNodes = node.map((child) => {
            const sanitizedChild = sanitizeSatoriNode(child)
            changed = changed || sanitizedChild !== child
            return sanitizedChild
        })

        return changed ? sanitizedNodes : node
    }

    if (
        node === null ||
        node === undefined ||
        typeof node === 'boolean' ||
        typeof node === 'string' ||
        typeof node === 'number'
    ) {
        return node
    }

    if (!React.isValidElement(node)) {
        logger.warn(
            `Dropping unsupported Satori node: ${getNodeDebugValue(node)}`,
        )
        return null
    }

    const sanitizedStyle = sanitizeStyle(node.props.style)
    const originalChildren = node.props.children
    const sanitizedChildren = sanitizeSatoriNode(originalChildren)
    const styleChanged = sanitizedStyle !== node.props.style
    const childrenChanged = sanitizedChildren !== originalChildren

    if (!styleChanged && !childrenChanged) {
        return node
    }

    const nextProps = styleChanged ? { style: sanitizedStyle } : undefined

    return childrenChanged
        ? React.cloneElement(node, nextProps, sanitizedChildren)
        : React.cloneElement(node, nextProps)
}

function sanitizeStyle(
    style: React.CSSProperties | undefined,
): React.CSSProperties | undefined {
    if (!style) {
        return style
    }

    let changed = false
    const sanitizedStyle: Record<string, unknown> = {}

    Object.entries(style).forEach(([key, value]) => {
        if (UNSUPPORTED_STYLE_PROPS.has(normalizeStylePropName(key))) {
            changed = true
            return
        }

        sanitizedStyle[key] = value
    })

    return changed ? (sanitizedStyle as React.CSSProperties) : style
}

function normalizeStylePropName(key: string): string {
    return key.replace(/-/g, '').toLowerCase()
}

function isRenderableSatoriNode(node: React.ReactNode): boolean {
    return !(node === null || node === undefined || typeof node === 'boolean')
}

function getNodeDebugValue(node: unknown): string {
    if (typeof node === 'function') {
        return `function ${node.name || '(anonymous)'}`
    }

    if (typeof node === 'object') {
        return Object.prototype.toString.call(node)
    }

    return String(node)
}
