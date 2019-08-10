import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import {
    ApplicationShell,
    CompositeTreeNode,
    ContextMenuRenderer,
    OpenerService,
    NodeProps,
    TreeModel,
    TreeNode,
    TreeProps,
    TreeWidget
} from "@theia/core/lib/browser";
import { open } from '@theia/core/lib/browser/opener-service';
import { SelectableTreeNode, WidgetManager } from '@theia/core/lib/browser';
import URI from "@theia/core/lib/common/uri";
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileNavigatorWidget, FILE_NAVIGATOR_ID } from '@theia/navigator/lib/browser';
import { PageOpenerOptions, PageService } from "./page-service";
import { PageNode } from "./page-tree-impl";
import { PageCommands } from "./page-commands";
import { PageCommandService } from "./page-command-service";
import ICommand = PageCommands.ICommand;

import './style.css';

export const PAGE_SCHEMA = 'recore-page';
export const RECORE_PAGE_WIDGET_ID = 'recore-page';
export const LABEL = 'Pages';

@injectable()
export class PageWidget extends TreeWidget {
    @inject(PageService)
    protected readonly pageService: PageService;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(PageCommandService)
    protected readonly pageCommandService: PageCommandService;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService;

    constructor(
        @inject(TreeProps) protected readonly treeProps: TreeProps,
        @inject(TreeModel) public readonly model: TreeModel,
        @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer,
    ) {
        super(treeProps, model, contextMenuRenderer);

        this.id = RECORE_PAGE_WIDGET_ID;
        this.title.label = LABEL;
        this.title.caption = LABEL;

        this.title.iconClass = 'recore-icon';
        this.addClass('recore-page');

        // 需要在 div 标签上增加 tabindex 属性，focus 事件才能被触发
        // focustracker.js 中会处理这个事件
        this.node.tabIndex = 0;
    }

    @postConstruct()
    protected async init() {
        super.init();
        this.model.root = {
            id: 'recore-page-root',
            name: 'Pages',
            visible: false,
            children: [],
            parent: undefined
        } as CompositeTreeNode;

        this.model.onOpenNode((node: Readonly<TreeNode>) => {
            const uri = node.id.replace(/^file/, PAGE_SCHEMA);
            open(this.openerService, new URI(uri), {
                name: node.name,
                files: (node as PageNode).files,
            } as PageOpenerOptions);
        });

        // 监听 Page Service 发出的页面变化事件
        // 通知 model 重新刷新
        this.pageService.onPagesChanged(() => this.model.refresh());

        this.pageCommandService.onExecute((command: ICommand) => this.handleCommandExecute(command));

        // 切换标签高亮目前选中的页面节点
        this.shell.currentChanged.connect((sender, args) => {
            const newValue = args.newValue as any;
            if (newValue && newValue.uri) {
                const uri = newValue.uri;
                const path = uri.path.toString();
                if (path.endsWith('.vx')) {
                    const node = this.model.getNode('file://' + path);
                    if (node) {
                        this.model.selectNode(node as Readonly<SelectableTreeNode>);
                    }
                }
            }
        });
    }

    private async handleCommandExecute (command: ICommand) {
        const fileWidget = this.widgetManager.tryGetWidget('files') as FileNavigatorWidget;

        if (!fileWidget) return;

        this.shell.activateWidget(FILE_NAVIGATOR_ID);

        const node = this.model.selectedNodes[0];
        if (node) {
            console.log(node);
            const uri = this.createURI(node as PageNode, command);
            if (uri) {
                const fileModel = fileWidget.model;
                const fileNode = await fileModel.revealFile(uri);
                if (fileNode) {
                    fileModel.selectNode(fileNode as Readonly<SelectableTreeNode>);
                    fileModel.openNode(fileNode);
                }
            }
        }
    }

    private createURI(node: PageNode, command: ICommand): URI|undefined {
        const workspace = this.workspaceService.workspace;

        if (!workspace) {
            console.warn('[Page] invalid workspace');
            return;
        }

        let uri;

        switch (command) {
            case PageCommands.JUMP_VX:
                uri = node.id;
                break;
            case PageCommands.JUMP_CTRL:
                uri = `file:///src/pages/${node.name}/${node.files.ctrl}`;
                break;
            case PageCommands.JUMP_STYLE:
                uri = `file:///src/pages/${node.name}/${node.files.style}`;
                break;
        }
        if (uri) {
            return new URI(uri.replace('file://', `${workspace.uri}`));
        }

        return;
    }

    protected renderIcon(node: TreeNode, props: NodeProps): React.ReactNode {
        // 之前使用的是 h.Child，产出 VirtualDOM。React 不支持
        // 现在可以直接返回 ReactNode
        return <div className={`${node.icon} file-icon`} />;
    }

    protected handleDblClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        event.stopPropagation();
    }

    protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        super.handleClickEvent(node, event);
        if (!this.hasCtrlCmdMask(event) && !this.hasShiftMask(event)) {
            this.model.openNode(node);
        }
    }
}
