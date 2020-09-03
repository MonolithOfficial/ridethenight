// const content = require('fs').readFileSync(__dirname + '/index.html', 'utf8');

// const httpServer = require('http').createServer((req, res) => {
//     // serve the index.html file
//     res.setHeader('Content-Type', 'text/html');
//     res.setHeader('Content-Length', Buffer.byteLength(content));
//     res.end(content);
// });
// const io = require('socket.io')(httpServer);

const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
var io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const {performance} = require('perf_hooks');
const PORT = process.env.PORT || 3000;
let game_sockets = {}
let controller_sockets = {}

server.listen(PORT)
app.use("/public", express.static(__dirname + '/public'));


let startTime, endTime;

function start(){
    startTime = 0
    startTime = performance.now();
    console.log(startTime)
}

function end(){
    endTime = performance.now();
    let timeDiff = endTime - startTime;

    timeDiff /= 1000;

    let seconds = Math.round(timeDiff);
    console.log(`Time elapsed: ${timeDiff}`)
}


// httpServer.listen(3000, () => {
//     console.log('go to http://localhost:3000');
// });


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})


io.on('connect', socket => {
    socket.on('game_connect', () => {
        start()
        console.log('game connected')

        game_sockets[socket.id] = {
            socket: socket,
            controller_id: undefined
        }

        // console.log(game_sockets)
        socket.emit("game_connected")
    })

    socket.on('controller_connect', (game_socket_id) => {
        // Checking if there's already a controller present
        if (game_sockets[game_socket_id] && !game_sockets[game_socket_id].controller_id) {
            // If there's no controller present, let's add it
            console.log("Controller connected")

            // Adding controller to controller sockets
            controller_sockets[socket.id] = {
                socket: socket,
                game_id: game_socket_id
            }

            // Populating game_sockets' controller id field
            game_sockets[game_socket_id].controller_id = socket.id


            // console.log(controller_sockets)
            // The socket that received controller connection now emits that it was successfull
            game_sockets[game_socket_id].socket.emit('controller_connected', true)
            socket.on('controller_state_change', function(data){
                
                if (game_sockets[game_socket_id]){
                    game_sockets[game_socket_id].socket.emit('controller_state_change', data)
                }

            })
        } else {
            // If there's already a controller present
            console.log('Controller connection failed')
            // console.log(game_sockets)
            socket.emit('controller_connected', false)
        }
    })

    socket.on('disconnect', () => {
        // If the game's open
        if (game_sockets[socket.id]){
            console.log('Game disconnected')
            end()
            
            
            if (game_sockets[socket.id].controller_id){

                game_sockets[socket.id].socket.emit('controller_connected', false)
                game_sockets[socket.id].controller_id = undefined
            }

            // console.log(game_sockets)
            delete game_sockets[socket.id]
        }

        // If the controller's connected
        if (controller_sockets[socket.id]){
            console.log('Controller disconnected')
            // console.log(game_sockets)
            // console.log(controller_sockets)
            // console.log(game_sockets[controller_sockets.game_id])

            // game_sockets[controller_sockets.game_id].socket.emit('controller_disconnected')

            //If there's also a game connected simultaneously
            if (game_sockets[controller_sockets[socket.id].game_id]){

                game_sockets[controller_sockets[socket.id].game_id].socket.emit("controller_connected", false);
                game_sockets[controller_sockets[socket.id].game_id].controller_id = undefined;
            }

            // console.log(controller_sockets)
            delete controller_sockets[socket.id]
        }

    })
});

// io.on('message', data => {
//     console.log(data);
// });

console.log(`Server is running on port ${PORT}`)
