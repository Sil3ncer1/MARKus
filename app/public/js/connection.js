const socket = io('ws://localhost:8080');

socket.on('connected', docChanges => {

    const doc = document.getElementById('document-doc');

    socket.emit('document-changed', doc.innerHTML); 
});

socket.on('document-changed', docChanges => {
    const doc = document.getElementById('document-doc');
    doc.innerHTML = docChanges;
});