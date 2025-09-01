// src/handlers/events/connections
import { METHOD_LOGIN } from './../../config.js'
import { isPhone, isReconnect } from './../../utils/index.js'

export default ({ socket, initializeWhatsapp, saveCreds }) => {
    
    socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr && METHOD_LOGIN) {
            if (isPhone(METHOD_LOGIN)) {
                const pairing_code = await socket.requestPairingCode(METHOD_LOGIN)
                console.log(`PAIRING CODE: ${pairing_code}`)
            } else {
                console.log("Invalid phone number!")
            }
        }

        if (connection === 'open') {
            console.log("Connected to Whatsapp")
        } else if (connection === 'connecting') {
            console.log("Connecting...")
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const error = lastDisconnect?.error

            if (isReconnect(statusCode)) {
                console.log("Reconnecting.. ")
                await initializeWhatsapp()
            } else {
                console.error(`Disconnected:`, error)
            }
        }
    })
}