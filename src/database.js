import Database from 'better-sqlite3';
import pkg from 'baileys';
import { DB_PATH } from './config.js'

const { proto, initAuthCreds, BufferJSON } = pkg;

export const credsStore = () => {
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -128000');
  db.pragma('temp_store = MEMORY');

  db.prepare(`
    CREATE TABLE IF NOT EXISTS creds (
      id TEXT PRIMARY KEY,
      value TEXT
    )
  `).run();

  const insertStmt = db.prepare('INSERT OR REPLACE INTO creds (id, value) VALUES (?, ?)');
  const deleteStmt = db.prepare('DELETE FROM creds WHERE id = ?');

  const writeCred = (id, value) => {
    const str = JSON.stringify(value, BufferJSON.replacer);
    insertStmt.run(id, str);
  };

  const readCred = (id) => {
    const row = db.prepare('SELECT value FROM creds WHERE id = ?').get(id);
    return row ? JSON.parse(row.value, BufferJSON.reviver) : null;
  };

  const writeKey = (id, value) => {
    if (value) {
      const str = JSON.stringify(value, BufferJSON.replacer);
      insertStmt.run(id, str);
    } else {
      deleteStmt.run(id);
    }
  };

  const readKey = (id) => {
    const row = db.prepare('SELECT value FROM creds WHERE id = ?').get(id);
    if (!row) return null;
    let value = JSON.parse(row.value, BufferJSON.reviver);
    if (id.startsWith('app-state-sync-key') && value) {
      value = proto.Message.AppStateSyncKeyData.fromObject(value);
    }
    return value;
  };

  const setKeysBatch = db.transaction((data) => {
    for (const category in data) {
      for (const id in data[category]) {
        const value = data[category][id];
        const keyId = category + '-' + id;
        if (value) {
          const str = JSON.stringify(value, BufferJSON.replacer);
          insertStmt.run(keyId, str);
        } else {
          deleteStmt.run(keyId);
        }
      }
    }
  });

  const creds = readCred('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const data = {};
          for (const id of ids) {
            const keyId = type + '-' + id;
            data[id] = readKey(keyId);
          }
          return data;
        },
        set: (data) => {
          setKeysBatch(data);
        },
      },
    },
    saveCreds: () => writeCred('creds', creds),
  };
};