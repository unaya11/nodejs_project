import Fastify from "fastify";
import operatingHours from "./data/operatingHours.js";
import menuItems from "./data/menuItems.js";
import ejs from "ejs";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import { join } from "path";

const publicPath = join(process.cwd(), "public");

const app = Fastify();
const port = 3000;

app.register(fastifyView, {
  engine: {
    ejs: ejs,
  },
});

app.register(fastifyStatic, {
  root: publicPath,
  prefix: "/public",
});

app.get("/", (req, reply) => {
  reply.view("views/index.ejs", { name: "What's Fare is Fair" });
});

app.get("/menu", (req, reply) => {
  reply.view("views/menu.ejs", { menuItems });
});

app.get("/hours", (req, reply) => {
  const day = new Date().getDay() - 1;
  // const day = (new Date().getDay() + 6) % 7;
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const today = days[day] ?? "sunday";
  // const today = days[day];
  reply.view("views/hours.ejs", { operatingHours, days, today });
});

app.get("/about", (req, reply) => {
  reply.view("views/about.ejs");
});

await app.listen({ port, host: "0.0.0.0" });
console.log(`Web Server is listening at http://localhost:${port}`);
