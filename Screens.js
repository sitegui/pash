'use strict'

// A javascript module to control screens
let Screens = {}

// Register a new screen controller
// The controller is an object with these callbacks:
// oninit(), onbeforeshow(arg), onaftershow(arg), onbeforehide(), onafterhide()
// Inside all these callbacks, "this" will be the controller itself
// The controller will have a property ("el") that returns the screen HTML element
// The controller method $(id) returns the element inside the screen with the given id
// The controller method $$(selector) returns an array of elements inside the screen that match the given css selector
// The controller method updateHeight() must be called whenever the controller change its screen element height
// The controller method isShowing() returns whether the controller is current being shown
Screens.addController = function (name, controller) {
	let _el = null
	Object.defineProperty(controller, 'el', {
		get() {
			if (!_el) {
				_el = document.getElementById('screen-' + name)
			}
			return _el
		}
	})
	controller.$ = function (id) {
		return this.el.querySelector('#' + id)
	}
	controller.$$ = function (selector) {
		return [].slice.call(this.el.querySelectorAll(selector), 0)
	}
	controller.updateHeight = function () {
		let stage
		if (this.isShowing()) {
			stage = document.getElementById('stage')
			stage.style.transition = 'none'
			stage.style.height = (this.el.clientHeight + 30) + 'px'
		}
	}
	controller.isShowing = function () {
		return name === Screens._current
	}
	Screens._screens[name] = {
		inited: false,
		controller
	}
}

// Show the given screen
// A controller must have been attached to this screen
// Send the second argument to the onshow() callback of the screen controller
// backwards inverts the slide animation
Screens.show = function (name, arg, backwards) {
	// Check the argument
	if (!(name in Screens._screens)) {
		throw new Error('Screen controller not found')
	}

	if (name === Screens._current) {
		// Ignore showing the same screen over itself

	} else if (Screens._animating) {
		// Schedule for the future
		Screens._scheduled = [name, arg, backwards]
	} else {
		Screens._hide(backwards)
		Screens._show(name, arg, backwards)
		Screens._animating = true
		setTimeout(() => {
			let scheduled = Screens._scheduled
			Screens._animating = false
			if (scheduled) {
				Screens._scheduled = null
				Screens.show(scheduled[0], scheduled[1], scheduled[2])
			}
		}, 1.2e3)
	}
}

/*
Internals
*/

// List of registered controllers
// Each element is like {inited: (bool), controller: (obj)}
Screens._screens = {}

// The current screen being displayed
Screens._current = ''

Screens._animating = false
Screens._scheduled = null

// Just show the given screen
// backwards is true if the user is goind back in the history
Screens._show = function (name, arg, backwards) {
	let screen, style, height, width, left, stage
	screen = Screens._screens[name]
	if (screen) {
		// Init if necessary
		style = screen.controller.el.style
		if (!screen.inited) {
			if (screen.controller.oninit) {
				screen.controller.oninit()
			}
			screen.inited = true
		}

		if (screen.controller.onbeforeshow) {
			screen.controller.onbeforeshow(arg)
		}
		style.display = 'block'

		// Calculate the height
		height = screen.controller.el.clientHeight
		stage = document.getElementById('stage')
		stage.style.transition = height > stage.clientHeight ? 'height .4s ease' : 'height .4s ease .6s'
		stage.style.height = (height + 30) + 'px'

		// Animate
		width = screen.controller.el.clientWidth
		left = (document.body.clientWidth - width) / 2
		style.transition = ''
		style.left = backwards ? '-100%' : '100%'
		setTimeout(() => {
			style.transition = 'left 1s ease'
			style.left = left + 'px'
			setTimeout(() => {
				if (screen.controller.onaftershow) {
					screen.controller.onaftershow(arg)
				}
			}, 1e3)
		}, 100)
		window.scroll(0, 0)
	}
	Screens._current = name
}

// Just hide the given current screen
// backwards is true if the user is goind back in the history
Screens._hide = function (backwards) {
	let screen, style, width, left

	if (Screens._current) {
		screen = Screens._screens[Screens._current]
		if (screen) {
			style = screen.controller.el.style
			if (screen.controller.onbeforehide) {
				screen.controller.onbeforehide()
			}

			// Animate
			width = screen.controller.el.clientWidth
			left = (document.body.clientWidth - width) / 2
			style.transition = ''
			style.left = left + 'px'
			setTimeout(() => {
				style.transition = 'left 1s ease'
				style.left = backwards ? '100%' : '-100%'
				setTimeout(() => {
					style.display = 'none'
					if (screen.controller.onafterhide) {
						screen.controller.onafterhide()
					}
				}, 1e3)
			}, 100)
		}
		Screens._current = ''
	}
}

// Send the current screen it's being unloaded
addEventListener('unload', () => {
	Screens._hide(false)
})