export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  createdAt: Date;
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<void>;

export class JobQueue<T = any> {
  private name: string;
  private queue: Job<T>[] = [];
  private isProcessing = false;
  private handlers: Map<string, JobHandler<T>> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  process(jobName: string, handler: JobHandler<T>) {
    this.handlers.set(jobName, handler);
  }

  async add(jobName: string, data: T): Promise<Job<T>> {
    const job: Job<T> = {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: jobName,
      data,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.triggerProcessing();
    return job;
  }

  private async triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      const handler = this.handlers.get(job.name);
      if (handler) {
        try {
          await handler(job);
        } catch (err) {
          console.error(`❌ [JobQueue:${this.name}] Failed to process job ${job.name} (${job.id}):`, err);
        }
      } else {
        console.warn(`⚠️ [JobQueue:${this.name}] No handler registered for job: ${job.name}`);
      }
    }

    this.isProcessing = false;
  }

  getPendingCount() {
    return this.queue.length;
  }
}
