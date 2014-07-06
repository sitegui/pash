/*globals describe, it*/

'use strict'

require('should')
var pash = require('../index.js')
describe('pash', function () {
	describe('PBKDF', function () {
		it('should return expected values', function () {
			pash._PBKDF(nB('password'), nB('sodio'), 0)
				.toString('hex')
				.should.be.equal('c0a7a8a1f5eef603bb64a6866fc425aed4a94a37e21f9f9b612a8d082071eda3')
		})
	})

	describe('keyStream', function () {
		it('should return expected values', function () {
			var a = new pash._KeyStream('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE)

			a._getBlock().
			toString('hex')
				.should.be.equal('fb1e7065a3e75612703097d8f7275ebab5138b254b2c11407b09ab925849343e')

			a._getBlock()
				.toString('hex')
				.should.be.equal('7960123f4b2ef45e2f6a4f0277106cb050664835e5c0fad4c3d60e7b5e67e9b4')

			a._getBlock()
				.toString('hex')
				.should.be.equal('34c36f047f651180dec346afe9b463b88a6060597922d3d041a97ee2d4fb3303')
		})
	})

	describe('pash', function () {
		it('should return expected key', function () {
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STANDARD, pash.LENGTH.SHORT).should.be.equal('M42gw')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STANDARD, pash.LENGTH.MEDIUM).should.be.equal('M42gw9ys2d')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STANDARD, pash.LENGTH.LONG).should.be.equal('M42gw9ys2dcxp2x')

			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.NUMERIC, pash.LENGTH.SHORT).should.be.equal('1706')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.NUMERIC, pash.LENGTH.MEDIUM).should.be.equal('17065375')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.NUMERIC, pash.LENGTH.LONG).should.be.equal('170653756127')

			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STRONG, pash.LENGTH.SHORT).should.be.equal('h:(0b8B')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STRONG, pash.LENGTH.MEDIUM).should.be.equal('?zSGuD_%>NY2RI')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STRONG, pash.LENGTH.LONG).should.be.equal('?zSGuD_%>NY2RIbaaYI]B')


		})
	})

})

function nB(a) {
	return new Buffer(a)
}