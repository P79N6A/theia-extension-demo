import { inject, injectable, postConstruct } from 'inversify';
import { Disposable, Event } from "@theia/core";
import { DisposableCollection, Emitter } from "@theia/core/lib/common";
import { ApplicationShell, FocusTracker, Widget, OpenerOptions } from "@theia/core/lib/browser";
import { PageWidget } from "./page-widget";
import { PageNode } from "./page-tree-impl";
import { SocketProvider } from "../socket-provider";
import { RecoreFSService } from '../edtior-services/recore-fs-service';

export interface IPage {
  name: string;
  files: {
    vx: string | null,
    style: string | null,
    ctrl: string | null,
    [key: string]: string | null,
  };
}

export interface PageOpenerOptions extends OpenerOptions {
  name: IPage["name"];
  files: IPage["files"];
}


@injectable()
export class PageService implements Disposable {
  @inject(RecoreFSService)
  protected readonly fs: RecoreFSService
  get pages(): IPage[] {
    return this._pages;
  }

  protected readonly toDispose = new DisposableCollection();

  /**
   * 内部页面容器
   */
  private _pages: IPage[] = [];

  /**
   * 页面变化信道
   */
  public readonly onPagesEmitter = new Emitter<IPage[]>();

  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;

  @inject(SocketProvider)
  protected readonly socketProvider: SocketProvider;

  @postConstruct()
  protected async init() {
    if (!this.fs.isRecore()) {
      return;
    }

    const socket = this.socketProvider.create();

    this.toDispose.push(this.onPagesEmitter);
    // this.toDispose.push(Disposable.create(() => {
    //     socket.close();
    // }));

    socket.on('pages.change', (pkg: { error: string | null, data: any }) => {
      const { error: err, data } = pkg;
      if (err) {
        throw new Error(err);
      }

      this.fire(data);
    });

    // 切换标签时，发送文件监听和编译命令
    this.shell.currentChanged.connect((sender, args: FocusTracker.IChangedArgs<Widget>) => {
      const newValue = args.newValue as PageWidget;
      if (newValue && newValue.id === 'recore-page') {
        const selectedNode = newValue.model.selectedNodes[0] as PageNode;

        if (!selectedNode) return;

        const uri = selectedNode.id;
        const path = uri.toString();
        if (path.endsWith('.vx')) {
          // TODO: 这里不能直接使用 socket，后期维护麻烦
          // 需要将这部分代码抽离
          const FS_WATCH_ID = 'fs.watch';
          socket.emit(`${FS_WATCH_ID}.watch`, path);

          const CTRL_COMPILE_ID = 'compile.vision-ctrl';
          const page = {
            name: selectedNode.name,
            files: selectedNode.files,
          } as IPage;
          socket.emit(`${CTRL_COMPILE_ID}.open`, {
            style: this.getFilePath(page, page.files.style),
            ctrl: this.getFilePath(page, page.files.ctrl),
          });
        }
      }
    });
  }

  // public find(name: string): IPage|undefined {
  //     return this._pages.find(p => p.name === name);
  // }
  //
  // public getName(uri: URI): string {
  //     const { path } = uri;
  //     const reqPath = path.toString();
  //     const a: string[] = reqPath.split('/');
  //     a.pop();
  //     return a.slice(a.indexOf('pages') + 1).join('/');
  // }

  public getFilePath(page: IPage, file: string | null) {
    if (file) {
      return `src/pages/${page.name}/${file}`;
    }
  }

  get onPagesChanged(): Event<IPage[]> {
    return this.onPagesEmitter.event;
  }

  public fire(pages: IPage[]) {
    this._pages = pages;
    this.onPagesEmitter.fire(pages);
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}
