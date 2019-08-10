import { injectable, postConstruct } from 'inversify';
import { Disposable, DisposableCollection, Emitter } from "@theia/core";
import { PageCommands } from "./page-commands";
import ICommand = PageCommands.ICommand;
import { Event } from "@theia/core/lib/common";

@injectable()
export class PageCommandService implements Disposable {
    protected readonly toDispose = new DisposableCollection();
    public readonly onExecuteEmitter = new Emitter<ICommand>();

    @postConstruct()
    public init () {
        this.toDispose.push(this.onExecuteEmitter);
    }

    /**
     * 执行命令
     */
    execute(command: ICommand) {
        this.onExecuteEmitter.fire(command);
    }

    get onExecute(): Event<ICommand> {
        return this.onExecuteEmitter.event;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
