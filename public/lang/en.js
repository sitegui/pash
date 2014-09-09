/*globals Lang*/
'use strict'

Lang.addPack({
	tag: 'en',
	name: 'English',
	isDefault: true,
	strings: {
		welcome: {
			title: 'Welcome to PASH',
			line1: 'Feeling guilty for using the <strong>same password</strong> for almost everything?',
			line2: 'Secure your online life with different codes without having to remember all them!',
			knowHow: 'Know how',
			skip: 'Skip (Enter)'
		},
		how: {
			title: 'How PASH works',
			line1: 'PASH generates one unique password for each service you use. You just have to remember <strong>one</strong> key (your master key)',
			line2: 'PASH uses very strong and stablished algorithms to hash your master key and the service name together to return the best password for you',
			details: 'Tell me the details',
			hashing: {
				title: 'Hashing',
				line1: 'PASH uses 4 inputs to generate each password:',
				item1: 'The user name (upper cased), to give more entropy for the master key',
				item2: 'The user master key, expected to be a strong password by itself',
				item3: 'The service name (upper cased), as spelled by the user',
				item4: 'A color (among 9 options), to let the user change his password within the same service',
				line2: 'The first step is to hash all the inputs using SHA-256:',
				code: 'SHA256(<br>&#9;SHA256(userName+\'-\'+userMasterKey) +<br>&#9;SHA256(serviceName+\'-\'+colorId)<br>)'
			},
			translating: {
				title: 'Translating into a password',
				line1: 'The second step is to translate the 32-byte hash output into the final password. There are 3 different options for this process:',
				item1: 'Standard: creates a simple password, with letters and numbers, like <code>Trgpx622q7</code>',
				item2: 'Numeric: for credit cards, like <code>56778691</code>',
				item3: 'Strong: for critical applications, like servers, example: <code>V>SGq&amp;:&amp;3lka&lt;t</code>'
			},
			retrieving: {
				title: 'Retrieving your keys',
				line1: 'PASH does not store any critical data, so you can use it from any mobile or computer, no need to sign up or Internet connection',
				line2: 'At any time you can retrieve the password for one of your services, just type in your master key'
			},
			checkYourself: 'Check for yourself'
		},
		createMasterKey: {
			title: 'Choose your weapon',
			line1: 'Pick your best, strongest, password or take your time to think about a new one',
			line2: 'This will be the only thing you\'ll have to remember: <strong>one password for you life</strong>',
			help: 'Help me test my password strength',
			password: 'Your password: ',
			show: 'Show',
			pash: 'I\'m ready to PASH',
			score: {
				empty: 'Your score will show here',
				short: 'Too short',
				weak: 'Weak. You know you can do better',
				ok: 'That\'s ok, but try adding different characters',
				great: 'Perfect! This seems to be a great choise for your master key',
				awesome: 'Awesome, but it may be annoying to type this password everytime',
				label: 'Score: '
			},
			hints: {
				digits: 'use digits',
				letters: 'use letters',
				cases: 'use lower and upper cases',
				symbols: 'try using some symbols (like space or commas)',
				prefix: 'Maybe you could ',
				infix: ' and ',
				phases: 'use a complete sentence'
			}
		},
		generate: {
			title: 'Let\'s PASH!',
			name: 'Your first name',
			nameDetails: 'after all, this is your key',
			masterKey: 'Your ultra secure master key',
			masterKeyDetails: 'don\'t use 1234, duh!',
			getHelp: 'let PASH help me with this',
			service: 'The service name',
			serviceDetails: 'like gmail or facebook',
			or: 'or',
			history: 'Select from the history',
			colorDetails: 'this lets you create more keys for the same service',
			generate: 'Generate my key',
			home: 'Home',
			alert: {
				name: 'What\'s your name?',
				masterKey: 'Master key too short, choose a good one!',
				service: 'Type in the service name',
				color: 'Please select one color'
			},
			mostUsed: 'Most used',
			leastUsed: 'Least used',
			color: {
				title: 'Choose a color',
				red: 'red',
				green: 'green',
				blue: 'blue',
				black: 'black'
			}
		},
		changeMasterKey: {
			title: 'Master key diverged',
			line1: 'The master key you used now doesn\'t seem to be the same you entered last time',
			tryAgain: '&lt; It was a typo, let me correct',
			or: ' or ',
			ok: 'I know, it\'s ok >',
			how: 'How do you know it?',
			info: {
				line1: 'Don\'t worry, PASH doesn\'t store your master key. It does store, however, the encoded hashed version of your master key',
				line2A: 'The currently stored data is ',
				line2B: ' and the possibly new one is '
			}
		},
		result: {
			title: 'Generated password',
			line1: '<span id=\'name\'></span>, here is your key for <span id=\'service\'></span>:',
			line2: 'Feel free to come back at any time to get this password again, just remember the service name and color',
			changeFormat: 'Change output format',
			format: 'Format',
			standard: 'stardard',
			numeric: 'only numbers',
			stronger: 'stronger',
			length: 'Length',
			short: 'short',
			medium: 'medium',
			long: 'long',
			back: 'Back'
		},
		credits: {
			title: 'Credits',
			line1: 'Made by <a href=\'http://sitegui.com.br\'>Guilherme Souza</a>',
			line2: 'Thanks <a href=\'https://github.com/sitegui/pash\'>GitHub</a> for hosting the code and <a href=\'http://code.google.com/p/crypto-js/\'>CryptoJS</a> for the SHA-256 JavaScript implementation',
			line3: 'Please <a href=\'http://sitegui.com.br/fale_conosco/?assunto=pash\'>get in touch</a> if you have any comments or wanna help translate or port the project for other plataforms',
			home: 'Home'
		},
		options: {
			title: 'Options',
			home: 'Home',
			install: 'Install Firefox app',
			clear: 'Clear all my data',
			confirmClear: 'This will clear all you saved data (your name and your services).\nAre you sure?',
			installError: 'This function is only available in Firefox (Desktop or Android)',
			language: 'Language: '
		},
		update: {
			text: 'New version available',
			button: 'Update now'
		},
		localStorageError: 'Could not open saved data, try updating this page.\nIf this problem persists, clear the browser cache'
	}
})