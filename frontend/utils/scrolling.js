(function() {
  window.scrolling = {};

  scrolling.disableScroll = function() {
    document.body.style.overflow = 'hidden';
  }

  scrolling.enableScroll = function() {
    document.body.style.overflow = 'initial';
  }
})();
