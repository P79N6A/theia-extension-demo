import { injectable, inject } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { CommandRegistry, MenuModelRegistry } from '@theia/core/lib/common';
import { PageCommands, PageContextMenu } from './page-commands';
import { PageWidget, RECORE_PAGE_WIDGET_ID } from './page-widget';
import { PageCommandService } from "./page-command-service";
import { PageNode } from "./page-tree-impl";

@injectable()
export class PageContribution extends AbstractViewContribution<PageWidget> implements FrontendApplicationContribution {

    @inject(PageCommandService)
    protected readonly pageCommandService: PageCommandService;

    constructor() {
        super({
            widgetId: RECORE_PAGE_WIDGET_ID,
            widgetName: 'Recore Page',
            defaultWidgetOptions: {
                area: 'left',
                rank: 150
            },
            toggleCommandId: 'recore-page:toggle',
        });
    }

    async initializeLayout() {
        await this.openView({ activate: true });
    }

    // 注册命令
    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);

        registry.registerCommand(PageCommands.JUMP_VX, {
            execute:  () => {
                this.pageCommandService.execute(PageCommands.JUMP_VX);
            },
            isVisible: () => this.isVisible((node: PageNode) => !!node.files.vx),
        });

        registry.registerCommand(PageCommands.JUMP_CTRL, {
            execute:  () => {
                this.pageCommandService.execute(PageCommands.JUMP_CTRL);
            },
            isVisible: () => this.isVisible((node: PageNode) => !!node.files.ctrl),
        });

        registry.registerCommand(PageCommands.JUMP_STYLE, {
            execute:  () => {
                this.pageCommandService.execute(PageCommands.JUMP_STYLE);
            },
            isVisible: () => this.isVisible((node: PageNode) => !!node.files.style),
        });
    }

    // 点击右键显示菜单
    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);

        registry.registerMenuAction(PageContextMenu.JUMP_VX, {
            commandId: PageCommands.JUMP_VX.id,
            label: PageCommands.JUMP_VX.label
        });
        registry.registerMenuAction(PageContextMenu.JUMP_CTRL, {
            commandId: PageCommands.JUMP_CTRL.id,
            label: PageCommands.JUMP_CTRL.label
        });
        registry.registerMenuAction(PageContextMenu.JUMP_STYLE, {
            commandId: PageCommands.JUMP_STYLE.id,
            label: PageCommands.JUMP_STYLE.label
        });
    }

    private isVisible (predicate: (node: PageNode) => boolean) {
        const widget = this.tryGetWidget() as PageWidget;
        if (widget) {
            const node = widget.model.selectedNodes[0] as PageNode;
            if (node) {
                return predicate(node);
            }
        }
        return false;
    }
}
