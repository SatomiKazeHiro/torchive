import * as path from 'path';
import { input, confirm, number, select } from '@inquirer/prompts';

interface PromptBase<T> {
  type: string;
  name: string;
  message: string;
  default?: T;
  validate?: (val: any) => boolean | string;
  choices?: string[]; // 选项，比如 select
}

type Prompt =
  | (PromptBase<string> & { type: 'input' })
  | (PromptBase<boolean> & { type: 'confirm' })
  | (PromptBase<number> & { type: 'number' })
  | (PromptBase<string> & { type: 'select' });

const validateMap = {
  port: /^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
};

function assertNever(x: never): never {
  throw new Error(`未知的问题类型: ${JSON.stringify(x)}`);
}

const prompts: Prompt[] = [
  {
    type: 'input',
    name: 'serverPort',
    message: '启动端口：',
    default: '3000',
    validate: (val) =>
      validateMap.port.test(String(val)) || '请输入正确的端口号',
  },
  {
    type: 'input',
    name: 'resourcesPath',
    message: '资源下载路径：',
    default: path.resolve(process.cwd(), 'download'),
  },
];

export async function interaction(): Promise<Record<string, any> | null> {
  const answers: Record<string, any> = {};

  for (const prompt of prompts) {
    switch (prompt.type) {
      case 'input':
        answers[prompt.name] = await input({
          message: prompt.message,
          default: prompt.default,
          validate: prompt.validate,
        });
        break;

      case 'confirm':
        answers[prompt.name] = await confirm({
          message: prompt.message,
          default: prompt.default,
        });
        break;

      case 'number':
        answers[prompt.name] = await number({
          message: prompt.message,
          default: prompt.default,
          validate: prompt.validate,
        });
        break;

      case 'select':
        answers[prompt.name] = await select({
          message: prompt.message,
          choices: prompt.choices ?? [],
          default: prompt.choices?.indexOf(String(prompt.default)) ?? 0,
        });
        break;

      default:
        assertNever(prompt);
    }
  }

  return answers;
}
