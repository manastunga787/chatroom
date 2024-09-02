let id = 1;
const server = Bun.serve<{ id: number }>({
  port: 3000,
  fetch(req, server) {
    let url = new URL(req.url);

    if (url.pathname === "/ws") {
      const success = server.upgrade(req, {
        data: {
          id: id,
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
      console.log(`websocket connected ${ws.data.id}`);
    },

    message(ws, message) {
      console.log(`got a message from ${ws.data.id}: ${message}`);
    },

    close(ws) {
      console.log(`Websocket ${ws.data.id} got closed`);
    },

    ping(ws) {
      console.log("server got a ping from ", ws.data.id);
      ws.pong("Hello from server");
    },

    pong(ws) {
      console.log("got a pong from ", ws.data.id);
    },
  },
});

console.log(`Server started ${server.hostname} port ${server.port}`);
