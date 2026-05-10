const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.PGSSL === "true"
      ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function listItems() {
  const { rows } = await pool.query(
    `SELECT id, title, created_at FROM items ORDER BY created_at DESC, id DESC`
  );
  return rows;
}

async function createItem(title) {
  const trimmed = String(title || "").trim();
  if (!trimmed) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  const { rows } = await pool.query(
    `INSERT INTO items (title) VALUES ($1) RETURNING id, title, created_at`,
    [trimmed]
  );
  return rows[0];
}

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error("invalid id");
    err.status = 400;
    throw err;
  }
  return id;
}

async function updateItem(rawId, title) {
  const id = parseId(rawId);
  const trimmed = String(title || "").trim();
  if (!trimmed) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  const { rowCount, rows } = await pool.query(
    `UPDATE items SET title = $1 WHERE id = $2 RETURNING id, title, created_at`,
    [trimmed, id]
  );
  if (rowCount === 0) {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function deleteItem(rawId) {
  const id = parseId(rawId);
  const { rowCount } = await pool.query(`DELETE FROM items WHERE id = $1`, [id]);
  if (rowCount === 0) {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }
}

module.exports = { pool, initDb, listItems, createItem, updateItem, deleteItem };
