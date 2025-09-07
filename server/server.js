import { createWriteStream } from "fs";
import { open, readdir, rm, rename, mkdir } from "fs/promises";
import http from "http";
import mime from "mime-types";
import path from "path";

const STORAGE = "./storage";

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  console.log(req.method);
  if (req.method === "GET") {
    if (req.url === "/favicon.ico") return res.end("No favicon.");
    if (req.url === "/") {
      serveDirectory(req, res);
    } else {
      try {
        const [url, queryString] = req.url.split("?");
        const queryParam = {};
        queryString?.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          queryParam[key] = value;
        });
        console.log(queryParam);

        const fullPath = path.join(STORAGE, decodeURIComponent(url));
        const fileHandle = await open(fullPath);
        const stats = await fileHandle.stat();

        if (stats.isDirectory()) {
          serveDirectory(req, res);
        } else {
          const readStream = fileHandle.createReadStream();
          const ext = path.extname(fullPath);
          res.setHeader(
            "Content-Type",
            mime.contentType(ext) || "application/octet-stream"
          );
          res.setHeader("Content-Length", stats.size);
          if (queryParam.action === "download") {
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${path.basename(fullPath)}"`
            );
          }
          readStream.pipe(res);
        }
      } catch (err) {
        console.log(err.message);
        res.statusCode = 404;
        res.end("Not Found!");
      }
    }
  } else if (req.method === "OPTIONS") {
    res.end("OK");
  } else if (req.method === "POST") {
    const contentType = req.headers["content-type"];
    const folderPath = `./storage${req.url}`;

    if (contentType === "application/json") {
      //create folder
      req.on("data", async (chunk) => {
        const { folderName, type } = JSON.parse(chunk.toString());

        if (type === "directory") {
          try {
            await mkdir(`${folderPath}${folderName}`, { recursive: true });
            res.end("Folder created successfully");
          } catch (error) {
            res.end("Error while creating folder: " + error.message);
          }
        }
      });
    } else {
      //Upload file
      const writeStream = createWriteStream(
        `${folderPath}${req.headers.filename}`
      );
      req.on("data", (chunk) => {
        writeStream.write(chunk);
      });
      req.on("end", () => {
        writeStream.end();
        res.end("File uploaded on the server");
      });
    }
  } else if (req.method === "DELETE") {
    const filePath = `./storage/${req.url}`;
    req.on("data", async (chunk) => {
      try {
        const { filename, type } = JSON.parse(chunk.toString());

        if (type === "file") {
          await rm(`${filePath}${filename}`);
          res.end("File deleted successfully");
        } else if (type === "directory") {
          await rm(`${filePath}${filename}`, { recursive: true, force: true });
          res.end("Folder deleted successfully");
        }
      } catch (err) {
        res.end(err.message);
      }
    });
  } else if (req.method === "PATCH") {
    const folderPath = `./storage/${req.url}`;
    req.on("data", async (chunk) => {
      const data = JSON.parse(chunk.toString());
      await rename(
        `${folderPath}${data.oldFilename}`,
        `${folderPath}${data.newFilename}`
      );
      res.end("File Renamed");
    });
  }
});

async function serveDirectory(req, res) {
  const folderPath = `./storage/${req.url}`;
  const [url] = req.url.split("?");
  const items = await readdir(`${folderPath}`, { withFileTypes: true });

  const itemsList = await Promise.all(
    items.map(async (item) => {
      return {
        name: item.name,
        type: item.isDirectory() ? "directory" : "file",
      };
    })
  );
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(itemsList));
}

server.listen(80, () => {
  console.log("Server started");
});
