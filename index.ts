import { sleep } from "bun";

console.log(process.env.NODE_APP_INSTANCE);
console.log(navigator.hardwareConcurrency);
const instanceId = parseInt(process.env.NODE_APP_INSTANCE || "0", 10);

const port = 3000 + instanceId;
const server = Bun.serve({
  port: port,
  async fetch(req) {
    if (instanceId === 0) {
      await sleep(8000);
    }

    return new Response(
      `hello from instance id ${instanceId} ${new Date().toLocaleString()}`
    );
  },
});

console.log(`server started at port ${server.port}`);
