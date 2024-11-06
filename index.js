// ⚠️ Do not copy without giving credit!
// Bot connection script for WhatsApp using Baileys library
// Created by [Your GitHub Username] - https://github.com/[Your GitHub Username]
// 🖕 to those who copy without credit

const makeWASocket = require("@whiskeysockets/baileys").default;
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const pino = require("pino");
const { delay, useMultiFileAuthState, fetchLatestBaileysVersion, PHONENUMBER_MCC, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const chalk = require("chalk");
const readline = require("readline");

let phoneNumber = "916909137213";

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    let { version, isLatest } = await fetchLatestBaileysVersion();
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
        getMessage: async (key) => {
            let jid = key.remoteJid;
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        },
        msgRetryCounterCache,
    });

    if (pairingCode && !bot.authState.creds.registered) {
        let phoneNumber;
        if (phoneNumber) {
            phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
        } else {
            phoneNumber = await question(chalk.green("Please type your WhatsApp number (e.g., +916909137213): "));
            phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
            rl.close();
        }

        setTimeout(async () => {
            let code = await bot.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.green(`Your Pairing Code: `), code);
        }, 3000);
    }

    bot.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log("✅ Bot connected successfully!");
            await delay(5000);
            await bot.sendMessage(bot.user.id, { text: "Bot connected. Welcome!" });
            process.exit(0);
        } else if (connection === "close" && lastDisconnect && lastDisconnect.error?.output?.statusCode != 401) {
            console.log("Connection closed. Reconnecting...");
            startBot();
        }
    });

    bot.ev.on("creds.update", saveCreds);
    bot.ev.on("messages.upsert", async (messageUpdate) => {
        // Add handling for new messages here
    });
}

startBot();

process.on("uncaughtException", function (err) {
    console.log("Caught exception:", err);
});
              
