(function(){
  var closingSymbol = '❌';
  var defaultPostitConfig = [
    {
      name: 'Good',
      backgroundColor: '#1DF00A'
    },
    {
      name: 'Bad',
      backgroundColor: '#F00A28'
    },
    {
      name: 'Action items',
      backgroundColor: '#1417DE'
    }
  ];
  app = {
    postitsConfig: defaultPostitConfig,
    postitForm: {
      container: document.getElementById('addPostitSection')
    }
  };
  app.createBoard = function(event, form) {
    event.preventDefault();
    var formElements = document.forms.createBoard.elements;
    var title = formElements['boardName'].value.trim();
    if (title === '') {
      app.addError('No board title was provided!');
      return;
    }
    var nbPostits = 0;
    for(var i = 0; i < app.postitsConfig.length; i++) {
      if (app.postitsConfig[i]) nbPostits++;
    }
    if (nbPostits === 0) {
      app.addError('No postit section provided!');
      return;
    }
    var data = {
      title: title,
      sections: app.postitsConfig
    };
    ajax.post('/api/createBoard', data, function(response, error) {
      if (error) {
        alert(error);
      } else {
        window.location.href = '/' + response._id + '/' + response.title.replace(/ /g,"_");
      }
    });
  };
  app.addError = function(message) {
    crate.init({
      setBody: message,
      closeActions: {button: true, clickOut: true}
    });
    //alert(message);
  };

  app.postitForm.init = function() {
    this.container.innerHTML = '';
    var outerDiv = document.createElement('div');
    outerDiv.className = "postitSelectorContainer";
    for (var i = 0; i < app.postitsConfig.length; i++) {
      var config = app.postitsConfig[i];
      if (config === undefined) continue;
      var div = document.createElement('div');
      div.setAttribute('data-index', i);
      div.innerHTML = [
        '<div class="postitSelectorTitle">',
        config.name,
        '</div>'
      ].join('');
      div.className = 'addedPostit';
      div.appendChild(this.createPostit(config, true));
      outerDiv.appendChild(div);
    }
    this.container.appendChild(outerDiv);
  };

  app.postitForm.delete = function(elt) {
    var postit = elt.parentElement.parentElement;
    var index = postit.getAttribute('data-index');
    // delete app.postitsConfig is not an option, as we want to make sure that
    // the index of the postit in app.postitsConfig is the same as the value
    // of the attribute data-index.
    app.postitsConfig[index] = undefined;
    postit.parentElement.removeChild(postit);
  };

  app.postitForm.createPostitSection = function(event) {
    event.preventDefault();
    var colorScheme = document.getElementById('colorScheme').value;
    var postitSectionName = document.getElementById('postitNameInput').value.trim();
    if (postitSectionName === '') {
      app.addError('No postit section name provided!');
      return;
    }
    app.postitsConfig.push({
      name: document.getElementById('postitNameInput').value,
      backgroundColor: colorScheme
    });
    this.init();
  };
  app.postitForm.createPostit = function(config, isTitle) {
    var postit = document.createElement('div');
    postit.className = 'postit';
    postit.style.backgroundColor = config.backgroundColor;
    postit.style.border = '1px solid ' + config.borderColor;
    postit.innerHTML =
      '<div style="position: absolute; right: 3px; cursor: pointer" onclick="app.postitForm.delete(this)">' + closingSymbol + '</div>';

    return postit;
  };
})();
app.postitForm.init();
