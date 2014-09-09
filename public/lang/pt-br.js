/*globals Lang*/
'use strict'

Lang.addPack({
	tag: 'pt-br',
	name: 'Português',
	strings: {
		welcome: {
			title: 'Bem-vindo ao PASH',
			line1: 'Você se sente culpado por usar a <strong>mesma senha</strong> pra quase tudo?',
			line2: 'Proteja sua vida online com senhas diferentes mas sem ter de decorar todas elas!',
			knowHow: 'Saiba como',
			skip: 'Pular (Enter)'
		},
		how: {
			title: 'Como PASH funciona',
			line1: 'PASH gera uma senha única para cada serviço que você usa. Você só precisa lembrar <strong>uma</strong> senha (sua senha mestre)',
			line2: 'PASH usa algoritmos muito fortes e bem respeitados para misturar sua senha mestre e o nome do serviço e retornar a melhor senha para você',
			details: 'Conte-me os detalhes',
			hashing: {
				title: 'Hashing',
				line1: 'PASH usa 4 valores para gerar cada senha:',
				item1: 'O nome do usuário (em letras maiúsculas), para dar maior variabilidade à senha mestre',
				item2: 'A senha mestre, que deve ser uma senha bem forte por si só já',
				item3: 'O nome do serviço (em letras maiúsculas), como digitado pelo usuário',
				item4: 'Uma cor (entre 9 opções), permitindo o usuário trocar sua senha dentro do mesmo serviço',
				line2: 'O primeiro passo é juntar todas as entradas com SHA-256:',
				code: 'SHA256(<br>&#9;SHA256(userName+\'-\'+userMasterKey) +<br>&#9;SHA256(serviceName+\'-\'+colorId)<br>)'
			},
			translating: {
				title: 'Traduzindo numa senha',
				line1: 'O segundo passo é traduzir a saída de 32 bytes no passo 1 no senha final. Existem 3 opções diferentes para esse processo:',
				item1: 'Normal: cria uma senha simples, com letras e números, exemplo <code>Trgpx622q7</code>',
				item2: 'Numérico: para cartões de crédito, exemplo <code>56778691</code>',
				item3: 'Forte: para aplicações críticas, como servidores, exemplo: <code>V>SGq&amp;:&amp;3lka&lt;t</code>'
			},
			retrieving: {
				title: 'Recuperando suas senhas',
				line1: 'PASH não guarda nenhuma informação crítical, justamente para que você tenha liberdade de usar em qualquer computador ou celular, sem precisar de mais um cadastro ou conexão com a Internet',
				line2: 'A qualquer momento você pode pegar sua senha gerada para um de seus serviços, basta entrar com sua senha mestre'
			},
			checkYourself: 'Veja você mesmo'
		},
		createMasterKey: {
			title: 'Escolha sua arma',
			line1: 'Pegue sua senha mais forte, ou tome um pouco do seu tempo para pensar numa nova',
			line2: 'Essa é a única coisa que você terá de lembrar: <strong>uma senha para sua vida toda</strong>',
			help: 'Me ajude a testar minhas senhas',
			password: 'Sua senha: ',
			show: 'Mostrar',
			pash: 'Estou pronto pra ação',
			score: {
				empty: 'Seu score irá aparecer aqui',
				short: 'Muito curta',
				weak: 'Fraca. Vamos, você consegue fazer melhor',
				ok: 'Está ok, mas tente adicionar caracteres diferentes',
				great: 'Perfeito! Essa parece uma boa opção para uma senha mestre',
				awesome: 'Maravilhoso, mas talvez fique chato digitar essa senha todas as vezes',
				label: 'Pontuação: '
			},
			hints: {
				digits: 'usar dígitos',
				letters: 'usar letras',
				cases: 'usar letras maiúsculas e minúsculas',
				symbols: 'tentar usar alguns símbolos (como espaço ou vírgula)',
				prefix: 'Talvez você possa ',
				infix: ' e ',
				phases: 'usar uma frase completa'
			}
		},
		generate: {
			title: 'PASH!',
			name: 'Seu primeiro nome',
			nameDetails: 'afinal, esse as senhas serão suas',
			masterKey: 'Sua ultra master senha mestre',
			masterKeyDetails: 'não use 1234, dãh!',
			getHelp: 'deixe PASH me ajudar com isso',
			service: 'O nome do serviço',
			serviceDetails: 'gmail, facebook, etc',
			or: 'ou',
			history: 'Selecione do histórico',
			colorDetails: 'isso permite criar mais de uma senha pro mesmo serviço',
			generate: 'Gerar minha senha',
			home: 'Início',
			alert: {
				name: 'Como você se chama?',
				masterKey: 'Senha mestre muito curta, escolha uma legal!',
				service: 'Digite o nome do serviço',
				color: 'Por favor, escolha uma cor'
			},
			mostUsed: 'Mais usado',
			leastUsed: 'Menos usado',
			color: {
				title: 'Escolha uma cor',
				red: 'vermelho',
				green: 'verde',
				blue: 'azul',
				black: 'preto'
			}
		},
		changeMasterKey: {
			title: 'Senha mestre diferente',
			line1: 'A senha mestre que você usou agora não parece ser a mesma que você usou da última vez',
			tryAgain: '&lt; Foi um erro, me deixe corrigir',
			or: ' ou ',
			ok: 'Eu sei, está ok >',
			how: 'Como você sabe disso?',
			info: {
				line1: 'Não se preocupe, PASH não guarda sua senha mestre. O que ele guarda é uma versão codificada dela',
				line2A: 'O que ele tem guardado atualmente é ',
				line2B: ' e o possível novo valor é '
			}
		},
		result: {
			title: 'Sua senha',
			line1: '<span id=\'name\'></span>, aqui está sua senha para <span id=\'service\'></span>:',
			line2: 'Sinta-se livre para voltar a qualquer momento para obter essa senha novamente, só lembre o nome do serviço e a cor',
			changeFormat: 'Trocar o formato',
			format: 'Formato',
			standard: 'normal',
			numeric: 'apenas números',
			stronger: 'bem forte',
			length: 'Tamanho',
			short: 'curto',
			medium: 'médio',
			long: 'longo',
			back: 'Voltar'
		},
		credits: {
			title: 'Créditos',
			line1: 'Feito por <a href=\'http://sitegui.com.br\'>Guilherme Souza</a>',
			line2: 'Obrigado <a href=\'https://github.com/sitegui/pash\'>GitHub</a> por hospedar o código e <a href=\'http://code.google.com/p/crypto-js/\'>CryptoJS</a> pela implementação de SHA-256 em JavaScript',
			line3: 'Por favor, <a href=\'http://sitegui.com.br/fale_conosco/?assunto=pash\'>entre em contato</a> caso tenha qualquer comentário ou gostaria de traduzir ou portar o projeto para qualquer outras plataforma',
			home: 'Início'
		},
		options: {
			title: 'Opções',
			home: 'Início',
			install: 'Instalar aplicativo para Firefox',
			clear: 'Limpar todos meus dados',
			confirmClear: 'Isso irá excluir todos seus dados salvos (seu nome e os serviços usados).\nTem certeza?',
			installError: 'Essa função só está disponível no Firefox (desktop ou Android)',
			language: 'Língua: '
		},
		update: {
			text: 'Nova versão disponível',
			button: 'Atualizar agora'
		},
		localStorageError: 'Não foi possível carregar seus dados, tente atualizar essa página.\nSe o problema persistir, limpe o cache do navegador'
	}
})