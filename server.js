// import WebSocket, {WebSocketServer} from "ws";
const { WebSocketServer, WebSocket } = require("ws");
const { writeFileSync, existsSync, readFileSync } = require("node:fs")

const port = 8080;

const wss = new WebSocketServer({ port });
const clients = [];
const messageHistory = {};

function broadcast(seed, data) {
    if (!messageHistory[seed]) messageHistory[seed] = []
    messageHistory[seed].push(JSON.parse(String(data)))
    clients.forEach(client => {
        if (client.username == JSON.parse(data).client) return
        if (client.seed != seed) return
        if (client.readyState !== WebSocket.OPEN) return
        client.send(data);
    });
}

function saveGame(seed) {
    console.log(messageHistory[seed])
    writeFileSync(`${seed}.sav`, JSON.stringify(messageHistory[seed]))
    console.log("Game progress saved...")
}

function loadGame(seed) {
    console.log(`Loading game progress for ${seed}...`)
    if (!existsSync(`${seed}.sav`)) return
    console.log( messageHistory[seed] )
    messageHistory[seed] = JSON.parse(String(readFileSync(`${seed}.sav`)))
    console.log( messageHistory[seed] )
    console.log("Game progress loaded...")
}

function sendData(ws) {
    let history = messageHistory[ws.seed] ?? []
    console.log(history)
    ws.send(JSON.stringify({ op: 0, size: history.length }))
    history.forEach((data) => {
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
                ws.seed = parsed.seed
                if (messageHistory[ws.seed] == undefined) loadGame(ws.seed)
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