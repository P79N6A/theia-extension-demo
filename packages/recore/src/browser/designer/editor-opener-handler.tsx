import { injectable } from 'inversify';
import { MaybePromise } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { WidgetOpenerOptions, WidgetOpenHandler } from '@theia/core/lib/browser';
import { RecoreEditorWidget, RECORE_EDITOR_WIDGET_ID } from "./recore-editor-widget";
import { PageOpenerOptions } from "../page";

export const PAGE_SCHEMA = 'recore-page';

export interface RecoreEditorWidgetOptions extends WidgetOpenerOptions, PageOpenerOptions {
    uri: URI;
}

@injectable()
export class EditorOpenerHandler extends WidgetOpenHandler<RecoreEditorWidget> {
    public readonly id = RECORE_EDITOR_WIDGET_ID;

    canHandle(uri: URI, options?: WidgetOpenerOptions): MaybePromise<number> {
        if (uri.scheme === PAGE_SCHEMA) {
            return 500;
        }
        return 0;
    }

    protected createWidgetOptions(uri: URI, options: WidgetOpenerOptions): RecoreEditorWidgetOptions {
        const { name, files } = options as PageOpenerOptions;
        return {
            name,
            files,
            uri,
        };
    }

    // async open(uri: URI, options?: WidgetOpenerOptions): Promise<RecoreEditorWidget> {
    //     const widget = await super.open(uri, options);
    //     return widget;
    // }
}
