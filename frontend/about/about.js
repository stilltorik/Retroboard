(function() {
  window.app = {};

  app.sendMessage = function(form) {
    document.getElementById('loader').style.display = 'block';
    var data = {
      email: form.inputEmail.value,
      message: form.inputMessage.value
    };


    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var response = JSON.parse(xmlHttp.responseText);
        if (response.status === 200) {
          tracking.trackEmailSent({
            success: true,
            email: data.email,
            message: data.message
          });
          crate.init({
            setBody: 'Your message was successfully sent!',
            closeActions: {button: true, clickOut: true}
          });
        } else {
          tracking.trackEmailSent({
            success: false,
            email: data.email,
            message: data.message
          });
          crate.init({
            setBody: 'There was a technical issue. Please try again later.',
            closeActions: {button: true, clickOut: true}
          });
        }
        document.getElementById('loader').style.display = 'none';
      }
    };
    xmlHttp.open('post', '/message');
    xmlHttp.send(JSON.stringify(data));
  };
})();
