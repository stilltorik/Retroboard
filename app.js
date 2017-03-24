var server = require('http').createServer();
var favicon = require('serve-favicon');

var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var express = require('express');
var app = express();
var port = 3001;

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
  // TODO move to config json file
  var postits = [
    {
      text: 'Scrum retrospective',
      color: 'rgb(240, 10, 40)',
      top: '5px',
      left: '70px',
      plus: 5
    }, {
      text: 'Brainstorming',
      color: 'rgb(240, 10, 40)',
      top: '5px',
      left: '200px',
      plus: 2
    }, {
      text: 'Information sharing',
      color: 'rgb(240, 10, 40)',
      top: '116px',
      left: '5px',
      plus: 4
    }, {
      text: 'To do lists',
      color: 'rgb(240, 10, 40)',
      top: '116px',
      left: '140px',
      plus: 2
    }, {
      text: 'Etc...',
      color: 'rgb(240, 10, 40)',
      top: '116px',
      left: '280px',
      plus: 3
    }, {
      text: 'Personalise your board',
      color: 'rgb(29, 240, 10)',
      top: '50px',
      left: '450px',
      plus: 4
    }, {
      text: 'Create/delete postits',
      color: 'rgb(29, 240, 10)',
      top: '50px',
      left: '575px',
      plus: 5
    }, {
      text: 'Move postits',
      color: 'rgb(29, 240, 10)',
      top: '215px',
      left: '450px',
      plus: 2
    }, {
      text: 'Upvote',
      color: 'rgb(29, 240, 10)',
      top: '215px',
      left: '575px',
      plus: 3
    }, {
      text: 'Free to use!',
      color: 'rgb(20, 23, 222)',
      top: '300px',
      left: '130px',
      plus: 5
    }, {
      text: 'No account needed',
      color: 'rgb(20, 23, 222)',
      top: '350px',
      left: '240px',
      plus: 3
    }, {
      text: 'Open source - click to contribute',
      link: 'https://github.com/stilltorik/Retroboard',
      color: 'rgb(20, 23, 222)',
      top: '437px',
      left: '170px',
      plus: 2
    }, {
      text: 'Optimized for:\n • Chrome\n • Firefox',
      color: 'rgb(255, 255, 0)',
      top: '417px',
      left: '520px',
      plus: 2
    }
  ]
 res.render('homePage/homePage.hbs', {postits: postits});
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
      res.render('board/board.hbs', {board: JSON.stringify(newBoard)});
    }
  })
  .catch(function(err) {
    res.send('Board not found!');
  });
});


app.get('/listBoards', function (req, res) {
  board.getAllBoards()
  .then(function(boards) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(boards));
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
