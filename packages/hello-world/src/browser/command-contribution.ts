import { injectable, inject } from 'inversify';
import { MessageService, CommandRegistry, CommandContribution } from '@theia/core';

export const HelloWorldCommand = {
  id: 'HelloWorld.command',
  label: "Shows a message"
};

@injectable()
export class HelloWorldCommandContribution implements CommandContribution {

  constructor(
      @inject(MessageService) private readonly messageService: MessageService,
  ) { }

  registerCommands(registry: CommandRegistry): void {
      registry.registerCommand(HelloWorldCommand, {
          execute: () => this.messageService.info('Hello World!')
      });
  }
}