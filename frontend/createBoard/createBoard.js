(function(){
  var availableColorSchemes = [
    {
      backgroundColor: 'blue'
    },
    {
      backgroundColor: 'red'
    },
    {
      backgroundColor: 'green'
    },
    {
      backgroundColor: 'yellow'
    },
  ];
  var defaultPostitConfig = [
    {
      name: 'Good',
      backgroundColor: '#F00A28'
    },
    {
      name: 'Bad',
      backgroundColor: '#1DF00A'
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
    this.container.appendChild(app.postitForm.addPostitForm());
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
      div.className = 'postitSelectorSection';
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

  app.postitForm.addPostitForm = function() {
    var div = document.createElement('div');
    var colorsOptions = '';
    for (var i = 0; i < availableColorSchemes.length; i++) {
      var scheme = availableColorSchemes[i];
      colorsOptions += [
        '      <div class="option"',
        ' style="background-color: ',
        scheme.backgroundColor,
        '; border: 1px solid black',
        '" onclick="app.postitForm.selectColor(this, ',
        i,
        ')"></div>'
      ].join('');
    }
    div.innerHTML = [
      '<div class="postitSelectorSection">',
      '  <input placeholder="Section title" class="name">',
      '  <br>',
      '  <div class="colorScheme">',
      '    <div class="selectedColor" onclick="app.postitForm.toggleColorSelection(this)"></div>',
      '    <div class="colorOptions" style="display: none">',
      colorsOptions,
      '    </div>',
      '  </div>',
      '  <br>',
      '  <button onclick="app.postitForm.createPostitSection(event, this)">Add section</button>',
      '</div>'
    ].join('\n');
    return div;
  };
  app.postitForm.toggleColorSelection = function(elt) {
    var colorDropdown = elt.parentElement.getElementsByClassName('colorOptions')[0];
    if (colorDropdown.style.display === 'none') {
      colorDropdown.style.display = 'block';
    } else {
      colorDropdown.style.display = 'none';
    }
  }
  app.postitForm.selectColor = function(elt, index) {
    var displayedColor = elt.parentElement.parentElement.getElementsByClassName('selectedColor')[0];
    displayedColor.setAttribute('data-index', index);
    displayedColor.style.backgroundColor = availableColorSchemes[index].backgroundColor;
    app.postitForm.toggleColorSelection(elt.parentElement);
  };
  app.postitForm.createPostitSection = function(event, elt) {
    event.preventDefault();
    var parent = elt.parentElement;
    var colorScheme = availableColorSchemes[
      +parent.getElementsByClassName('selectedColor')[0].getAttribute('data-index')
    ];
    app.postitsConfig.push({
      name: parent.getElementsByClassName('name')[0].value,
      backgroundColor: colorScheme.backgroundColor
    });
    this.init();
  };
  app.postitForm.createPostit = function(config, isTitle) {
    var postit = document.createElement('div');
    postit.className = 'postit';
    postit.style.backgroundColor = config.backgroundColor;
    postit.style.border = '1px solid ' + config.borderColor;
    postit.innerHTML =
      '<div style="position: absolute; right: 3px; cursor: pointer" onclick="app.postitForm.delete(this)">x</div>';

    return postit;
  };
})();
app.postitForm.init();
