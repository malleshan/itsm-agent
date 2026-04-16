import { Worker } from "bullmq";
import { provisionUser } from "../modules/provisioning/provision.service";

new Worker(
  "provision",
  async (job) => {
    if (job.name === "provision-user") {
      await provisionUser(job.data);
    }
  },
  {
    connection: { host: "127.0.0.1", port: 6379 }
  }
);