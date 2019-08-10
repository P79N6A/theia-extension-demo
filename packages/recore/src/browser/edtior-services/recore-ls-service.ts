import { injectable, inject } from 'inversify';
import { TypeScriptClientContribution } from '@theia/typescript/lib/browser/typescript-client-contribution';
import {
  CompletionRequest,
  CompletionResolveRequest,
  DefinitionRequest,
} from '@theia/languages/lib/browser';
import * as lsp from 'vscode-languageserver';
import { EditorManager } from '@theia/editor/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { TextEditor } from '@theia/editor/lib/browser/editor';
// import { ResourceProvider } from '@theia/core';
import { isBuildinCtrlMethodsOrProps, genLSPParams, fixUri, isBasicDataType } from './utils'
import { RecoreServer } from '../../common/recore-server';

const RLCSuffix = '/.recore/rlc.ts';

export interface TSCompletionItem extends lsp.CompletionItem {
  data: {
    entryNames: (string | CompletionEntryIdentifier)[];
    line: number;
    offset: number;
  }
}

interface CompletionEntryIdentifier {
  name: string;
  source?: string;
}

enum RequestType {
  Completion = 1,
  Definition = 2,
}

export enum BindRegion {
  Context = 'Context',
  Controller = 'Controller',
  Utils = 'Utils'
}

@injectable()
export class RecoreLSService {
  @inject(WorkspaceService)
  protected readonly wsService: WorkspaceService;

  @inject(TypeScriptClientContribution)
  protected readonly clientContribution: TypeScriptClientContribution;

  @inject(EditorManager)
  protected readonly editorManager: EditorManager;

  @inject(RecoreServer)
  protected readonly server: RecoreServer;

  // @inject(ResourceProvider)
  // protected readonly resourceProvider: ResourceProvider;

  private editors = new Map();

  // 存储补全结果
  private completionStore = new Map();

  private rlcUri: string = '';

  private ctrlUri: string = '';

  private currentRegion: string;

  // bootstrap.ts文件
  // private bsUri: string = '';

  protected client: any;

  async init(ctrlUri: string = '') {
    // 获取语言客户端
    if (!this.clientContribution) {
      return;
    }
    this.client = await this.clientContribution.languageClient;

    // 初始化proj/.recore/rlc.ts文件
    const workspace = this.wsService.workspace;
    if (!workspace) {
      return;
    }
    // ./recore/rlc.ts路径
    this.rlcUri = workspace.uri + RLCSuffix;
    // 当前页面controller的路径
    this.ctrlUri = workspace.uri + '/src/pages/' + ctrlUri;
    // this.bsUri = root.uri + 'src/bootstrap.ts';

    await this.server.ensureFile(fixUri(this.rlcUri, 'none'));

    // 仅创建不打开
    const editor = await this.getEditor(this.rlcUri);
    if (!editor) {
      return;
    }
    const { lineCount } = editor.document;
    editor.executeEdits([{
      range: {
        start: { line: 0, character: 0 },
        end: { line: lineCount, character: editor.document.getLineMaxColumn(lineCount) }
      },
      newText: `import Page from '${fixUri(this.ctrlUri, 'none')}';\n`
    }]);

    this.completionStore.clear();
  }

  async completion(word: string, region: BindRegion): Promise<TSCompletionItem[] | undefined> {

    const resolve = await this.completionResolve(word, region);
    if (resolve && (!resolve.detail || isBasicDataType(resolve.detail, region !== word))) {
      return;
    }

    const pos = await this.mockEdit(this.rlcUri, word, region, RequestType.Completion);
    if (!pos) {
      return;
    }

    const parmas = genLSPParams(this.rlcUri, pos);
    const result = await this._completion(parmas);

    // 保存结果
    const key = `${region}.${word}`;
    this.completionStore.set(key, result);

    return result;
  }

  async completionResolve(word: string, region: BindRegion): Promise<lsp.CompletionItem | undefined> {
    const group = word.split('.');
    if (group[0] === '') {
      return;
    }
    const label = group.pop();
    const ctx = group.length > 1 ? group.concat('.') : group[0] || '';
    const cache = this.completionStore.get(`${region}.${ctx}`);
    if (!cache) {
      return;
    }
    const completionItem = cache.find((item: TSCompletionItem) => item.label === label);
    if (!completionItem) {
      return;
    }
    const resolve = await this._completionResolve(completionItem);
    return resolve;
  }

  // 跳转定义
  async definition(word: string, region: BindRegion): Promise<void> {
    if (!this.client) {
      return;
    }

    const pos = await this.mockEdit(this.rlcUri, word, region, RequestType.Definition);
    if (!pos) {
      return;
    }
    const params = genLSPParams(this.rlcUri, pos);
    const res = await this.client.sendRequest(DefinitionRequest.type, params);
    const editor = await this.getEditor(res[0].uri);
    if (!editor) {
      return;
    }

    try {
      editor.cursor = res[0].range.start;
      editor.revealRange(res[0].range);
    } catch (e) {
      throw (e);
    }
  }

