require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initDb, listItems, createItem, updateItem, deleteItem } = require("./db");

const PORT = Number(process.env.PORT) || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN || true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.path);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/items", async (_req, res) => {
  try {
    const items = await listItems();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to load items" });
  }
});

app.post("/items", async (req, res) => {
  try {
    const item = await createItem(req.body?.title);
    res.status(201).json(item);
  } catch (e) {
    if (e.status === 400) {
      return res.status(400).json({ error: e.message });
    }
    console.error(e);
    res.status(500).json({ error: "failed to create item" });
  }
});

async function main() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
