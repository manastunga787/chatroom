import chalk from "chalk";
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";
const rl = readline.createInterface({ input: stdin, output: stdout });

const name = await rl.question("Enter you name: ");
if (name.length < 3) {
  console.log(chalk.red("Name must be at least 3 characters "));
  rl.close();
  process.exit();
}
const socket = new WebSocket(`ws://192.168.29.166:3000/ws?name=${name}`);

rl.on("line", (data) => {
  socket.send(data.toString());
});

socket.addEventListener("open", () => {
  console.log(chalk.green("Connected to chat room"));
});

socket.addEventListener("message", (message) => {
  console.log(message.data);
});

socket.addEventListener("error", () => {
  console.log("Error occurred");
  process.exit();
});

socket.addEventListener("close", () => {
  console.log(chalk.red("closed by server"));
  rl.close();
  //process.exit();
});

// // socket.onopen = () => {
// //   setInterval(() => {
// //     socket.ping("--->");
// //   }, 10000);
// // };

// // socket.addEventListener("pong", (event: MessageEvent) => {
// //   console.log("got a pong from server", event.data.toString());
// //   //console.log(event);
// // });

// // socket.addEventListener("close", () => {
// //   console.log("server closed");
// // });

// socket.addEventListener("ping", () => {
//   console.log("got a ping from server");
// });

// socket.addEventListener("close", () => {});
