/*globals describe, it*/

'use strict'

require('should')
var pash = require('../index.js')
describe('pash', function () {
	describe('PBKDF', function () {
		it('should return expected values', function () {
			pash._PBKDF(nB('password'), nB('sodio'), 0)
				.toString('hex')
				.should.be.equal('1f9dde59fa42dd274cc49faf9e20345a03da07c43c246b79f27d76556af8ab32')
		})
	})

	describe('keyStream', function () {
		it('should return expected values', function () {
			var a = new pash._KeyStream('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE)

			a._getBlock().
			toString('hex')
				.should.be.equal('9e249eaf1be667ff9fbd6ace382162de20ee77c65af6da20ab22ccf906a97bdd')

			a._getBlock()
				.toString('hex')
				.should.be.equal('30d43cfb34dc0c866d09153e1eaab3393f4697d75a32d48f16e30f6ec78e9311')

			a._getBlock()
				.toString('hex')
				.should.be.equal('9de2a03156a20c47364265e38db3b184e1f30100f2875c88cb34b143cc745f49')
		})
	})

	describe('pash', function () {
		it('should return expected key', function () {
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STANDARD, pash.LENGTH.SHORT).should.be.equal('Z0iwl')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STANDARD, pash.LENGTH.MEDIUM).should.be.equal('Y65gw10ik8')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STANDARD, pash.LENGTH.LONG).should.be.equal('Tjpvmpvhbc1bom4')

			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.NUMERIC, pash.LENGTH.SHORT).should.be.equal('9249')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.NUMERIC, pash.LENGTH.MEDIUM).should.be.equal('92491667')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.NUMERIC, pash.LENGTH.LONG).should.be.equal('924916679638')

			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STRONG, pash.LENGTH.SHORT).should.be.equal('hx3)OM2')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STRONG, pash.LENGTH.MEDIUM).should.be.equal('>JT;||4hx3)OM2')
			pash.pash('Eu gosto de maçãs!', 'bitu', 'face', pash.COLOR.BLUE, pash.DECODER.STRONG, pash.LENGTH.LONG).should.be.equal('>JT;||4hx3)OM2)KLZDqv')


		})
	})

})

function nB(a) {
	return new Buffer(a)
}