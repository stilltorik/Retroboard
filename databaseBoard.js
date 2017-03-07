var mongoose = require('mongoose');

var BoardSchema = new mongoose.Schema ({
  title: String,
  nextPostitIndex: { type: Number, default : 0 },
	sections: [{
      name: String,
      backgroundColor: String
  }],
  postits: [{
    index: Number,
    description: String,
    backgroundColor: String,
    author: String,
    thumbsUp: [String],
    top: Number,
    left: Number,
    zIndex: Number
  }],
	creationDate : { type : Date, default : Date.now }
});

var Board = mongoose.model('Board', BoardSchema);

exports.addBoard = function(req, res) {
  var sections = [];
  for (var i = 0; i < req.body.sections.length; i++) {
    if (req.body.sections[i]) {
      sections.push(req.body.sections[i]);
    }
  }
  new Board ({
    title: req.body.title,
		sections: req.body.sections,
    postits: []
	}).save(function (err, board){
		if (err) {
      console.log(err);
			res.json(err);
		} else {
			res.status(200).send(board);
		}
	});
};

exports.getBoard = function(config) {
  return Board.find({_id: config._id}).limit(1)
  .then(function(board) {
    board = board[0];
    if (!board) {
      return {
        status: 204,
        error: 'Board not found'
      }
    }
    return {
      status: 200,
      board: board
    };
  })
  .catch(function(err) {
    console.log(err);
    return {
      status: 400,
      error: err
    };
  });
};

exports.removeBoard = function(req, res) {
  Board.remove({_id: req.body._id}, function(err, nbRemoved) {
    if (err) {
      res.json(err);
    } else if (nbRemoved === 0){
      //TODO remove send
      res.send("Nothing removed");
    } else {
      //TODO remove send
      res.send(nbRemoved + ' events successfully deleted');
    }
  });
};

exports.deletePostit = function(config) {
  return Board.findOne({_id: config._id}, function(err, board) {
    var postits = board.postits;
    var postitId = config.postitId;
    var indexPostitToRemove = findPostit(postits, postitId);

    if (indexPostitToRemove > -1) {
      postits.splice(indexPostitToRemove, 1);
      board.save(function(err, b) {
        if (err) {
          console.log('Delete save failed.');
          console.log(err);
          return {
            status: 400,
            error: err
          };
        } else {
          return {
            status: 200
          };
        }
      });
    } else {
      console.log('Postit does not exist.');
      console.log(err);
      return {
        status: 204,
        message: 'Postit does not exist.'
      }
    }
  });
};

exports.createPostit = function(config) {
  return Board.find({_id: config._id}).limit(1)
  .then(function(board) {
    board = board[0];
    var nextPostitIndex = board.nextPostitIndex;
    var postit = addNewPostit(config.postit);
    postit.index = nextPostitIndex;
    board.nextPostitIndex++;
    board.postits.push(postit);
    return board.save()
    .then(function(b) {
      return {
        status: 200,
        postit: postit
      };
    })
    .catch(function(err) {
      console.log(err);
      return {
        status: 401,
        error: err
      };
    });
  })
  .catch(function(err) {
    console.log(err);
    return {
      status: 402,
      error: err
    };
  });
};

exports.updatePostit = function(config) {
  // use db.my_collection.update( { _id : ... }, { $inc : { y : 2 } } ); // increment y by 2
  // rather than board.save();
  var newPostits = config.postits;
  return Board.findOne({_id: config.boardId})
  .then(function(board) {
    for (var i = 0; i <newPostits.length; i++) {
      var postit = newPostits[i];
      var postitIndex = findPostit(board.postits, postit.postitIndex);
      if (postitIndex == -1) {
        return {
          status: 400
        }
      }
      var existingPostit = board.postits[postitIndex];
      defaultObject(existingPostit, postit);
    }
    return board.save()
    .then(function(b) {
      return {
        status: 200
      };
    })
    .catch(function(err) {
      console.log(err);
      return {
        status: 400,
        error: err
      };
    });
  })
  .catch(function(err) {
    console.log(err);
    return {
      status: 400,
      error: err
    };
  });
};

exports.plus = function(config) {
  return Board.findOne({_id: config.boardId})
  .then(function(board) {
    var postitIndex = findPostit(board.postits, config.postitIndex);
    if (postitIndex === -1) {
      return {
        status: 204
      }
    }
    var index = board.postits[postitIndex].thumbsUp.indexOf(config.username);
    if (index !== -1) {
      return {
        status: 204
      }
    } else {
      board.postits[postitIndex].thumbsUp.push(config.username);
      // TODO replace save by update
      return board.save()
      .then(function(b) {
        return {
          status: 200
        };
      })
      .catch(function(err) {
        console.log(err);
        return {
          status: 400,
          error: err
        };
      });
    }
  })
  .catch(function(err) {
    console.log(err);
    return {
      status: 400,
      error: err
    };
  });
}

exports.minus = function(config) {
  return Board.findOne({_id: config.boardId})
  .then(function(board) {
    var postitIndex = findPostit(board.postits, config.postitIndex);
    if (postitIndex === -1) {
      return {
        status: 204
      }
    }
    var index = board.postits[postitIndex].thumbsUp.indexOf(config.username);
    if (index === -1) {
      return {
        status: 204
      }
    } else {
      board.postits[postitIndex].thumbsUp.splice(index, 1);
      // TODO replace save by update
      return board.save()
      .then(function(b) {
        return {
          status: 200
        };
      })
      .catch(function(err) {
        console.log(err);
        return {
          status: 400,
          error: err
        };
      });
    }
  })
  .catch(function(err) {
    console.log(err);
    return {
      status: 400,
      error: err
    };
  });
}
var findPostit = function(listPostits, postitIndex) {
  for (var i = 0; i < listPostits.length; i++) {
    if (listPostits[i].index === +postitIndex) return i;
  }
  return -1;
};

var defaultObject = function(baseObject, newValues) {
  for (var key in newValues) {
    if (newValues.hasOwnProperty(key)) {
      baseObject[key] = newValues[key];
    }
  }
  return baseObject;
};

var addNewPostit = function(postit) {
  return {
    description: postit.description || '',
    author: postit.author,
    backgroundColor: postit.backgroundColor,
    thumbsUp: [],
    top: postit.top,
    left: postit.left,
    zIndex: postit.zIndex
  };
};
