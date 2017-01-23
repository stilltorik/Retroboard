(function(){
  window.ajax = {};
  var xhr = new XMLHttpRequest();
  ajax.post = function(url, data, cb) {
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status != 200) {
        cb(xhr, JSON.parse(xhr.responseText));
      } else {
        cb(JSON.parse(xhr.responseText));
      }
    };
    xhr.send(JSON.stringify(data));
  }
})();
