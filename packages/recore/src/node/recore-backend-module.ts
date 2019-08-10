import { ContainerModule } from 'inversify';
import { JsonRpcConnectionHandler, ConnectionHandler } from '@theia/core/lib/common';
import { RecoreServer, RecoreServerPath } from '../common/recore-server';
import { RecoreServerImpl } from './recore-server-impl';

export default new ContainerModule(bind => {
  bind(RecoreServer).to(RecoreServerImpl).inSingletonScope();
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new JsonRpcConnectionHandler(RecoreServerPath, () =>
      ctx.container.get(RecoreServer)
    )
  ).inSingletonScope();
});
