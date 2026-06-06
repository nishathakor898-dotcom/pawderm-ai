import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const serveDir = resolve(root, process.argv[2] || ".");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let filePath = resolve(join(serveDir, cleanPath));

    if (!filePath.startsWith(`${serveDir}${sep}`) && filePath !== serveDir) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch (error) {
      if (!extname(filePath)) {
        filePath = `${filePath}.html`;
        fileStat = await stat(filePath);
      } else {
        throw error;
      }
    }

    if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html");
      fileStat = await stat(filePath);
    }

    response.writeHead(200, {
      "Content-Length": fileStat.size,
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`PawDerm AI running at http://localhost:${port}`);
});
