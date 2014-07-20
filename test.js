/*globals Pash*/
'use strict'

var pf = Pash.FORMAT,
	pl = Pash.LENGTH,
	pc = Pash.COLOR

function check(name, goal) {
	return function (str) {
		if (str === goal) {
			console.log(name, 'Got right')
		} else {
			console.log(name, 'Got wrong, expecting ' + goal + ' got ' + str)
		}
	}
}

var pash = new Pash('Eu gosto de maçãs!', 'bitu', 'face', pc.BLUE)
pash.generatePassword(pf.STANDARD, pl.SHORT, check('Standard/Short', 'M42gw'))
pash.generatePassword(pf.STANDARD, pl.MEDIUM, check('Standard/Medium', 'M42gw9ys2d'))
pash.generatePassword(pf.STANDARD, pl.LONG, check('Standard/Long', 'M42gw9ys2dcxp2x'))
pash.generatePassword(pf.NUMERIC, pl.SHORT, check('Numeric/Short', '1706'))
pash.generatePassword(pf.NUMERIC, pl.MEDIUM, check('Numeric/Medium', '17065375'))
pash.generatePassword(pf.NUMERIC, pl.LONG, check('Numeric/Long', '170653756127'))
pash.generatePassword(pf.STRONG, pl.SHORT, check('Strong/Short', 'h:(0b8B'))
pash.generatePassword(pf.STRONG, pl.MEDIUM, check('Strong/Medium', '?zSGuD_%>NY2RI'))
pash.generatePassword(pf.STRONG, pl.LONG, check('Strong/Long', '?zSGuD_%>NY2RIbaaYI]B'))

var pash2 = new Pash('Eu gosto de maçãs!', 'bitu', 'Pash', pc.RED)
pash.generatePashKey(pc.RED, function (key) {
	pash2.generatePassword(pf.RAW, null, check('PashKey', key))
})