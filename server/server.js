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
            users: [socket.id]
        };

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
            socket.emit('room-joined', roomID, room.content);
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
            room.content = change;
            io.to(roomID).emit('element-changed', change);
        }
    });

    socket.on('element-removed', (roomID, elementID) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            io.to(roomID).emit('element-removed', elementID);
        }
    });

    socket.on('editing-element', (roomID, elementID) => {
        const room = rooms.find(room => room.roomID === roomID);
        if (room) {
            io.to(roomID).emit('editing-element', elementID);
        }
    });
});

http.listen(8080, () => console.log('listening on http://localhost:8080'));
