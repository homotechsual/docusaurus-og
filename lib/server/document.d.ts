import { HTMLElement } from 'node-html-parser';
import { WriteQueue } from './writeQueue';
export declare class Document {
    private path;
    private writeQueue;
    root: HTMLElement;
    loaded: boolean;
    private originalHtml;
    private dirty;
    constructor(path: string, writeQueue: WriteQueue);
    load: () => Promise<void>;
    write: () => Promise<void>;
    setImage: (url: string) => Promise<void>;
    get head(): HTMLElement;
    private getMeta;
    private updateMeta;
    private serializeHtml;
}
