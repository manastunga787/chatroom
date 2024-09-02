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
let url1 = `ws://localhost:3000/ws?name=${name}`;
let url2 = `wss://tunga.online/ws?name=${name}`;

const socket = new WebSocket(url2);

let interval: NodeJS.Timer;

rl.on("line", (data) => {
  socket.send(data.toString());
});

socket.addEventListener("open", () => {
  console.log(chalk.green("Connected to chat room"));
});

socket.addEventListener("message", (message) => {
  console.log(message.data);
});

socket.addEventListener("error", (err) => {
  console.log("Error occurred");
  clearInterval(interval);
  process.exit();
});

socket.addEventListener("close", () => {
  console.log(chalk.red("closed by server"));
  clearInterval(interval);
  rl.close();
  //process.exit();
});

// socket.onopen = () => {
//   interval = setInterval(() => {
//     socket.ping("--->");
//   }, 500);
// };

socket.addEventListener("pong", () => {
  console.log("got a pong from server");
  //console.log(event);
});

// // socket.addEventListener("close", () => {
// //   console.log("server closed");
// // });

socket.addEventListener("ping", () => {
  console.log("got a ping from server");
});

// socket.addEventListener("close", () => {});
