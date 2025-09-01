import { disconnectReason } from 'baileys';
import { METHOD_LOGIN } from './config.js';
import { isPhone, isReconnect } from './utils/validation.js';

export default ({
    sock,
    saveCreds
}) => {
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            
        } else if (qr && METHOD_LOGIN === isPhone(METHOD_LOGIN)) {
            const pairing_code = await sock.requestPairingCode(METHOD_LOGIN);
            logger.info(`PAIRING CODE: ${pairing_code}`);
        }
        if (connection === 'open') {
            logger.info("Connected to Whatsapp");
        } else if (connection === 'Connecting') {
            logget.info(" Connecting...")
        } else if (connection === 'close') {
            const { connectionClosed, connectionLost, timedOut, restartRequired } = disconnectReason;
            switch (isReconnect(lastDisconnect)) {
                case connectionClosed:
                    logger.debug("Reconnecting...")
                    break;
                case connectionLost:
                    
            }
        }
    });
}