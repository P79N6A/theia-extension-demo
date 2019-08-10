export const RecoreServer = Symbol('RecoreServer');

export const RecoreServerPath = '/services/recore-server';

export interface RecoreServer {
  ensureFile(path: string): Promise<void>;
  restartDesignerServer(): Promise<void>;
}
