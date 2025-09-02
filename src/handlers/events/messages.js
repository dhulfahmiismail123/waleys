import store from './../../database.js';
import { isChat, isGroup, isBroadcast } from './../../utils/index.js'

export default ({ socket }) => {
    socket.ev.on('messages.upsert', async (data) => {
        const messages = data.messages[0];
        const { saveMessage } = await store();
        await saveMessage(messages);
        if (isChat(messages)) {
            console.log("Chat Message:", JSON.stringify(messages, null, 2));
            if (isCommand(messages)) {
                
            }
        }if (isGroup(messages)) {
            console.log("Group Message:", JSON.stringify(messages, null, 2));
        } else if (isBroadcast(messages)) {
            console.log("Broadcast Message:", JSON.stringify(messages, null, 2));
        }
    });
}