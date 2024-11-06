const ytdl = require("ytdl-core");

async function handleCommand(socket, message) {
    const { body } = message.message.conversation ? message.message : message.message.extendedTextMessage;
    const chatId = message.key.remoteJid;

    if (body.startsWith("!yt ")) {
        const url = body.split(" ")[1];
        if (ytdl.validateURL(url)) {
            const info = await ytdl.getInfo(url);
            const stream = ytdl(url, { filter: "audioonly" });
            socket.sendMessage(chatId, { text: `Downloading: ${info.videoDetails.title}` });
            socket.sendMessage(chatId, { document: stream, mimetype: 'audio/mp4', fileName: `${info.videoDetails.title}.mp4` });
        } else {
            socket.sendMessage(chatId, { text: "Invalid YouTube URL." });
        }
    } else if (body === "!hello") {
        socket.sendMessage(chatId, { text: "Hello! How can I assist you today?" });
    }
}

module.exports = { handleCommand };
