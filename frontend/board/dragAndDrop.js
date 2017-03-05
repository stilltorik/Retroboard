/*
  # Coded by /thezillion/
  https://thezillion.wordpress.com/2012/09/27/javascript-draggable-2-no-jquery/
*/
(function() {
  var is_element_having_set_coordinates = function(el){
    var b = el.style.position;
    if (!b || b != 'absolute'){
      el.style.position = 'absolute';
      var posX = el.offsetTop + 'px';
      var posY = el.offsetLeft + 'px';
      el.style.top = posX;
      el.style.left = posY;
    }
  };
  var startMoving = function(evt, elt) {
    evt = evt || window.event;
    is_element_having_set_coordinates(elt);
    var posX = evt.clientX;
    var posY = evt.clientY;
    var divTop = elt.style.top;
    var divLeft = elt.style.left;
    divTop = divTop.replace('px','');
    divLeft = divLeft.replace('px','');
    var diffX = posX - divLeft;
    var diffY = posY - divTop;
    document.onmousemove = function(evt){
      evt = evt || window.event;
      var posX = evt.clientX;
      var posY = evt.clientY;
      var aX = posX - diffX;
      var aY = posY - diffY;
      move(elt,aX,aY);
    }
    document.onwheel = function(e) {
      e.preventDefault();
      stopMoving(e, elt);
    }
  };
  var stopMoving = function(){
    document.onmousemove = function(){};
    document.onwheel = function() {};
  };
  var move = function(elt, xpos, ypos){
    elt.style.left = xpos + 'px';
    elt.style.top = ypos + 'px';
  };
  app.dragAndDrop = function(elt, config){
    elt.className += ' dragging';
    elt.onmousedown = function(event){
      startMoving(event, this);
      if (config.onMove) config.onMove(elt);
    }
    elt.onmouseup = function(event){
      stopMoving(event, this);
      if (config.onStopMove) config.onStopMove(elt);
    }
  };
})();
