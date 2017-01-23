(function(){
  app.init = function() {
    app.widgets.username.init();
    app.widgets.postitSelector.init();
  };
  app.onUsername = function() {
    app.widgets.postits.init();
    app.websocket.init();
  };

  app.websocket = {};
  app.websocket.init = function() {
    var host = window.document.location.host.replace(/:.*/, '');
    app.websocket.ws = new WebSocket('ws://' + host + ':3000');
    app.websocket.ws.onmessage = function(event) {
      var message = JSON.parse(event.data);
      if (message.type === 'postitCreated') {
        app.widgets.postits.addPostit(message.message.postit);
      } else if (message.type === 'updatePostit') {
        app.widgets.postits.updatePostits(message.postits);
      } else if (message.type === 'lock') {
        app.widgets.postits.lock(message.postitIndex);
      } else if (message.type === 'unlock') {
      app.widgets.postits.unlock(message.postitIndex);
      } else if (message.type === 'deletePostit') {
        app.widgets.postits.deletePostit(message.message.postitIndex);
      } else if (message.type === 'plus') {
        app.widgets.postits.updatePostits([message]);
      } else if (message.type === 'minus') {
        app.widgets.postits.updatePostits([message]);
      }
    };
  };
  app.websocket.lockPostit = function(postitIndex) {
    operation(postitIndex, 'lock');
  };
  app.websocket.unlockPostit = function(postitIndex) {
    operation(postitIndex, 'unlock');
  };
  app.websocket.deletePostit = function(postitIndex) {
    operation(postitIndex, 'deletePostit');
  };
  app.websocket.updatePostits = function(postits) {
    var config = {
      type: 'updatePostit',
      boardId: app.config.boardId,
      postits: postits
    };
    this.ws.send(JSON.stringify(config));
  };
  app.websocket.createPostit = function(postitConfig) {
    var config = {
      type: 'createPostit',
      boardId: app.config.boardId,
      postit: postitConfig
    };
    this.ws.send(JSON.stringify(config));
  };
  app.websocket.plus = function(postitIndex, username) {
    var config = {
      type: 'plus',
      boardId: app.config.boardId,
      postitIndex: postitIndex,
      username: username
    };
    this.ws.send(JSON.stringify(config));
  };
  app.websocket.minus = function(postitIndex, username) {
    var config = {
      type: 'minus',
      boardId: app.config.boardId,
      postitIndex: postitIndex,
      username: username
    };
    this.ws.send(JSON.stringify(config));
  };
  var operation = function(postitIndex, operationName) {
    var config = {
      type: operationName,
      boardId: app.config.boardId,
      postitIndex: postitIndex
    };
    app.websocket.ws.send(JSON.stringify(config));
  }

  app.widgets.username = {
    div: document.getElementById('getUsernameLayer'),
    input: document.getElementById('username')
  };
  app.widgets.username.init = function() {
    var previousName = localStorage.getItem('username');
    if (previousName) {
      this.input.value = previousName;
    }
  };
  app.widgets.username.submit = function() {
    if (!this.input.value) {
      alert('No name entered!');
      return;
    }
    localStorage.setItem('username', this.input.value);
    app.username = this.input.value;
    this.div.style.display = 'none';
    document.body.className = 'flexContainer';
    app.onUsername();
  };

  app.widgets.postitSelector = {
    container: document.getElementById('postitContainer')
  };
  app.widgets.postitSelector.init = function() {
    this.container.innerHTML = '';
    for (var i = 0; i < app.config.postitSections.length; i++) {
      var config = app.config.postitSections[i];
      var div = document.createElement('div');
      div.innerHTML = '<div class="postitSelectorTitle">' + config.name + '</div>';
      div.className = 'postitSelectorSection';
      div.appendChild(this.createPostit(config, true));
      this.container.appendChild(div);
    }
  };
  app.widgets.postitSelector.toggleColorSelection = function(elt) {
    var colorDropdown = elt.parentElement.getElementsByClassName('colorOptions')[0];
    if (colorDropdown.style.display === 'none') {
      colorDropdown.style.display = 'block';
    } else {
      colorDropdown.style.display = 'none';
    }
  }
  app.widgets.postitSelector.selectColor = function(elt, index) {
    var displayedColor = elt.parentElement.parentElement.getElementsByClassName('selectedColor')[0];
    displayedColor.setAttribute('data-index', index);
    displayedColor.style.backgroundColor = availableColorSchemes[index].backgroundColor;
    app.widgets.postitSelector.toggleColorSelection(elt.parentElement);
  };
  app.widgets.postitSelector.createPostit = function(config) {
    var postit = document.createElement('div');
    postit.className = 'postit';
    postit.style.backgroundColor = config.backgroundColor;
    postit.style.border = '1px solid ' + config.borderColor;
    postit.addEventListener('mousedown', app.widgets.postits.create.bind(this, config, postit));
    postit.innerHTML = '<div style="position: absolute; top: 54px">Click to create new postit</div>';
    postit.style.textAlign = 'center';
    postit.style.position = 'relative';
    return postit;
  };

  app.widgets.postits = {
    nextZIndex: 1,
    listPostitsElt: {}
  };
  app.widgets.postits.init = function() {
    for (var i = 0; i < app.config.postits.length; i++) {
      var postit = app.config.postits[i];
      app.widgets.postits.addPostit(postit);
    }
  };
  app.widgets.postits.create = function(config, parent) {
    app.websocket.createPostit({
        description: '',
        author: app.username,
        backgroundColor: config.backgroundColor,
        thumbsUp: [],
        top: parent.offsetTop + 10,
        left: parent.offsetLeft + 5,
        zIndex: app.widgets.postits.nextZIndex
    });
    //loader?
  };
  app.widgets.postits.addPostit = function(config) {
    var postit = document.createElement('div');
    postit.className = 'postit';
    postit.style.backgroundColor = config.backgroundColor;
    postit.style.border = '1px solid ' + config.borderColor;
    postit.title = 'Created by ' + config.author;
    postit.setAttribute('data-index', config.index);
    var hasUserPlussed = config.thumbsUp.indexOf(app.username) !== -1;
    postit.innerHTML = [
      '<div class="overlay"></div>',
      '<div style="position: absolute; right: 3px;" onclick="app.widgets.postits.deleteLocal(this)">x</div>',
      '<textarea class="postitText"',
      '  onkeyup="app.widgets.postits.updateDescription(this.parentElement, this.value)"',
      '  onblur="app.websocket.unlockPostit(this.parentElement.getAttribute(\'data-index\'))">' +
      config.description +
      '</textarea>',
      '<div class="plus" title="' +
      config.thumbsUp.join(' ') +
      '" data-plus-names="' +
      config.thumbsUp.join(' ') +
      '">',
      '  <span class="' +
      (hasUserPlussed? 'hasPlus': 'noPlus') +
      '" onclick="app.widgets.postits.plus(this)">l3</span>',
      '</div>'
    ].join('\n');
    postit.style.top = config.top;
    postit.style.left = config.left;
    this.nextZIndex = Math.max(config.zIndex || 1, this.nextZIndex);
    postit.style.zIndex = this.nextZIndex;
    this.nextZIndex++;
    document.body.appendChild(postit);
    this.listPostitsElt[config.index] = postit;
    app.dragAndDrop(
      postit,
      {
        onMove: function(elt) {
          app.widgets.postits.increaseZIndex(postit);
          app.websocket.lockPostit(config.index);
        },
        onStopMove: function(elt) {
          app.websocket.unlockPostit(postit.getAttribute('data-index'));
          app.websocket.updatePostits([{
            top: postit.offsetTop,
            left: postit.offsetLeft,
            zIndex: postit.style.zIndex,
            postitIndex: config.index
          }]);
        }
      }
    );
  };
  app.widgets.postits.increaseZIndex = function(postit) {
    postit.style.zIndex = app.widgets.postits.nextZIndex;
    app.widgets.postits.nextZIndex++;
  };
  app.widgets.postits.lock = function(postitIndex) {
    this.listPostitsElt[postitIndex].className = 'postit dragging locked';
  };
  app.widgets.postits.unlock = function(postitIndex) {
    this.listPostitsElt[postitIndex].className = 'postit dragging';
  };
  app.widgets.postits.updateDescription = function(postit, description) {
    var postitIndex = postit.getAttribute('data-index');
    app.websocket.lockPostit(postitIndex);
    app.websocket.updatePostits([{
      postitIndex: postitIndex,
      description: description
    }]);
  };
  app.widgets.postits.updatePostits = function(postits) {
    for (var i = 0; i < postits.length; i++) {
      var newPostit = postits[i];
      var postitsDom = this.listPostitsElt[newPostit.postitIndex];
      if (newPostit.top) postitsDom.style.top = newPostit.top + 'px';
      if (newPostit.left) postitsDom.style.left = newPostit.left + 'px';
      if (newPostit.zIndex) postitsDom.style.zIndex = newPostit.zIndex;
      if (newPostit.description)
        postitsDom.getElementsByTagName('textarea')[0].value = newPostit.description;
      if (newPostit.type === 'plus') {
        addPlus(postitsDom.getElementsByClassName('plus')[0], newPostit.username);
      } else if (newPostit.type === 'minus') {
        removePlus(postitsDom.getElementsByClassName('plus')[0], newPostit.username);
      }
    }
  };
  app.widgets.postits.plus = function(elt, isPlus) {
    var isPlus = elt.className === 'noPlus';
    var names = elt.parentElement.getAttribute('data-plus-names');
    var username = app.username;
    var postitIndex = elt.parentElement.parentElement.getAttribute('data-index');
    if (!username) {
      alert('No username!!');
    } else if (isPlus) {
      if (names.indexOf(username) === -1) {
        addPlus(elt.parentElement, username);
        app.websocket.plus(postitIndex, username);
        elt.className = 'hasPlus';
      }
    } else {
      if (names.indexOf(username) !== -1) {
        removePlus(elt.parentElement, username);
        app.websocket.minus(postitIndex, username);
        elt.className = 'noPlus';
      }
    }
  };
  var addPlus = function(domElt, name) {
    var listNames = (domElt.getAttribute('data-plus-names') || '') + ' ' + name;
    domElt.setAttribute('data-plus-names', listNames);
    domElt.title = listNames;
  };
  var removePlus = function(domElt, name) {
    var listNames = domElt.getAttribute('data-plus-names') || '';
    listNames = listNames.replace(new RegExp(name,'g'), '').replace(/\s+/g, ' ');
    domElt.setAttribute('data-plus-names', listNames);
    domElt.title = listNames;
  };
  app.widgets.postits.deleteLocal = function(elt) {
    var postit = elt.parentElement;
    var index = postit.getAttribute('data-index');
    app.websocket.deletePostit(index);
  };
  app.widgets.postits.deletePostit = function(postitIndex) {
    document.body.removeChild(this.listPostitsElt[postitIndex]);
    this.listPostitsElt[postitIndex] = undefined;
  };

  // app.widgets.userDetails = {
  //   section: document.getElementById('userDetails'),
  //   name: ''
  // };
  // app.widgets.userDetails.init = function() {
  //   this.section.innerHTML = this.emptySection();
  // };
  // app.widgets.userDetails.emptySection = function() {
  //   return [
  //     '  <input type="text" max-length="20" placeholder="Your name"',
  //     '   class="nameInput" onBlur="app.widgets.userDetails.updateName(this)">'
  //   ].join('\n');
  // };
  // app.widgets.userDetails.updateName = function(elt) {
  //   this.name = elt.value;
  // };
  // app.widgets.userDetails.toggleSection = function(elt) {
  //   var parentClasses = elt.parentElement.className;
  //   var openIndex = parentClasses.indexOf('open');
  //   if (openIndex != -1) {
  //     elt.parentElement.className = parentClasses.substring(0, openIndex) + 'closed';
  //   } else {
  //     elt.parentElement.className = parentClasses.substring(0, parentClasses.indexOf('closed')) + 'open';
  //   }
  // };
  app.init();

})();
