/* globals Pash*/
'use strict'

window.test = function test() {
	let pf = Pash.FORMAT,
		pl = Pash.LENGTH,
		pc = Pash.COLOR,
		total = 0,
		done = 0,
		good = 0,
		then = Date.now(),
		pash = new Pash('Eu gosto de maçãs!', 'bitu', 'face', pc.BLUE)

	/**
	 * @param {string} name
	 * @param {function(function(Error))} fn
	 */
	function testCase(name, fn) {
		total++
		fn(err => {
			done++
			if (err) {
				console.error(name, err)
			} else {
				console.log(name, '\u2714')
				good++
			}
			if (done === total) {
				alert('Done in ' + (Date.now() - then) + ' ms')
				alert(good === done ? 'All ' + total + ' testes passed!' : 'Some tests failed')
			}
		})
	}

	/**
	 * @param {Pash} pash
	 * @param {number} format
	 * @param {number} length
	 * @param {string} goal
	 * @returns {function(function(Error))}
	 */
	function check(pash, format, length, goal) {
		return function (done) {
			pash.generatePassword(format, length, result => {
				done(result === goal ? null : 'expecting ' + goal + ' got ' + result)
			})
		}
	}

	// Basic tests (format and length)
	testCase('Standard/Short', check(pash, pf.STANDARD, pl.SHORT, 'Z0iwl'))
	testCase('Standard/Medium', check(pash, pf.STANDARD, pl.MEDIUM, 'Y65gw10ik8'))
	testCase('Standard/Long', check(pash, pf.STANDARD, pl.LONG, 'Tjpvmpvhbc1bom4'))
	testCase('Numeric/Short', check(pash, pf.NUMERIC, pl.SHORT, '9249'))
	testCase('Numeric/Medium', check(pash, pf.NUMERIC, pl.MEDIUM, '92491667'))
	testCase('Numeric/Long', check(pash, pf.NUMERIC, pl.LONG, '924916679638'))
	testCase('Strong/Short', check(pash, pf.STRONG, pl.SHORT, 'hx3)OM2'))
	testCase('Strong/Medium', check(pash, pf.STRONG, pl.MEDIUM, '>JT;||4hx3)OM2'))
	testCase('Strong/Long', check(pash, pf.STRONG, pl.LONG, '>JT;||4hx3)OM2)KLZDqv'))

	// Pash key
	testCase('Pash key', done => {
		pash.generatePashKey(pc.RED, key => {
			let pash2 = new Pash('Eu gosto de maçãs!', 'bitu', 'Pash', pc.RED)
			check(pash2, pf.RAW, null, key)(done)
		})
	})

	// Encryption
	testCase('Consistent encryption', done => {
		let str = 'Hello World! Non-ASCII: áçêñtòs ☃'
		pash.encrypt(str, ciphertext => {
			pash.decrypt(ciphertext, str2 => {
				done(str === str2 ? null : 'Not equal:\n' + str + '\n' + str2)
			})
		})
	})
	testCase('Non-deterministic encryption', done => {
		pash.encrypt('hi', a => {
			pash.encrypt('hi', b => {
				done(a !== b ? null : 'Failed')
			})
		})
	})
	testCase('Integrity check', done => {
		pash.encrypt('hi', ciphertext => {
			let c = ciphertext[0]
			c = ((parseInt(c, 16) + 1) % 16).toString(16)
			ciphertext = c + ciphertext.substr(1)
			pash.decrypt(ciphertext, result => {
				done(result === null ? null : 'Failed')
			})
		})
	})
}