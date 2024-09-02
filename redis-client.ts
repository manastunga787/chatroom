import chalk from "chalk";
import Redis from "ioredis";
import { stdin, stdout } from "node:process";
import readLine from "node:readline/promises";
const rl = readLine.createInterface({ input: stdin, output: stdout });

const sub_Redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  tls: {
    ca: process.env.REDIS_CA,
    cert: process.env.REDIS_CA,
    key: process.env.REDIS_KEY,
  },
});

const pub_Redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  tls: {
    ca: process.env.REDIS_CA,
    cert: process.env.REDIS_CA,
    key: process.env.REDIS_KEY,
  },
});

const name = await rl.question("Enter your name: ");

rl.on("line", async (line) => {
  const message = JSON.stringify({ name, message: line });
  let num = await pub_Redis.publish("group-chat", message);
  console.log("publish num", num);
});

let data = await sub_Redis.subscribe("group-chat");
console.log(data);

sub_Redis.on("message", (channel, message) => {
  let data = JSON.parse(message);
  if (data.name !== name) {
    console.log(`${chalk.red(data.name)}: ${data.message}`);
  }
});
