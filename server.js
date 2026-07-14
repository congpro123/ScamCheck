const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

let nextId = 1;
const checks = [];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/checks", (req, res) => {
  res.json(checks);
});

app.get("/api/checks/:id", (req, res) => {
  const check = checks.find((item) => item.id === Number(req.params.id));

  if (!check) {
    return res.status(404).json({ message: "Không tìm thấy kết quả kiểm tra." });
  }

  res.json(check);
});

app.post("/api/checks", (req, res) => {
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

  if (!content) {
    return res.status(400).json({ message: "Trường content là bắt buộc." });
  }

  const check = {
    id: nextId++,
    content,
    length: content.length,
    createdAt: new Date().toISOString()
  };

  checks.push(check);
  res.status(201).json(check);
});

app.put("/api/checks/:id", (req, res) => {
  const check = checks.find((item) => item.id === Number(req.params.id));
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

  if (!check) {
    return res.status(404).json({ message: "Không tìm thấy kết quả kiểm tra." });
  }

  if (!content) {
    return res.status(400).json({ message: "Trường content là bắt buộc." });
  }

  check.content = content;
  check.length = content.length;
  check.updatedAt = new Date().toISOString();
  res.json(check);
});

app.delete("/api/checks/:id", (req, res) => {
  const index = checks.findIndex((item) => item.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Không tìm thấy kết quả kiểm tra." });
  }

  checks.splice(index, 1);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint không tồn tại." });
});

app.listen(PORT, () => {
  console.log(`ScamCheck đang chạy tại http://localhost:${PORT}`);
});
