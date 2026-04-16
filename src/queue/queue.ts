import { Queue } from "bullmq";

export const queue = new Queue("provision", {
  connection: { host: "127.0.0.1", port: 6379 }
});

export const addJob = (name: string, data: any) => {
  return queue.add(name, data, { attempts: 3 });
};