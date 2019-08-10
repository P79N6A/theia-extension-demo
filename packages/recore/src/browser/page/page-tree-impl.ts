import { injectable, inject } from 'inversify';
import { TreeImpl, TreeNode, CompositeTreeNode, SelectableTreeNode, LabelProvider } from '@theia/core/lib/browser';
import { IPage, PageService } from "./page-service";

export interface PageNode extends SelectableTreeNode {
    files: IPage["files"]
}

@injectable()
export class PageTreeImpl extends TreeImpl {
    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(PageService)
    protected readonly pageService: PageService;

    /**
     * 渲染页面节点
     */
    async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
        // 这里获取节点
        const pages = this.pageService.pages;

        if (pages.length === 0) {
            return [];
        }

        return this.toNodes(pages, parent);
    }

    protected toNodes(pages: IPage[], parent: CompositeTreeNode): TreeNode[] {
        const result = pages.map(page => this.toNode(page, parent));
        return result.sort((a: any, b: any) => a.name - b.name);
    }

    protected toNode(page: IPage, parent: CompositeTreeNode): TreeNode {
        // const a1 = <PageNode>{
        //     id: '1',
        //     icon: `fas fa-laptop`,
        //     name: 'aaaa',
        //     visible: true,
        //     parent: parent,
        //     selected: false,
        // };
        const { name, files: { vx } } = page;
        const icon = 'vx-icon';

        // 这边只需要给定相对工程目录的位置即可，在服务端会自动计算实际位置
        const id = `file:///src/pages/${name}/${vx}`;

        return {
            id,
            icon,
            name,
            visible: true,
            parent: parent,
            selected: false,
            files: page.files,
        } as PageNode;
    }
}
