import { WebSocketServer } from "ws";
import { Impit } from "impit";

const wss = new WebSocketServer({ port: 8080 });
const impit = new Impit({ browser: "chrome" });
const clients = new Set();

let running = false;
let loopInterval = 5000;

// object per function, value = Set of jid yang request function
const activeFunctionJids = {
    getChatIndo: new Set(),
    postData: new Set(),
    deleteData: new Set()
};

// contoh function
async function getChatIndo() {
    const res = await impit.fetch('https://m.rivalregions.com/main/content', { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; itel P661N Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.143 Mobile Safari/537.36', 'Cookie': 'PHPSESSID=fc823pt83fi1v8upbh7l389am8; rr=72c5e3dd8703eeeb21b5c50c1578c74b; rr_id=2001665727; rr_add=839a3146b16913fe2c1cdc5afd4e879d; rr_f=1ccff8e5c999cdcced04028fd19b8eff' } });

    const chatPattern = /<div class="chat_lines tc"[^>]*>[\s\S]*?show="(\d+)"[^>]*what="([^"]+)"[^>]*>[\s\S]*?<div class="chat_dates">([^<]+?)<\/div>[\s\S]*?<span class="tran_chat"[^>]*>([\s\S]*?)<\/span><\/div>/g;
    
    const text = await res.text()
    const chatArray = [];
    let match;

    // Ekstrak data menggunakan regex
    while ((match = chatPattern.exec(text)) !== null) {
        // Replace <br> dengan newline \n
        const cleanMessage = match[4].replace(/<br\s*\/?>/gi, '\n');

        const chatObject = {
            id: match[1],
            name: match[2],
            time: match[3],
            message: cleanMessage
        };
        chatArray.push(chatObject);
    }
    return { status: res.status, messages: chatArray };
}

async function postData() {
    const res = await impit.fetch("https://example.com/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foo: "bar" })
    });
    return { status: res.status };
}

async function deleteData() {
    const res = await impit.fetch("https://example.com/data/123", { method: "DELETE" });
    return { status: res.status };
}

// loop tunggal recursive
async function mainLoop() {
    if (!running) return;

    const memoryData = {};
    const clientData = [];

    try {
        // eksekusi function sesuai siapa yang request
        if (activeFunctionJids.getChatIndo.size > 0) {
            memoryData.getChatIndo = await getChatIndo();
        }
        if (activeFunctionJids.postData.size > 0) {
            memoryData.postData = await postData();
        }
        if (activeFunctionJids.deleteData.size > 0) {
            memoryData.deleteData = await deleteData();
        }

        // bangun clients array
        const allJids = new Set([
            ...activeFunctionJids.getChatIndo,
            ...activeFunctionJids.postData,
            ...activeFunctionJids.deleteData
        ]);

        allJids.forEach(jid => {
            const funcs = [];
            if (activeFunctionJids.getChatIndo.has(jid)) funcs.push("getChatIndo");
            if (activeFunctionJids.postData.has(jid)) funcs.push("postData");
            if (activeFunctionJids.deleteData.has(jid)) funcs.push("deleteData");
            clientData.push({ id: jid, functions: funcs });
        });

        if (Object.keys(memoryData).length > 0) {
            const msg = JSON.stringify({
                type: "loopResult",
                clients: clientData,
                data: memoryData
            });
            for (const ws of clients) ws.send(msg);
        }
    } catch (err) {
        const errMsg = JSON.stringify({
            type: "loopError",
            clients: clientData,
            error: err.message
        });
        for (const ws of clients) ws.send(errMsg);
    }

    setTimeout(mainLoop, loopInterval);
}

// WS connection
wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
        clients.delete(ws);
        // hapus semua jid terkait function
        for (const set of Object.values(activeFunctionJids)) set.clear();
    });

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        const jid = data.Id;
        if (!jid) return;

        const fnArr = data.functions; // array nama function

        if (data.cmd === "start") {
            if (!running) {
                running = true;
                loopInterval = data.interval || 5000;
                mainLoop();
            }

            if (Array.isArray(fnArr) && fnArr.length > 0) {
                for (const fn of fnArr) {
                    if (activeFunctionJids[fn]) activeFunctionJids[fn].add(jid);
                }
            } else {
                for (const fn of Object.keys(activeFunctionJids)) activeFunctionJids[fn].add(jid);
            }
        }

        if (data.cmd === "stop") {
            if (Array.isArray(fnArr) && fnArr.length > 0) {
                for (const fn of fnArr) {
                    if (activeFunctionJids[fn]) activeFunctionJids[fn].delete(jid);
                }
            } else {
                for (const fn of Object.keys(activeFunctionJids)) activeFunctionJids[fn].delete(jid);
            }
        }
    });
});

console.log("WS server jalan di ws://localhost:8080");