  // 添加动作并跳转
  async addAction(action: string): Promise<void> {
    const editor = await this.getEditor(this.ctrlUri);
    if (!editor) {
      return;
    }

    const { lineCount } = editor.document;
    // @ts-ignore
    const code = editor.document.model.getValue();
    const isEndWithNewLine = code.endsWith('\n');
    editor.executeEdits([{
      range: {
        start: {
          line: isEndWithNewLine ? lineCount - 3 : lineCount - 2,
          character: isEndWithNewLine ? 3 : 4
        },
        end: {
          line: isEndWithNewLine ? lineCount - 3 : lineCount - 2,
          character: isEndWithNewLine ? 3 : 4
        },
      },
      newText: `\n\n  ${action}() {\n    \n  }`
    }]);
    editor.cursor = {
      line: isEndWithNewLine ? lineCount : lineCount + 1,
      character: 5
    };
    editor.revealRange({
      start: {
        line: isEndWithNewLine ? lineCount : lineCount + 1,
        character: 5
      },
      end: {
        line: isEndWithNewLine ? lineCount : lineCount + 1,
        character: 5
      }
    });
  }

  // 获取页面下的类名
  async getClassNames() {
  }

  private async _completion(params: lsp.CompletionParams): Promise<TSCompletionItem[] | undefined> {
    if (!this.client) {
      return;
    }
    const result = await this.client.sendRequest(CompletionRequest.type, params);
    return result.filter((item: any) => !isBuildinCtrlMethodsOrProps(item));
  }

  private async _completionResolve(item: TSCompletionItem): Promise<lsp.CompletionItem | undefined> {
    if (!this.client) {
      return;
    }
    const result = await this.client.sendRequest(CompletionResolveRequest.type, item);
    return result;
  }

  // async getHelpers() {
  //   // AST分析
  //   // // 1. 获取全局helpers
  //   // const bsProvider = await this.resourceProvider(new URI(fixUri(this.bsUri, 'scheme')));
  //   // const bsText = await bsProvider.readContents();
  //   // const bsAST = myParse(bsText);
  //   // const globalHelpers = getHelpersFromBootstrap(bsAST);

  //   // // 2. 获取局部helpers
  //   // const ctrlProvider = await this.resourceProvider(new URI(fixUri(this.ctrlUri, 'scheme')));
  //   // const ctrlText = await ctrlProvider.readContents();
  //   // const ctrlAST = myParse(ctrlText);
  //   // const ctrlHelpers = getHelpersFromCtrl(ctrlAST);

  //   // return _.uniq([...globalHelpers, ctrlHelpers]);


  //   // 1. 获取局部helpers
  // }

  private async getEditor(path: string, isOpen: boolean = false): Promise<TextEditor | undefined> {
    const _path = fixUri(path, 'file');
    const editorCache = this.editors.get(_path);
    if (editorCache) {
      return editorCache;
    }
    const uri = new URI(_path);
    let editorWidget = await this.editorManager.getByUri(uri);
    // 若没有则创建
    if (!editorWidget) {
      editorWidget = isOpen ? await this.editorManager.open(uri)
        : await this.editorManager.getOrCreateByUri(uri);
    }
    if (editorWidget) {
      this.editors.set(_path, editorWidget.editor);
      return editorWidget.editor;
    } else {
      return undefined
    }
  }

  /**
   *
   * 模拟编辑
   * 1.替换
   * 2.计算位置
   * 3.返回光标
   * @private
   * @param {string} uri 编辑的文件uri
   * @param {string} word 需要输入的词组，例如，.user.name
   * @returns {(Promise<lsp.Position | undefined>)}
   * @memberof RecoreLSService
   */
  private async mockEdit(uri: string, input: string, region: BindRegion, reqType: RequestType): Promise<lsp.Position | undefined> {
    const editor = await this.getEditor(uri);
    if (!editor) {
      return;
    }

    const { lineCount } = editor.document;
    const triggerCharacter = '.';
    const prefix = (region: BindRegion) => {
      switch (region) {
        case BindRegion.Controller:
          return '(new Page()).';
        case BindRegion.Utils:
          return 'Page.helpers.';
        default:
          return `(new Page()).${region}`
      }
    };
    // if (isContext(region)) {
    //   input += '[0]';
    // }
    let newText;
    let startCharacter = 0;
    // 域变化
    if (this.currentRegion !== region) {
      this.currentRegion = region;
      newText = prefix(region) + input + (reqType === RequestType.Completion && input ? triggerCharacter : '');
    } else {
      newText = input + (reqType === RequestType.Completion && input ? triggerCharacter : '');
      startCharacter = editor.document.getLineMaxColumn(lineCount);
    }
    if (!newText) {
      return;
    }
    editor.executeEdits([{
      range: {
        start: { line: 1, character: startCharacter },
        end: { line: 1, character: editor.document.getLineMaxColumn(lineCount) }
      },
      newText
    }]);
    return {
      line: 1,
      character: startCharacter + newText.length
    };
  }
}
