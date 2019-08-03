import { MessageService, CommandRegistry, CommandContribution } from '@theia/core';
export declare const HelloWorldCommand: {
    id: string;
    label: string;
};
export declare class HelloWorldCommandContribution implements CommandContribution {
    private readonly messageService;
    constructor(messageService: MessageService);
    registerCommands(registry: CommandRegistry): void;
}
//# sourceMappingURL=command-contribution.d.ts.map