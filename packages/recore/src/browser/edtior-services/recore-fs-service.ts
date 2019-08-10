import { injectable, inject } from 'inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { CommandRegistry } from '@theia/core/lib/common';
import { CommonCommands } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileSystem } from '@theia/filesystem/lib/common';

@injectable()
export class RecoreFSService {
  @inject(EditorManager)
  protected readonly editorManager: EditorManager;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(FileSystem)
  protected readonly fileSystem: FileSystem;
  
  @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry;


  async write(data: string, uri: string): Promise<boolean> {
    const editorWidget = await this.editorManager.getByUri(new URI(uri));
    if (!editorWidget) {
      return false;
    }

    try {
      const lineCount = editorWidget.editor.document.lineCount;
      const isSuccess = editorWidget.editor.executeEdits([{
        range: {
          start: { line: 0, character: 0 },
          end: { line: lineCount + 1, character: 0 }
        },
        newText: data
      }]);
      await this.commandRegistry.executeCommand(CommonCommands.SAVE.id);
      return isSuccess;
    } catch (e) {
      return false;
    }
    return false;
  }

  /**
     * 判断是否是 Recore 项目
     * 根据是否存在 recore.config.js 文件
     */
  async isRecore(): Promise<boolean> {
    const workspace = this.workspaceService.workspace;
    if (workspace) {
      return this.fileSystem.exists(`${workspace.uri}/recore.config.js`);
    }

    return false;
  }
}
