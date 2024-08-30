import chalk from "chalk";
chalk.bgBlackBright;
let id = 1;
type color = "red" | "blue" | "yellow" | "green" | "cyan";

let colors: color[] = ["red", "blue", "green", "cyan", "blue"];

chalk.red("hello");

const server = Bun.serve<{ name: string; id: number; color: color }>({
  port: 3000,
  fetch(req, server) {
    let url = new URL(req.url);

    if (url.pathname === "/ws") {
      let name = url.searchParams.get("name");
      const success = server.upgrade(req, {
        data: {
          id: id,
          name: name,
          color: id > colors.length - 1 ? "yellow" : colors[id],
        },
      });
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
    idleTimeout: 10,
    open(ws) {
      ws.subscribe("the-group-chat");

      let { name, color, id } = ws.data;

      const message = `${chalk[color](name)} joined the chat room`;
      console.log(message);
      ws.publish("the-group-chat", message);
    },
    message(ws, message) {
      console.log(`${chalk[ws.data.color](ws.data.name)}: ${message}`);
      ws.publish(
        "the-group-chat",
        `${chalk[ws.data.color](ws.data.name)}: ${message}`
      );
    },
    close(ws) {
      console.log(`Websocket ${ws.data.id} got closed`);
      ws.unsubscribe("the-group-chat");
      server.publish(
        "the-group-chat",
        chalk.red(`${ws.data.name} left the chat`)
      );
    },
  },
});

console.log(`Server started ${server.hostname} port ${server.port}`);
