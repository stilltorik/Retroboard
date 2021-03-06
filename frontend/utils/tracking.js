!function(){var a,b,c,d=window,e=document,f=arguments,g="script",h=["config","track","trackForm","trackClick","identify","visit","push","call"],i=function(){var a,b=this,c=function(a){b[a]=function(){return b._e.push([a].concat(Array.prototype.slice.call(arguments,0))),b}};for(b._e=[],a=0;a<h.length;a++)c(h[a])};for(d.__woo=d.__woo||{},a=0;a<f.length;a++)d.__woo[f[a]]=d[f[a]]=d[f[a]]||new i;b=e.createElement(g),b.async=1,b.src="//static.woopra.com/js/w.js",c=e.getElementsByTagName(g)[0],c.parentNode.insertBefore(b,c)}("woopra");

(function(){
  // configure tracker
  var domain = 'e-retrospective.com';
  if (window.location.origin.startsWith('http://localhost:3001')) {
    domain = 'test.' + domain;
  }
  woopra.config({
    domain: domain,
    outgoing_tracking: true
  });

  // track pageview
  woopra.track();

  window.tracking = {};

  tracking.trackCreateDashboard = function (config) {
    woopra.track("createDashboard", {
      nbPostitTypes: config.nbPostitTypes
    });
  };
  tracking.trackExportCSV = function (config) {
    woopra.track("exportCSV", {});
  };

  tracking.trackEmailSent = function (config) {
    woopra.track("emailSent", {
      success: config.status,
      email: config.email,
      message: config.email
    });
  };

})();
