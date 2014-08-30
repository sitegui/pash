/*globals Pash*/
'use strict'

function test() {
	var pf = Pash.FORMAT,
		pl = Pash.LENGTH,
		pc = Pash.COLOR,
		oks = 0

	function check(name, goal) {
		return function (str) {
			if (str === goal) {
				console.log(name, 'Got right')
				oks++
			} else {
				console.log(name, 'Got wrong, expecting ' + goal + ' got ' + str)
			}
		}
	}

	var pash = new Pash('Eu gosto de maçãs!', 'bitu', 'face', pc.BLUE),
		then = Date.now()
	pash.generatePassword(pf.STANDARD, pl.SHORT, check('Standard/Short', 'Z0iwl'))
	pash.generatePassword(pf.STANDARD, pl.MEDIUM, check('Standard/Medium', 'Y65gw10ik8'))
	pash.generatePassword(pf.STANDARD, pl.LONG, check('Standard/Long', 'Tjpvmpvhbc1bom4'))
	pash.generatePassword(pf.NUMERIC, pl.SHORT, check('Numeric/Short', '9249'))
	pash.generatePassword(pf.NUMERIC, pl.MEDIUM, check('Numeric/Medium', '92491667'))
	pash.generatePassword(pf.NUMERIC, pl.LONG, check('Numeric/Long', '924916679638'))
	pash.generatePassword(pf.STRONG, pl.SHORT, check('Strong/Short', 'hx3)OM2'))
	pash.generatePassword(pf.STRONG, pl.MEDIUM, check('Strong/Medium', '>JT;||4hx3)OM2'))
	pash.generatePassword(pf.STRONG, pl.LONG, check('Strong/Long', '>JT;||4hx3)OM2)KLZDqv'))

	var pash2 = new Pash('Eu gosto de maçãs!', 'bitu', 'Pash', pc.RED)
	pash.generatePashKey(pc.RED, function (key) {
		pash2.generatePassword(pf.RAW, null, function (str) {
			check('PashKey', key)(str)
			alert('Took ' + (Date.now() - then) + ' ms')
			alert(oks === 10 ? 'All good!' : 'Some tests failed')
		})
	})
}