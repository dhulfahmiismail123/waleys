import { DisconnectReason } from 'baileys'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

// Data
export const isPhone = (data) => {
    if (typeof data !== 'string' || !/^\d+$/.test(data)) return false

    const phone = parsePhoneNumberFromString('+' + data)
    return phone ? phone.isValid() : null
}

// Object
export const isChat = (messages) => {
    return messages?.key?.remoteJid?.endsWith('@s.whatsapp.net')
}

export const isGroup = (messages) => {
    return messages?.key?.remoteJid?.endsWith('@g.us')
}

export const isBroadcast = (messages) => {
    return messages?.key?.remoteJid?.endsWith('@broadcast')
}


// Connection
export const isReconnect = (data) => {
    return [
        DisconnectReason.connectionClosed,
        DisconnectReason.connectionLost,
        DisconnectReason.timedOut,
        DisconnectReason.restartRequired
    ].includes(data)
}