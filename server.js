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
    return { saves: save }
}

function MapUsernamesToArray(save) {
    const players = []
    save.saves.forEach((history) => { if (!players.includes(history.client)) players.push(history.client) })
    return Object.assign({ players }, save)
}

function ReMapUsernames(save) {
    save.saves = save.saves.map((history) => Object.assign(history, { client: [save.players.indexOf(history.client)] }))
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
        if (!existsSync(`${seed}.sav`)) {
            this.messageHistory[seed] = this.convert([])
            return
        }

        console.log(`Loading game progress for ${seed}...`)
        const save = JSON.parse(String(readFileSync(`${seed}.sav`)))
        this.messageHistory[seed] = this.convert(save)
        console.log("Game progress loaded...")
    }

    create () {

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

function ValidatePacket(parsed) {
    if (Array.isArray(parsed.client)) {
        parsed.client = [...new Set(parsed.client)]
    }

    if (!parsed.index || parsed.checked === undefined) {
        return null
    }

    return parsed
}

const PacketHandlers = {
    0: (ws, parsed) => {
        if (parsed.version !== saveManager.serverVersion) {
            console.log("Received connection from incompatible client.")
            ws.send(JSON.stringify({}))
            ws.close()
            return
        }

        ws.seed = parsed.seed
        ws.username = parsed.client
        console.log(`Client connect with seed: ${ws.seed}`)

        if (!saveManager.has(ws.seed)) {
            saveManager.load(ws.seed)
        }

        const save = saveManager.get(ws.seed)
        if (save && !save.players.includes(ws.username)) {
            save.push(ws.username)
        }

        console.log("Synchronizing Client...");
        sendData(ws)
    },
    1: (ws, parsed) => {
        if (!ws.seed) {
            console.log("Received message but client has no seed assigned.")
            return
        }

        parsed = JSON.stringify(ValidatePacket(parsed))
        if (parsed === null) {
            console.error("Received invalid packet missing critical information.")
            return
        }

        console.log(`Received message => ${parsed}`)
        broadcast(ws.seed, parsed)
        saveManager.save(ws.seed)
    },
    6: (ws, parsed) => {
        const oldUsername = ws.username
        ws.username = parsed.client

        const save = saveManager.get(ws.seed)
        const index = save.players.indexOf(oldUsername)
        if (index !== -1) {
            save.players[index] = ws.username
        }

        broadcast(ws.seed, JSON.stringify({ op: 3 }), false)
        save.players.forEach((name) => {
            broadcast(ws.seed, JSON.stringify({ op: 4, name }), false)
        })
        broadcast(ws.seed, JSON.stringify({ op: 5 }), false)
    },
    7: (ws, parsed) => {}
}

wss.on("connection", (ws) => {
    console.log("Client connected");
    clients.push(ws);

    ws.on('message', (message) => {
        let parsed

        try {
            parsed = JSON.parse(message);
        } catch (err) {
            console.error("Failed to parse message:", message);
            return;
        }

        PacketHandlers[parsed.op](ws, parsed)
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        clients.splice(clients.indexOf(ws), 1);
    });
});

console.log(`Socket server started on port ${port}`);
