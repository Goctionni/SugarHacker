chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', arguments);
    if(command == "enable_sugar_hacker") {
        chrome.tabs.executeScript({ file: "load-sugarhacker.js" });
    }
    else if(command == "show_custom_globals") {
        chrome.tabs.executeScript({ file: "load-customglobals.js" });
    }
});