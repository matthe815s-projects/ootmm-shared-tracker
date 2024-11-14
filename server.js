// import WebSocket, {WebSocketServer} from "ws";
const { WebSocketServer, WebSocket } = require("ws");
const { writeFileSync, existsSync, readFileSync } = require("node:fs")

const port = 8080;

const wss = new WebSocketServer({ port });
const clients = [];

const SAVE_FORMAT = {
    V1: 1,
    KOKIRI: 2,
    GORON: 3
}

const SAVE_FORMATTER_STEPS = {
    2: [
      ArrayToJSONTransformer
    ],
    3: [
        MapUsernamesToArray,
        ReMapUsernames
    ]
}

function ArrayToJSONTransformer(save) {
    console.log("Convert array")
    console.log(save)
    return { saves: save }
}

function MapUsernamesToArray(save) {
    const players = []
    save.saves.forEach((history) => { if (!players.includes(history.client)) players.push(history.client) })
    return Object.assign({ players }, save)
}

function ReMapUsernames(save) {
    save.saves = save.saves.map((history) => Object.assign(history, { client: save.players.indexOf(history.client) }))
    return save
}

class SaveManager {
    serverVersion = SAVE_FORMAT.GORON
    messageHistory = {};

    getFormat (save) {
        if (Array.isArray(save)) return SAVE_FORMAT.V1;
        return save.version
    }

    convert (save) {
        let currentSaveFormat = this.getFormat(save)
        if (currentSaveFormat === this.serverVersion) return save

        console.log("Save file out of date. Converting to latest version.")
        while (currentSaveFormat < this.serverVersion) {
            currentSaveFormat+=1

            console.log(`Applying transformations for version ${currentSaveFormat}`)
            for (let step of SAVE_FORMATTER_STEPS[currentSaveFormat]) {
                save = step(save)
            }
            Object.assign(save, { version : currentSaveFormat })
        }

        console.log(save)
        return save
    }

    save (seed) {
        writeFileSync(`${seed}.sav`, JSON.stringify(this.messageHistory[seed]))
        console.log("Game progress saved...")
    }

    load (seed) {
        if (!existsSync(`${seed}.sav`)) return this.convert([])

        console.log(`Loading game progress for ${seed}...`)
        const save = JSON.parse(String(readFileSync(`${seed}.sav`)))
        this.messageHistory[seed] = this.convert(save)
        console.log("Game progress loaded...")
    }

    has (seed) {
        return this.messageHistory[seed] !== undefined
    }

    get (seed) {
        return this.messageHistory[seed] ?? this.convert([])
    }
}

const saveManager = new SaveManager()

function broadcast(seed, data, save=true) {
    if (save) saveManager.get(seed).saves.push(JSON.parse(String(data)))
    clients.forEach(client => {
        if (client.username === JSON.parse(data).client) return
        if (client.seed !== seed) return
        if (client.readyState !== WebSocket.OPEN) return
        client.send(data);
    });
}

function sendData(ws) {
    let history = saveManager.get(ws.seed)
    const save = history.saves

    // send history
    ws.send(JSON.stringify({ op: 0, size: save.length }));
    save.forEach((data) => {
        console.log(data)
        ws.send(JSON.stringify(data))
    })
    ws.send(JSON.stringify({ op: 2 }))

    // send player list
    ws.send(JSON.stringify({ op: 3 }));
    history.players.forEach((data) => {
        ws.send(JSON.stringify({ op: 4, name: data }))
    })
    ws.send(JSON.stringify({ op: 5 }))
}

wss.on("connection", (ws) => {
    console.log("Client connected");
    clients.push(ws);

    ws.on('message', (message) => {
        const parsed = JSON.parse(message)
        console.log(parsed)

        switch (parsed.op) {
            case 0:
                if (parsed.version !== saveManager.serverVersion) {
                    console.log("Received connection from incompatible client.")
                    ws.send(JSON.stringify({}))
                    ws.close()
                    return
                }

                ws.seed = parsed.seed
                ws.username = parsed.client
                console.log(`Received client seed`)
                if (!saveManager.has(ws.seed)) saveManager.load(ws.seed)
                if (!saveManager.get(ws.seed).players.includes(ws.username)) saveManager.get(ws.seed).players.push(ws.username)
                console.log("Synchronizing Client...");
                sendData(ws)
                break;
            case 1:
                if (!ws.seed) return console.log("Got message but no seed")
                console.log(`Received message => ${message}`);
                broadcast(ws.seed, message);
                saveManager.save(ws.seed)
                break;
            case 6:
                const oldUsername = ws.username
                ws.username = parsed.client
                saveManager.get(ws.seed).players[saveManager.get(ws.seed).players.indexOf(oldUsername)] = parsed.client
                broadcast(ws.seed, JSON.stringify({ op: 3 }), false);
                saveManager.get(ws.seed).players.forEach((data) => {
                    broadcast(ws.seed, JSON.stringify({ op: 4, name: data }), false)
                })
                broadcast(ws.seed, JSON.stringify({ op: 5 }), false)
                break;
            default:
                break;
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        clients.splice(clients.indexOf(ws), 1);
    });
});

console.log(`Socket server started on port ${port}`);
