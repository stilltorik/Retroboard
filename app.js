var server = require('http').createServer();
var favicon = require('serve-favicon');

var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var express = require('express');
var app = express();
var port = 3000;

var board = require('./databaseBoard');


app.set('views', __dirname + '/frontend');
app.set('view engine', 'hbs');

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/frontend'));


// DB

mongoose.connect('mongodb://localhost/dev', function(err) {
 if (err) {
   throw err;
 }
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
 // we're connected!!
});

// routes

app.get('/', function (req, res) {
 res.render('index.hbs', {board: '{}'});
});

app.get('/createBoard', function (req, res) {
 res.render('createBoard/createBoard.hbs');
});
app.post('/api/createBoard', board.addBoard);

app.get('/:boardId/:boardTitle', function (req, res) {
  board.getBoard({_id: req.params.boardId})
  .then(function(board) {
    if(board.status !== 200) {
      res.send('Board not found!');
    } else {
      var newBoard = {
        title: board.board.title,
        boardId: board.board._id,
        sections: [],
        postits: board.board.postits
      }
      var sections = [];
      for (var i = 0; i < board.board.sections.length; i++) {
        var section = board.board.sections[i];
        if (section) {
          newBoard.sections.push({
            name: section.name,
            backgroundColor: section.backgroundColor
          });
        }
      }
      res.render('board/index.hbs', {board: JSON.stringify(newBoard)});
    }
  })
  .catch(function(err) {
    res.send('Board not found!');
  });
});


// Websockets
var id = 0;
wss.on('connection', function (ws) {
  var lockedPostits = {};
  ws.id = id;
  id++;
  var broadcastMessage = function(broadcastToSender, message) {
    wss.clients.forEach(function each(client) {
      if (broadcastToSender || (!broadcastToSender && client !== ws)) {
        client.send(JSON.stringify(message));
      }
    });
  };
  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    var response = {
      boardId: msg.boardId,
      postitIndex: msg.postitIndex,
      type: msg.type
    };
    if (msg.type === 'lock') {
      lockedPostits[msg.postitIndex] = ws.id;
      broadcastMessage(false, response);
    } else if (msg.type === 'unlock') {
      lockedPostits[msg.postitIndex] = undefined;
      broadcastMessage(true, response);
    } else if (msg.type === 'updatePostit') {
      board.updatePostit({
        boardId: msg.boardId,
        postits: msg.postits
      })
      .then(function() {
        response.postits = msg.postits;
        broadcastMessage(false, response);
      });
    } else if (msg.type === 'createPostit') {
      board.createPostit({
        _id: msg.boardId,
        postit: msg.postit
      }).then(function(response){
        broadcastMessage(true, {
          type: 'postitCreated',
          message: response
        });
      });
    } else if (msg.type === 'deletePostit') {
      board.deletePostit({
        _id: msg.boardId,
        postitId: msg.postitIndex
      }).then(function(res){
        broadcastMessage(true, {
          type: 'deletePostit',
          message: response
        });
      });
    } else if (msg.type === 'plus') {
      board.plus(msg)
      .then(function(res) {
        if (res.status === 200) {
          response.username = msg.username;
          broadcastMessage(false, response);
        }
      })
      .catch(function(err){
        console.log('Issue with msg.type plus');
        console.log(err);
      });
    } else if (msg.type === 'minus') {
      board.minus(msg)
      .then(function(res) {
        if (res.status === 200) {
          response.username = msg.username;
          broadcastMessage(false, response);
        }
      })
      .catch(function(err){
        console.log('Issue with msg.type minus');
        console.log(err);
      });
    }
    // send update to everyone if the database is not involved
    // or the database operation was successful.

  });
  ws.on('close', function () {
    var response = [];
    // unlock all postits of this user
    for (var postitId in lockedPostits) {
      if (lockedPostits[postitId] === ws.id) {
        lockedPostits[postitId] = undefined;
        response.push({
          type: 'unlock',
          postitId: postitId
        });
      }
    }
    if (response.length) {
      wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(response));
      });
    }
    console.log('stopping client interval');
  });
});


server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port); });
