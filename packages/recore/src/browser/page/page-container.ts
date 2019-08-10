import { interfaces, Container } from 'inversify';
import {
    createTreeContainer,
    Tree,
    TreeImpl,
    TreeWidget,
    TreeProps,
    defaultTreeProps
} from '@theia/core/lib/browser';
import { PageTreeImpl } from './page-tree-impl';
import { PageWidget } from './page-widget';
import { PAGE_CONTEXT_MENU } from './page-commands';

export const PAGE_PROPS = <TreeProps>{
    ...defaultTreeProps,
    contextMenuPath: PAGE_CONTEXT_MENU
};

export function createPageTreeContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(PageTreeImpl).toSelf();
    child.rebind(Tree).toDynamicValue(ctx => ctx.container.get(PageTreeImpl));

    child.rebind(TreeProps).toConstantValue(PAGE_PROPS);

    child.unbind(TreeWidget);
    child.bind(PageWidget).toSelf();

    return child;
}

export function createPageTreeWidget(parent: interfaces.Container): PageWidget {
    return createPageTreeContainer(parent).get(PageWidget);
}
