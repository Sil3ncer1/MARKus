
const http = require('http').createServer();

const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

let doc;

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    io.emit('connected', doc);

    socket.on('document-changed', (docChanges) =>     {
        doc = docChanges;
        io.emit('document-changed', doc);
    });
});

http.listen(8080, () => console.log('listening on http://localhost:8080') );



 
