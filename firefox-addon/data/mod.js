// Store the selected fields, using a random string as a key
var _storage = {}

// Store and return the random key
function storeElement(el) {
    var id = String(Math.random())
    _storage[id] = el
    return id
}

// Look for focused password fields
window.addEventListener("focus", function (event) {
    var el = event.target, data, rect
    if (el.tagName == "INPUT" && el.type == "password") {
        data = {}
        data.host = window.location.hostname
        data.id = storeElement(el)
        rect = el.getBoundingClientRect()
        data.x = (rect.left+rect.right)/2
        data.y = (rect.top+rect.bottom)/2
        data.width = window.innerWidth
        data.height = window.innerHeight
        self.postMessage(data)
    }
}, true)

self.on("message", function (data) {
    var el
    if (data.action == "fill-field") {
        el = _storage[data.id]
        if (el)
            el.value = data.value
    }
})
