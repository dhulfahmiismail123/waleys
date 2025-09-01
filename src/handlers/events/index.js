import connectionEventHandler from './connections.js';
import credentialEventHandler from './creds.js';
import messagesEventHandler from './messages.js'

export default (object) => {
    connectionEventHandler(object);
    credentialEventHandler(object);
    messagesEventHandler(object);
}