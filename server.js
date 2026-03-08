const http = require("http");
const { handleApiUsers } = require("./routes/apiUsers");
const { handleApiGpus } = require("./routes/apiGpus");
const { handlePages } = require("./routes/pages");

const server = http.createServer((req, res) => {
  // 1) API
  const apiHandledUsers = handleApiUsers(req, res);
  if (apiHandledUsers !== false) return;

  const apiHandledGpus = handleApiGpus(req, res);
  if (apiHandledGpus !== false) return;

  // 2) Pages + public
  const pageHandled = handlePages(req, res);
  if (pageHandled !== false) return;

  // 3) fallback 404
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Server běží na http://localhost:3000");
});
