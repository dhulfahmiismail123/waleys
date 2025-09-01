// src/database.js
import Database from 'better-sqlite3';
import { proto, initAuthCreds, BufferJSON }from 'baileys';
import { DB_PATH } from './config.js';

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

db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      remoteJid TEXT,
      fromMe INTEGER,
      id TEXT,
      participant TEXT,
      message TEXT,
      UNIQUE(remoteJid, fromMe, id, participant)
    )
  `).run();

export default () => {
    const insertCredStmt = db.prepare('INSERT OR REPLACE INTO creds (id, value) VALUES (?, ?)');
    const deleteCredStmt = db.prepare('DELETE FROM creds WHERE id = ?');

    const writeCred = (id, value) => {
        const str = JSON.stringify(value, BufferJSON.replacer);
        insertCredStmt.run(id, str);
    };

    const readCred = (id) => {
        const row = db.prepare('SELECT value FROM creds WHERE id = ?').get(id);
        return row ? JSON.parse(row.value, BufferJSON.reviver) : null;
    };

    const writeKey = (id, value) => {
        if (value) {
            const str = JSON.stringify(value, BufferJSON.replacer);
            insertCredStmt.run(id, str);
        } else {
            deleteCredStmt.run(id);
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
                    insertCredStmt.run(keyId, str);
                } else {
                    deleteCredStmt.run(keyId);
                }
            }
        }
    });

    const creds = readCred('creds') || initAuthCreds();

    const insertMsgStmt = db.prepare(`
    INSERT OR REPLACE INTO messages (remoteJid, fromMe, id, participant, message)
    VALUES (?, ?, ?, ?, ?)
  `);

    const selectMsgStmt = db.prepare(`
    SELECT message FROM messages
    WHERE remoteJid = ? AND fromMe = ? AND id = ? AND (participant = ? OR participant IS NULL)
    LIMIT 1
  `);

    const saveMessage = (msg) => {
        if (!msg?.key) return;
        const { remoteJid, fromMe, id, participant } = msg.key;
        const str = JSON.stringify(msg, BufferJSON.replacer);
        insertMsgStmt.run(remoteJid, fromMe ? 1 : 0, id, participant || null, str);
    };

    const getMessage = async (key) => {
        const row = selectMsgStmt.get(
            key.remoteJid,
            key.fromMe ? 1 : 0,
            key.id,
            key.participant || null
        );
        return row ? JSON.parse(row.message, BufferJSON.reviver) : null;
    };

    return {
        auth: {
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
        saveMessage,
        getMessage,
    };
};