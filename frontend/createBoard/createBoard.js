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
    var data = {
      title: formElements['boardName'].value,
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
    app.postitsConfig[index] = undefined;
    postit.parentElement.removeChild(postit);
  };

  app.postitForm.createPostitSection = function(event) {
    event.preventDefault();
    var colorScheme = document.getElementById('colorScheme').value;
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
