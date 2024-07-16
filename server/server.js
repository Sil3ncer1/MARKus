const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

async function getNanoid() {
    const { nanoid } = await import('nanoid');
    return nanoid;
}

const rooms = {};

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('create-room', async () => {
        const nanoid = await getNanoid();
        const roomID = nanoid(6);
        rooms[roomID] = '';
        socket.join(roomID);
        socket.emit('room-created', roomID);
        console.log(`Room created with ID: ${roomID}`);
    });

    socket.on('join-room', (roomID) => {
        if (rooms[roomID] !== undefined) {
            socket.join(roomID);
            socket.emit('room-joined', roomID, rooms[roomID]);
            console.log(`User joined room with ID: ${roomID}`);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('document-changed', (roomID, docChanges) => {
        rooms[roomID] = docChanges;
        io.to(roomID).emit('document-changed', docChanges);
    });

    socket.on('disconnect', () => {
        console.log('a user disconnected: ' + socket.id);
    });
});

http.listen(8080, () => console.log('listening on http://localhost:8080'));
