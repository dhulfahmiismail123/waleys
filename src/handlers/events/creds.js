// src/handlers/events/creds.js
export default ({ socket, saveCreds }) => {
    socket.ev.on('creds.update', saveCreds);
}