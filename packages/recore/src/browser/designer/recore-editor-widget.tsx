import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { Widget, Message } from '@theia/core/lib/browser';
import URI from "@theia/core/lib/common/uri";
import { IPage } from "../page";
import { Designer } from "./designer";
const debounce = require('lodash.debounce');
import { SocketProvider } from "../socket-provider";
import { RecoreFSService } from '../edtior-services/recore-fs-service';
import { RecoreLSService } from "../edtior-services/recore-ls-service";
import './style.css';

export const RECORE_EDITOR_WIDGET_ID = 'recore-editor';

@injectable()
export class RecoreEditorWidget extends ReactWidget {

  /**
   * 打开页面的名称
   */
  private _name: IPage["name"];
  set name(value: string) {
    this._name = value;
    this.title.label = value;
  }
  get name() {
    return this._name;
  }

  /**
   * 打开页面的文件地址
   * 是相对地址，比如 recore-page:///src/pages/home/index.vx
   */
  private _uri: URI;
  get uri(): URI {
    return this._uri;
  }
  set uri(value: URI) {
    this._uri = value;
    this.id = RECORE_EDITOR_WIDGET_ID + '::' + value.toString();
  }

  /**
   * 打开页面包含的视图、控制器、样式文件
   */
  private _files: IPage["files"];
  get files() {
    return this._files;
  }
  set files(value) {
    this._files = value;
  }

  private ref = React.createRef<Designer>();

  @inject(SocketProvider)
  protected readonly socketProvider: SocketProvider;

  @inject(RecoreFSService)
  protected readonly fs: RecoreFSService

  @inject(RecoreLSService)
  protected readonly rls: RecoreLSService;

  constructor() {
    super();
    this.id = RECORE_EDITOR_WIDGET_ID;
    this.title.iconClass = "vx-icon file-icon";
    this.title.closable = true;
    this.addClass('ide-recore-editor');

    this.node.tabIndex = 0;
  }

  @postConstruct()
  protected async init() {
    if (!this.fs.isRecore()) {
      return;
    }

    // update 控制 render 执行时机
    this.update();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this.ignorePointerEvents();
    this.move();
  }

  protected onActivateRequest(msg: Message) {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  render() {
    const page = {
      name: this.name,
      files: this.files,
    };

    // @ts-ignore
    return <Designer
      name={this.name}
      id={this.id}
      page={page}
      socketProvider={this.socketProvider}
      ref={this.ref}
      fs={this.fs}
      rls={this.rls}
    />;
  }

  private ignorePointerEvents = debounce(() => {
    const elt = this.ref.current;
    if (elt) {
      const iframe = elt.ref.current;
      if (iframe && !iframe.style.pointerEvents) {
        iframe.style.pointerEvents = 'none';
      }
    }
  }, 16);

  private restorePointerEvents() {
    const elt = this.ref.current;
    if (elt) {
      const iframe = elt.ref.current;
      if (iframe) {
        iframe.style.pointerEvents = null;
      }
    }
  };

  private timer: NodeJS.Timer | null = null;
  private move = debounce(() => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.restorePointerEvents();
      this.timer = null;
    }, 500);
  }, 250);
}
