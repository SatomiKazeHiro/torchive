import { Worker } from 'worker_threads';

export function runWorker<T = any>(
  workerPath: string,
  workerData?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData });

    worker.on('message', (result: T) => resolve(result));
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
    });
  });
}
