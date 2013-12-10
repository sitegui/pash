var pageMod = require("sdk/page-mod")
var data = require("sdk/self").data

// Create the PASH panel
var panel = require("sdk/panel").Panel({
    contentURL: data.url("panel.html"),
    contentScriptFile: data.url("panel.js")
})

// The last worker that opened the panel
var _focusedWorker

// Create a page mod to look for focused password fields
// When one is detected, the mod should send a message with this data:
// data.id: a random id to refer to the input element
// data.host: the page host name
// data.x: the x screen position of the element
// data.y: the y screen position of the element
// data.height: the height of the window
// data.width: the width of the window
pageMod.PageMod({
    include: "*",
    contentScriptFile: data.url("mod.js"),
    onAttach: function (worker) {
        worker.on("message", function (data) {
            var top, left, height, width
            _focusedWorker = worker
            
            height = 200
            width = 300
            top = data.y-height/2
            left = data.x-width/2
            top = top+height>data.height ? data.height-height : top
            left = left+width>data.width ? data.width-width : left
            panel.show({height: height, width: width, position: {top: top, left: left}})
            
            data.action = "field-selected"
            panel.postMessage(data)
        })
    }
})

// Forward messages from the panel to the worker
panel.on("message", function (data) {
    if (_focusedWorker)
        _focusedWorker.postMessage(data)
})
