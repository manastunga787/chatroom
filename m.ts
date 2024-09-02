import { serve } from "bun";
import Redis from "ioredis";

const redis = new Redis();
const serverId = crypto.randomUUID(); // Unique ID for this server instance

serve({
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("WebSocket server", { status: 200 });
  },
  websocket: {
    open(ws) {
      const clientId = crypto.randomUUID();
      ws.id = clientId;

      // Store the client-server mapping in Redis
      redis.hset("clients", clientId, serverId);

      console.log(`Client ${clientId} connected to server ${serverId}`);
    },
    message(ws, message) {
      console.log(`Received message from ${ws.id}: ${message}`);

      // Publish the message to Redis
      redis.publish(
        "chat_channel",
        JSON.stringify({ serverId, clientId: ws.id, message })
      );
    },
    close(ws) {
      console.log(`Client ${ws.id} disconnected`);

      // Remove the client-server mapping from Redis
      redis.hdel("clients", ws.id);
    },
  },
});

// Listen for messages from Redis and send them to the correct client
redis.subscribe("chat_channel");
redis.on("message", (channel, message) => {
  const {
    serverId: targetServerId,
    clientId,
    message: msg,
  } = JSON.parse(message);

  if (targetServerId === serverId) {
    const ws = clients.get(clientId);
    if (ws) {
      ws.send(msg);
    }
  }
});
