(function(){
    var jsurl = chrome.extension.getURL('sugarhacker.js');
    var body = document.querySelector('body');
    var script = document.createElement("script");
    script.setAttribute('src', jsurl);
    body.appendChild(script);

    var cssurl = chrome.extension.getURL('sugarhacker.css');
    var head = document.querySelector('head');
    var stylesheet = document.createElement('link');
    stylesheet.setAttribute('rel', 'stylesheet');
    stylesheet.setAttribute('href', cssurl);
    head.appendChild(stylesheet);
})();
