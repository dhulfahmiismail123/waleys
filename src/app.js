import { makeWASocket } from 'baileys';
import { credsStore } from './database.js';
import allEventHandlers from './eventHandlers.js';

const initializeWhatsapp = async () => {
    const { state, saveCreds } = credsStore();
    const socket = await ({
        auth: state
    });
    // load all events
    await allEventHandlers({
        socket,
        saveCreds
    });
}