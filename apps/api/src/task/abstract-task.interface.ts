export interface AbstractTask {
  name: string;
  run(): Promise<void>;
}
