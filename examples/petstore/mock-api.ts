import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface PetstoreMockData {
  inventory: Record<string, number>;
}

export function createPetstoreMockServer(data: PetstoreMockData) {
  const orders = new Map<number, Record<string, unknown>>();
  let nextOrderId = 1;

  return createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (request.method === "GET" && pathname === "/v2/store/inventory") {
      if (!request.headers.api_key) {
        response.writeHead(401, { "content-type": "application/json" });
        response.end(JSON.stringify({ message: "Missing api_key header" }));
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(data.inventory));
      return;
    }

    if (request.method === "POST" && pathname === "/v2/store/order") {
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => { body += chunk; });
      request.on("end", () => {
        let input: unknown;
        try {
          input = JSON.parse(body);
        } catch {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ message: "Expected a JSON order object" }));
          return;
        }
        if (input === null || typeof input !== "object" || Array.isArray(input)) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ message: "Expected a JSON order object" }));
          return;
        }

        const order = { ...input, id: nextOrderId++ };
        orders.set(order.id, order);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(order));
      });
      return;
    }

    const orderMatch = /^\/v2\/store\/order\/(\d+)$/.exec(pathname);
    if (request.method === "GET" && orderMatch) {
      const order = orders.get(Number(orderMatch[1]));
      if (!order) {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ message: "Order not found" }));
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(order));
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ message: "Mock route not found" }));
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.MOCK_API_PORT ?? "4010");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("MOCK_API_PORT must be an integer between 1 and 65535.");
  }

  const data = JSON.parse(await readFile(new URL("./mock-data.json", import.meta.url), "utf8")) as PetstoreMockData;
  const server = createPetstoreMockServer(data);
  server.listen(port, "127.0.0.1", () => {
    console.log(`Petstore mock listening at http://127.0.0.1:${port}/v2`);
  });
}