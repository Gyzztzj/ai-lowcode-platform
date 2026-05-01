import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class PythonService {
  async runScript(scriptPath: string, args: string[] = []): Promise<any> {
    try {
      const { stdout, stderr } = await execFileAsync(
        'python',
        [scriptPath, ...args],
        {
          env: {
            ...process.env,
            PYTHONPATH: process.cwd() + '/../python-scripts',
          },
        },
      );

      return JSON.parse(stdout);
    } catch (error) {
      throw new Error(`文档处理失败: ${error.message}`);
    }
  }
}
