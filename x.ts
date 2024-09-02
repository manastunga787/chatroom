import Redis from "ioredis";
import chalk, { Chalk } from "chalk";
import type { ServerWebSocket } from "bun";

const instanceId = parseInt(process.env.NODE_APP_INSTANCE || "0", 10);
let id = 1;
type color = "red" | "blue" | "yellow" | "green" | "cyan";
let colors: color[] = ["red", "blue", "green", "cyan", "blue"];

type MessageData = {
  name: string;
  message: string;
  id: string;
};

enum Channels {
  groupChat = "the_group_chat",
}
//type RedisInstanceType = "PUB_REDIS" | "SUB_REDIS";

const SERVER_ID = crypto.randomUUID();
const webSocketMap = new Map();

function createRedisInstance() {
  return new Redis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    tls: {
      ca: process.env.REDIS_CA,
      cert: process.env.REDIS_CA,
      key: process.env.REDIS_KEY,
    },
  });
}

const redisSub: Redis = createRedisInstance();
const redisPub: Redis = createRedisInstance();

await redisSub.subscribe(Channels.groupChat);

function publishByRedis(channel: Channels, data: MessageData) {
  redisPub.publish(channel, JSON.stringify(data));
}

redisSub.on("message", (channel: Channels, message) => {
  console.log("on message fired");
  let data = JSON.parse(message) as MessageData;

  let ws: ServerWebSocket = webSocketMap.get(data.id);
  if (ws) {
    ws.publish(Channels.groupChat, data.message);
  } else {
    server.publish(Channels.groupChat, data.message);
  }
});

const server = Bun.serve<{
  id: string;
  color: color;
  name: string;
}>({
  port: 3000,
  reusePort: true,
  async fetch(req, server) {
    let url = new URL(req.url);

    if (url.pathname === "/ws") {
      let name = url.searchParams.get("name");
      // console.log("Name is ", name);
      const success = server.upgrade(req, {
        data: {
          id: id,
          name: name,
          color: id > colors.length - 1 ? "yellow" : colors[id],
        },
      });
      //console.log("success is ", success);
      if (success) {
        id++;
        return;
      }
      return new Response("Failed to upgrade request ", { status: 500 });
    } else {
      return new Response(
        "Hello world " + url.pathname + " " + new Date().toLocaleTimeString()
      );
    }
  },

  websocket: {
    async open(ws) {
      ws.subscribe(Channels.groupChat);
      ws.send(`connected to serverId: ${chalk.yellow(SERVER_ID)}`);
      //console.log("open fired");
      let { name, color } = ws.data;
      let id = crypto.randomUUID();

      ws.data.id = id;

      const message = `${chalk[color](name)} joined the chat room`;
      webSocketMap.set(ws.data.id, ws);
      //ws.publish("the-group-chat", message);

      // await redisPub.publish(
      //   Channels.groupChat,
      //   JSON.stringify({ name, message, id })
      // );
      publishByRedis(Channels.groupChat, { name, id, message });
    },
    message(ws, message) {
      const { name, id, color } = ws.data;
      message = `${chalk[color](name)}: ${message}`;
      //  console.log(`${chalk[ws.data.color](ws.data.name)}: ${message}`);
      // ws.publish(
      //   "the-group-chat",
      //   `${chalk[ws.data.color](ws.data.name)}: ${message}`
      // );
      // message = `${chalk[ws.data.color](ws.data.name)}: ${message}`;
      //redisPub.publish(Channels.groupChat, message);

      publishByRedis(Channels.groupChat, {
        name,
        id,
        message,
      });
    },
    close(ws) {
      // console.log(`Websocket ${ws.data.id} got closed`);
      const { name, id } = ws.data;
      const message = `${chalk.red(name)} left the chart`;
      ws.unsubscribe("the-group-chat");
      console.log("going to delete", ws.data.id);
      webSocketMap.delete(ws.data.id);
      publishByRedis(Channels.groupChat, {
        name,
        id,
        message,
      });
      // server.publish(
      //   "the-group-chat",
      //   chalk.red(`${ws.data.name} left the chat`)
      // );
      //  let message = `chalk.red(${ws.data.name}) left the chat`;
      // redisPub.publish(Channels.groupChat, message);
    },
    ping() {
      console.log("got a ping from client");
    },
  },
});

console.log(`server started at port ${server.port}`);
