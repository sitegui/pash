var _id

self.on("message", function (data) {
    if (data.action == "field-selected") {
        document.getElementById("field-id").textContent = data.host
        _id = data.id
    }
})

document.getElementById("fill").onclick = function () {
    self.postMessage({action: "fill-field", value: "oi", id: _id})
}
