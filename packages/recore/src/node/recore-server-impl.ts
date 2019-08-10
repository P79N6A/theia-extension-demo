import { injectable } from 'inversify';
import * as cp from 'child_process';
import { promisify } from 'util';
import * as fs from "fs-extra";
import { RecoreServer } from '../common/recore-server';

const execFile = promisify(cp.execFile);

@injectable()
export class RecoreServerImpl implements RecoreServer {
  async ensureFile(path: string) {
    await fs.ensureFile(path);
  }

  /**
   * 重启 Designer 编译服务
   */
  async restartDesignerServer() {
    await execFile('/bin/bash', ['/home/admin/bin/cxide_plugin_load.sh', 'restart']);
  }
}
