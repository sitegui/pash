/*globals Pash*/
'use strict'

function check(name, goal) {
	return function (str) {
		if (str === goal) {
			console.log(name, 'Got right')
		} else {
			console.log(name, 'Got wrong, expecting ' + goal + ' got ' + str)
		}
	}
}

var pash = new Pash('Eu gosto de maçãs!', 'bitu', 'face', Pash.COLOR.BLUE)
pash.generatePassword(Pash.FORMAT.STANDARD, Pash.LENGTH.SHORT, check('Standard/Short', 'M42gw'))
pash.generatePassword(Pash.FORMAT.STANDARD, Pash.LENGTH.MEDIUM, check('Standard/Medium', 'M42gw9ys2d'))
pash.generatePassword(Pash.FORMAT.STANDARD, Pash.LENGTH.LONG, check('Standard/Long', 'M42gw9ys2dcxp2x'))
pash.generatePassword(Pash.FORMAT.NUMERIC, Pash.LENGTH.SHORT, check('Numeric/Short', '1706'))
pash.generatePassword(Pash.FORMAT.NUMERIC, Pash.LENGTH.MEDIUM, check('Numeric/Medium', '17065375'))
pash.generatePassword(Pash.FORMAT.NUMERIC, Pash.LENGTH.LONG, check('Numeric/Long', '170653756127'))
pash.generatePassword(Pash.FORMAT.STRONG, Pash.LENGTH.SHORT, check('Strong/Short', 'h:(0b8B'))
pash.generatePassword(Pash.FORMAT.STRONG, Pash.LENGTH.MEDIUM, check('Strong/Medium', '?zSGuD_%>NY2RI'))
pash.generatePassword(Pash.FORMAT.STRONG, Pash.LENGTH.LONG, check('Strong/Long', '?zSGuD_%>NY2RIbaaYI]B'))