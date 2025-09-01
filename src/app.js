// src/app.js
import { makeWASocket } from 'baileys';
import store from './database.js';
import allEventHandlers from './handlers/events/index.js';

const initializeWhatsapp = async () => {
    const { auth, getMessage, saveCreds } = await store();
    const socket = await makeWASocket({
        auth,
        getMessage
    });
    // load all events
    await allEventHandlers({
        socket,
        initializeWhatsapp,
        saveCreds
    });
}

initializeWhatsapp();