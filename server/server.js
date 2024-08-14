const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

async function getNanoid() {
    const { nanoid } = await import('nanoid');
    return nanoid;
}

const rooms = [];

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('create-room', async (docContent) => {
        const nanoid = await getNanoid();
        const roomID = nanoid(6);
        let newRoom = {
            id: rooms.length,
            roomID: roomID,
            content: docContent,
            users: [socket.id],
            stateManager: new StateManager(docContent)
        };
        newRoom.stateManager.pushState(docContent);
        rooms.push(newRoom);
        
        socket.join(roomID);
        socket.emit('room-created', roomID);
        console.log(`Room created with ID: ${roomID}`);
    });

    socket.on('join-room', (roomID) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            room.users.push(socket.id);
            socket.join(roomID);
            socket.emit('room-joined', roomID, room.content.join(''));
            console.log(`User joined room with ID: ${roomID}`);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('disconnect', () => {
        console.log('a user disconnected: ' + socket.id);
        rooms.forEach(room => {
            room.users = room.users.filter(userID => userID !== socket.id);
        });
    });

    socket.on('element-changed', (roomID, change) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            room.content[change.position-1] = change.content;
            io.to(roomID).emit('element-changed', change);
        }
    });

    socket.on('element-removed', (roomID, change) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            room.content.splice(change.position, 1);
            io.to(roomID).emit('element-removed', change.id);
        }
    });

    socket.on('element-switched', (roomID, change) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            [room.content[change.position1], room.content[change.position2]] = [room.content[change.position2], room.content[change.position1]];
            io.to(roomID).emit('element-swapped', change);
        }
    });

    socket.on('editing-element', (roomID, elementID) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            io.to(roomID).emit('editing-element', elementID);
        }
    });

    socket.on('state-undo', roomID => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            io.to(roomID).emit('send-undo', room.stateManager.undo());
        }
    });

    socket.on('state-redo', roomID => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            io.to(roomID).emit('send-redo', room.stateManager.redo());
        }
    });

    socket.on('state-push', roomID => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            room.stateManager.pushState(room.content);
        }
    });
});



class StateManager {
    constructor(targetElement) {
        this.targetElement = targetElement;
        this.stateHistory = [];
        this.currentStateIndex = -1;
    }

    pushState(stateArray) {
        // Ensure we're storing a copy of the array to avoid mutations
        const stateCopy = [...stateArray];

        // Clear any redo history if a new state is pushed
        this.stateHistory = this.stateHistory.slice(0, this.currentStateIndex + 1);

        // Push the new state and update the current state index
        this.stateHistory.push(stateCopy);
        this.currentStateIndex = this.stateHistory.length - 1;
    }

    undo() {
        if (this.currentStateIndex > 0) {
            this.currentStateIndex--;
            return [...this.stateHistory[this.currentStateIndex]];  // Return a copy of the state
        }
        return null;
    }

    redo() {
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.currentStateIndex++;
            return [...this.stateHistory[this.currentStateIndex]];  // Return a copy of the state
        }
        return null;
    }
}

http.listen(8080, () => console.log('listening on http://localhost:8080'));
