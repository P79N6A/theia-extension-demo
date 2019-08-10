import { ContainerModule, interfaces } from 'inversify';
import { bindViewContribution, OpenHandler } from '@theia/core/lib/browser';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { PageWidget, RECORE_PAGE_WIDGET_ID } from './page/page-widget';
import { createPageTreeWidget } from "./page/page-container";
import { PageContribution } from "./page/page-contribution";
import { PageService } from "./page/page-service";
import { PageCommandService } from "./page/page-command-service";
import { FrontendApplicationContribution } from "@theia/core/lib/browser";
import { LabelProviderContribution } from '@theia/core/lib/browser/label-provider';
import { CommandContribution } from '@theia/core/lib/common';
import { KeybindingContribution, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { FCDefaultUriLabelProviderContribution } from './vx-icon/label-provider';
import { WorkspaceUriLabelProviderContribution as FcWorkspaceUriLabelProviderContribution } from "./vx-icon/workspace-uri-contribution";
import { EditorOpenerHandler, RecoreEditorWidgetOptions } from "./designer";
import { RECORE_EDITOR_WIDGET_ID, RecoreEditorWidget } from "./designer/recore-editor-widget";
import URI from "@theia/core/lib/common/uri";
// import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { RecoreSocketProvider, SocketProvider } from "./socket-provider";
import { RecoreFSService } from './edtior-services/recore-fs-service';
import { RecoreContribution } from './edtior-services/recore-contribution';
import { RecoreLSService } from './edtior-services/recore-ls-service';
import { RecoreServer, RecoreServerPath } from '../common/recore-server';
import './vx-icon/index.css';

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
  bind(SocketProvider).to(RecoreSocketProvider).inSingletonScope();

  bind(RecoreServer).toDynamicValue(({ container }) =>
    WebSocketConnectionProvider.createProxy(container, RecoreServerPath)
  ).inSingletonScope();

  // page
  bind(PageService).toSelf().inSingletonScope();
  bind(PageCommandService).toSelf().inSingletonScope();

  bind(RecoreFSService).toSelf().inSingletonScope();

  bindViewContribution(bind, PageContribution);
  bind(FrontendApplicationContribution).toService(PageContribution);

  bind(PageWidget).toDynamicValue(ctx =>
    createPageTreeWidget(ctx.container)
  );
  bind(WidgetFactory).toDynamicValue(context => ({
    id: RECORE_PAGE_WIDGET_ID,
    createWidget: () => {
      return context.container.get<PageWidget>(PageWidget);
    }
  }));

  // editor
  bind(EditorOpenerHandler).toSelf().inSingletonScope();
  bind(OpenHandler).toService(EditorOpenerHandler);

  bind(RecoreEditorWidget).toSelf();
  bind(WidgetFactory).toDynamicValue(context => ({
    id: RECORE_EDITOR_WIDGET_ID,
    createWidget: (options: RecoreEditorWidgetOptions) => {
      const editor = context.container.get<RecoreEditorWidget>(RecoreEditorWidget);
      const codeUri = (options.uri as any).codeUri;
      editor.uri = new URI(`${codeUri.scheme}://${codeUri.path}`);
      editor.name = options.name;
      editor.files = options.files;
      return editor;
    }
  }));
  // bindViewContribution(bind, EditorContribution);

  bind(LabelProviderContribution).to(FCDefaultUriLabelProviderContribution).inSingletonScope();
  bind(LabelProviderContribution).to(FcWorkspaceUriLabelProviderContribution).inSingletonScope();

  bind(RecoreContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(RecoreContribution);
  bind(CommandContribution).toService(RecoreContribution);
  bind(KeybindingContribution).toService(RecoreContribution);

  bind(RecoreLSService).toSelf().inSingletonScope();
});

