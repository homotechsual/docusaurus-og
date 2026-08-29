import { LoadedPlugin, Props } from '@docusaurus/types';
import { ImageGenerator } from '../imageGenerator';
import { DocsPageData } from '../types/docs.types';
import { ImageRenderer } from '../types/image.types';
import { PluginOptions } from '../types/plugin.types';
import { BasePlugin } from './base.plugin';
import { WriteQueue } from '../writeQueue';
type DocsPageItem = Omit<DocsPageData, 'document'>;
export declare class DocsPlugin extends BasePlugin<DocsPageItem> {
    static readonly plugin = "docusaurus-plugin-content-docs";
    protected pluginName: string;
    protected pageType: string;
    constructor(context: Props, options: PluginOptions, imageGenerator: ImageGenerator, imageRenderer: ImageRenderer, writeQueue: WriteQueue);
    protected getPagePermalink(page: DocsPageItem): string;
    protected getPageHtmlPath(doc: DocsPageItem): string | undefined;
    protected loadInstance: (plugin: LoadedPlugin) => Promise<void>;
    private loadVersion;
    /**
     * The standard docs content loader (`loadVersion`) only sees pages the
     * docs plugin itself generated from source files. Some routes under the
     * docs base path (e.g. pages added by other plugins/swizzled components)
     * never show up there, so we walk the built output directory for any
     * `index.html` under the docs route that isn't already accounted for,
     * and backfill minimal metadata for it by scraping the built HTML the
     * same way `Document` reads title/description elsewhere in this plugin.
     */
    private loadDiscoveredHtmlPages;
    private findIndexFiles;
    private getPermalinkFromHtml;
    private extractMetadataFromHtml;
    private decodeHtml;
}
export {};
