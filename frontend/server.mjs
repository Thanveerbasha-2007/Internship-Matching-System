import http from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.resolve(root, "dist");
const port = Number(process.env.PORT || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  try {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    let pathname = decodeURIComponent(requestUrl.pathname);
    const requestedPath = path.resolve(distRoot, "." + pathname);

    if (requestedPath !== distRoot && !requestedPath.startsWith(distRoot + path.sep)) {
      response.writeHead(400);
      response.end("Invalid path");
      return;
    }

    let filePath = requestedPath;
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
      await fs.access(filePath);
    } catch {
      // React Router / client-side navigation fallback.
      filePath = path.join(distRoot, "index.html");
      await fs.access(filePath);
    }

    const contentType = mime[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath)
      .on("error", () => {
        if (!response.headersSent) response.writeHead(500);
        response.end("Unable to read file");
      })
      .pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`InternMatch frontend listening on port ${port}`);
});
