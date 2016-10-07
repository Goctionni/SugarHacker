(function(){
    var jsurl = chrome.extension.getURL('show-custom-globals.js');
    var body = document.querySelector('body');
    var script = document.createElement("script");
    script.setAttribute('src', jsurl);
    body.appendChild(script);
})();
