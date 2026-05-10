import { useEffect, useState } from "react";

const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function fetchItems() {
  const r = await fetch(`${apiBase}/items`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function postItem(title) {
  const r = await fetch(`${apiBase}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

async function patchItem(id, title) {
  const r = await fetch(`${apiBase}/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

async function deleteItemRequest(id) {
  const r = await fetch(`${apiBase}/items/${id}`, { method: "DELETE" });
  if (r.status === 204) return;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    return fetchItems()
      .then(setItems)
      .catch((e) => setError(e.message || String(e)));
  };

  useEffect(() => {
    if (!apiBase) {
      setError("Задай VITE_API_URL в .env (URL бэкенда)");
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    postItem(title.trim())
      .then(() => {
        setTitle("");
        return load();
      })
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setSaving(false));
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditTitle(it.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = (id) => {
    const t = editTitle.trim();
    if (!t || busyId != null) return;
    setBusyId(id);
    setError("");
    patchItem(id, t)
      .then(() => {
        cancelEdit();
        return load();
      })
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setBusyId(null));
  };

  const removeItem = (id) => {
    if (busyId != null) return;
    setBusyId(id);
    setError("");
    deleteItemRequest(id)
      .then(() => {
        if (editingId === id) cancelEdit();
        return load();
      })
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setBusyId(null));
  };

  return (
    <>
      <h1>Задачи</h1>
      {error ? <div className="err">{error}</div> : null}
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Новая задача"
          autoComplete="off"
        />
        <button type="submit" disabled={saving || !apiBase}>
          Добавить
        </button>
      </form>
      {loading ? (
        <p className="muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="muted">Пока пусто</p>
      ) : (
        <ul>
          {items.map((it) => {
            const editing = editingId === it.id;
            const busy = busyId === it.id;
            return (
              <li key={it.id}>
                <div className="li-main">
                  {editing ? (
                    <input
                      type="text"
                      className="inline-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={busy}
                      autoComplete="off"
                    />
                  ) : (
                    <span className="li-title">{it.title}</span>
                  )}
                  <small>{formatDate(it.created_at)}</small>
                </div>
                <div className="li-actions">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        className="btn-sm"
                        disabled={busy || !editTitle.trim()}
                        onClick={() => saveEdit(it.id)}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-muted"
                        disabled={busy}
                        onClick={cancelEdit}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-sm btn-muted"
                        disabled={busy || saving}
                        onClick={() => startEdit(it)}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-danger"
                        disabled={busy || saving}
                        onClick={() => removeItem(it.id)}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
