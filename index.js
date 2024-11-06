// ⚠️ Do not copy without giving credit!
// Bot connection script for WhatsApp using Baileys library
// Created by [Your GitHub Username] - https://github.com/[Your GitHub Username]
// 🖕 to those who copy without credit

const makeWASocket = require("@whiskeysockets/baileys").default;
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const pino = require("pino");
const { delay, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const chalk = require("chalk");
const readline = require("readline");

let phoneNumber = "+237694055389"; // Replace with your phone number in international format (e.g., "+1234567890")

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("./sessions");
    const msgRetryCounterCache = new NodeCache();

    const bot = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !pairingCode,
        mobile: useMobile,
        browser: ["Chrome (Linux)", "", ""],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache,
    });

    // QR and pairing code generation
    if (pairingCode && !bot.authState.creds.registered) {
        phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

        setTimeout(async () => {
            let code = await bot.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.green(`Your Pairing Code: `), code);
        }, 3000);
    }

    // Handle connection updates
    bot.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log("✅ Bot connected successfully!");
            await delay(5000);
            await bot.sendMessage(bot.user.id, { text: "Bot connected. Welcome!" });
        } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode != 401) {
            console.log("Connection closed. Reconnecting...");
            startBot(); // Attempt to reconnect
        }
    });

    // Save new credentials when they are updated
    bot.ev.on("creds.update", saveCreds);

    // Event for handling incoming messages
    bot.ev.on("messages.upsert", async (messageUpdate) => {
        const msg = messageUpdate.messages[0];
        if (!msg.key.fromMe && msg.message) {
            console.log("New message received from:", msg.key.remoteJid);
            // Add additional command handling here
            await bot.sendMessage(msg.key.remoteJid, { text: "Hello! This is your bot responding." });
        }
    });
}

// Start the bot
startBot();

// Global error handling
process.on("uncaughtException", (err) => {
    console.error("Caught exception:", err);
});
