/********************************************************************************
 * Copyright (C) 2019 Alibaba and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { Command } from '@theia/core/lib/common/command';
import { RecoreFSService } from './recore-fs-service';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { RecoreLSService } from './recore-ls-service';
import { BindRegion } from './recore-ls-service';
import { RecoreServer } from '../../common/recore-server';

export const FS: Command = {
  id: 'writevx',
  label: 'Write vx'
};

export const RL: Command = {
  id: 'completion',
  label: 'Completion'
};

export const Restart: Command = {
  id: 'recore-designer:restart',
  label: 'Restart Designer',
};

@injectable()
export class RecoreContribution implements CommandContribution, KeybindingContribution {
  @inject(RecoreFSService)
  protected readonly fs: RecoreFSService;

  @inject(RecoreLSService)
  protected readonly rls: RecoreLSService;

  @inject(RecoreServer)
  protected readonly server: RecoreServer;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(Restart, {
      isEnabled: () => true,
      execute: async () => {
        try {
          await this.server.restartDesignerServer();
        } catch (e) {
          console.error('[Restart Designer] ERROR', e);
        }
      }
    });

    commands.registerCommand(FS, {
      isEnabled: () => true,
      execute: async () => {
        await this.fs.write('123', '/Users/Shared/staff/recore-demo/src/pages/home/index.vx');
      }
    });

    commands.registerCommand(RL, {
      isEnabled: () => true,
      execute: async () => {
        // const params = {
        //   textDocument: {
        //     uri: 'file:///Users/Shared/staff/recore-demo/.recore/rlc.ts'
        //   },
        //   position: {
        //     line: 2,
        //     character: 12
        //   }
        // };
        const a = await this.rls.completion('', BindRegion.Controller);
        // const a = await this.rls.definition(params);
        console.log(a);
        // await this.rls.addAndGotoAction({
        //   uri: 'file:///Users/xht/xht/hello-recore/src/app.ts',
        //   actionName: 'onToggle'
        // })
      }
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: RL.id,
      keybinding: 'alt+shift+z'
    });
  }
}
