// import WebSocket, {WebSocketServer} from "ws";
const { WebSocketServer, WebSocket } = require("ws");
const { writeFileSync, existsSync, readFileSync } = require("node:fs")

const port = 8080;

const wss = new WebSocketServer({ port });
const clients = [];

const SAVE_FORMAT = {
    V1: 1,
    KOKIRI: 2
}

const SAVE_FORMATTER_STEPS = {
    2: [
      ArrayToJSONTransformer
    ]
}

function ArrayToJSONTransformer(save) {
    return { saves: save }
}

class SaveManager {
    serverVersion = SAVE_FORMAT.KOKIRI
    messageHistory = {};

    getFormat (save) {
        if (Array.isArray(save)) return SAVE_FORMAT.V1;
        return save.version
    }

    convert (save) {
        let currentSaveFormat = this.getFormat(save)
        if (currentSaveFormat === this.serverVersion) return

        console.log("Save file out of date. Converting to latest version.")
        while (currentSaveFormat < this.serverVersion) {
            currentSaveFormat+=1

            console.log(`Applying transformations for version ${currentSaveFormat}`)
            for (let step of SAVE_FORMATTER_STEPS[currentSaveFormat]) {
                save = step(save)
            }
            Object.assign(save, { version : currentSaveFormat })
        }
        return save
    }

    save (seed) {
        writeFileSync(`${seed}.sav`, JSON.stringify(this.messageHistory[seed]))
        console.log("Game progress saved...")
    }

    load (seed) {
        if (!existsSync(`${seed}.sav`)) return

        console.log(`Loading game progress for ${seed}...`)
        this.messageHistory[seed] = this.convert(JSON.parse(String(readFileSync(`${seed}.sav`))))
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

function broadcast(seed, data) {
    saveManager.get(seed).saves.push(JSON.parse(String(data)))
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

    ws.send(JSON.stringify({ op: 0, size: save.length }));
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
                if (parsed.version !== saveManager.serverVersion) {
                    console.log("Received connection from incompatible client.")
                    ws.send(JSON.stringify({}))
                    ws.close()
                    return
                }

                ws.seed = parsed.seed
                if (!saveManager.has(ws.seed)) saveManager.load(ws.seed)
                console.log(`Received client seed`)
                console.log("Synchronizing Client...");
                sendData(ws)
                break;
            case 1:
                if (!ws.seed) return console.log("Got message but no seed")
                ws.username = parsed.client
                console.log(`Received message => ${message}`);
                broadcast(ws.seed, message);
                saveManager.save(ws.seed)
                break;
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        clients.splice(clients.indexOf(ws), 1);
    });
});

console.log(`Socket server started on port ${port}`);
