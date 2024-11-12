// import WebSocket, {WebSocketServer} from "ws";
const { WebSocketServer, WebSocket } = require("ws");
const { writeFileSync, existsSync, readFileSync } = require("node:fs")

const port = 8080;

const wss = new WebSocketServer({ port });
const clients = [];
const messageHistory = {};

const SAVE_FORMAT = {
    V1: 1,
    KOKIRI: 2
}

const SERVER_VERSION = SAVE_FORMAT.KOKIRI

function getSaveFormat(save) {
    if (Array.isArray(save)) return SAVE_FORMAT.V1;
    return save.version
}

function convertSaveFormat(save) {
    switch (getSaveFormat(save)) {
        case SAVE_FORMAT.V1:
            return { version: SAVE_FORMAT.KOKIRI, players: [], saves: save }
        default:
            return save
    }
}

function broadcast(seed, data) {
    if (!messageHistory[seed]) messageHistory[seed] = { version: SAVE_FORMAT.KOKIRI, players: [], saves: [] }
    messageHistory[seed].saves.push(JSON.parse(String(data)))
    clients.forEach(client => {
        if (client.username === JSON.parse(data).client) return
        if (client.seed !== seed) return
        if (client.readyState !== WebSocket.OPEN) return
        client.send(data);
    });
}

function saveGame(seed) {
    writeFileSync(`${seed}.sav`, JSON.stringify(messageHistory[seed]))
    console.log("Game progress saved...")
}

function loadGame(seed) {
    console.log(`Loading game progress for ${seed}...`)
    if (!existsSync(`${seed}.sav`)) return
    messageHistory[seed] = convertSaveFormat(JSON.parse(String(readFileSync(`${seed}.sav`))))
    console.log("Game progress loaded...")
}

function sendData(ws) {
    let history = messageHistory[ws.seed] ?? []
    ws.send(JSON.stringify({ op: 0, size: history.length }));

    const save = history.saves
    save.forEach((data) => {
        console.log(data)
        ws.send(JSON.stringify(data))
    })
    ws.send(JSON.stringify({ op: 2 }))
}

wss.on("connection", (ws) => {
    console.log("Client connected");
    clients.push(ws);

    ws.on('message', (message) => {
        const parsed = JSON.parse(message)
        console.log(parsed)

        switch (parsed.op) {
            case 0:
                if (parsed.version !== SERVER_VERSION) {
                    console.log("Received connection from incompatible client.")
                    ws.send(JSON.stringify({}))
                    ws.close()
                    return
                }

                ws.seed = parsed.seed
                if (messageHistory[ws.seed] === undefined) loadGame(ws.seed)
                console.log(`Received client seed`)
                console.log("Synchronizing Client...");
                sendData(ws)
                break;
            case 1:
                if (!ws.seed) return console.log("Got message but no seed")
                ws.username = parsed.client
                console.log(`Received message => ${message}`);
                broadcast(ws.seed, message);
                saveGame(ws.seed)
                break;
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        clients.splice(clients.indexOf(ws), 1);
    });
});

console.log(`Socket server started on port ${port}`);
