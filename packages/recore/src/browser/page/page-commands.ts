import { MenuPath } from '@theia/core/lib/common';

export const PAGE_CONTEXT_MENU: MenuPath = ['page-context-menu'];

export namespace PageCommands {
    export interface ICommand {
        id: string;
        label: string;
        args?: string[];
    }

    export const JUMP_VX = {
        id: 'page.jump_vx',
        label: 'Open View'
    };

    export const JUMP_CTRL = {
        id: 'page.jump_ctrl',
        label: 'Open Controller'
    };

    export const JUMP_STYLE = {
        id: 'page.jump_style',
        label: 'Open Style'
    };
}

export namespace PageContextMenu {
    export const JUMP_VX = [...PAGE_CONTEXT_MENU, '1_vx'] as string[];
    export const JUMP_CTRL = [...PAGE_CONTEXT_MENU, '2_ctrl'] as string[];
    export const JUMP_STYLE = [...PAGE_CONTEXT_MENU, '3_style'] as string[];
}
