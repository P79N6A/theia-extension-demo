import { injectable } from 'inversify';
import { MenuContribution, MenuModelRegistry } from '@theia/core';
import { CommonMenus } from '@theia/core/lib/browser';
import { HelloWorldCommand } from './command-contribution';

@injectable()
export class HelloWorldMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
                commandId: HelloWorldCommand.id,
                label: 'Say Hello'
            });
    }
}