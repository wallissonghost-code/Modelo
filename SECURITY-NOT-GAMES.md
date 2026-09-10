# Padrão de segurança NOT para jogos

Este arquivo registra o baseline de segurança descoberto durante os testes do Modelo para ser reaplicado nos demais jogos NOT.

## Falhas confirmadas no teste

1. Confiar em `window.NOT_LICENSE.authorized` permitia falsificar o estado visual no DevTools.
2. Proteger apenas botão/modal não é segurança: o modal pode ser aberto pelo DOM.
3. Proteger apenas `connect()` não basta se o executor final do jogo estiver público.
4. `window.LivePlusTestGame.execute("jump")` executava o jogo diretamente sem key, sessão Pa ou painel. Esta rota foi removida.
5. DOM Command Injection: os controles locais liam `btn.dataset.action` no momento do clique. Pelo DevTools era possível trocar `data-action` e disparar `.click()`, alcançando o executor interno sem key/sessão/painel. Confirmado visualmente com `walk_left`, `walk_right`, `jump` e `stop`. Corrigido separando controles locais do executor remoto e capturando uma ação local fixa no bind, sem confiar em `dataset` mutável em runtime.

## Baseline obrigatório

- Pa é a fonte de verdade da licença.
- Key privada nunca é autoridade por formato e não deve ser usada como ID do cliente.
- Após validação, usar sessão assinada de curta duração emitida pelo Pa.
- Não expor executor de comandos como função pública em `window`.
- O objeto público do jogo deve expor apenas metadados/estado necessários ao conector.
- O bridge recebe uma capability privada de execução uma única vez e a mantém em closure.
- Comando de live exige sessão NOT presente antes de chegar ao executor.
- Perda/expiração da sessão desconecta o bridge.
- Revalidação periódica e estados INVALID_KEY, EXPIRED, SUSPENDED, REVOKED e ACTIVE devem ser respeitados.
- Limite de dispositivos é por dispositivos ativos, não por quantidade de entradas.
- Nunca usar atributo DOM mutável (`data-action`, value, class, id etc.) como autoridade para selecionar comando protegido no momento da execução.
- Controles locais/demonstração devem ficar isolados do executor remoto. O bind local deve capturar uma ação fixa ou usar handlers explícitos.
- Botões, modais, objetos congelados e closures são hardening do cliente, não raiz de confiança.

## Regra para novos jogos

Nunca implementar `window.<Game>.execute`, `window.<Game>.runCommand`, `window.<Game>.triggerAction` ou equivalente que permita executar gameplay diretamente pelo Console. Não encaminhar `btn.dataset.action` ou outro valor DOM mutável para o executor protegido. Controles locais podem chamar lógica local com ação fixa; comandos remotos devem passar pelo bridge autorizado.

## Arquitetura final recomendada

`Key -> Pa valida -> sessão assinada curta -> painel/NOT envia sessão -> relay/backend confiável verifica sessão -> comando autorizado -> jogo recebe comando`

A verificação criptográfica decisiva deve acontecer no servidor/relay. Não colocar `LICENSE_KEY_PEPPER`, chave de assinatura, `service_role` ou qualquer segredo do Pa no JavaScript do navegador.

## Próximos hardenings

- Verificar `licenseSession` no relay antes de aceitar/encaminhar comandos.
- Vincular sessão ao dispositivo/conexão quando aplicável.
- Anti-replay com `commandId`/nonce e rejeição de comandos repetidos.
- Kill switch / versão mínima do NOT.
- Auditoria e detecção de anomalias.
- Testar cada jogo com DevTools antes de liberar: estado falso, modal direto, connect direto, substituição de sessão, procura por executores públicos e adulteração de atributos DOM seguida de `.click()`.

## Limite deste hardening

O navegador continua sob controle do usuário. Remover o executor público e isolar os controles locais fecha os bypasses triviais encontrados no Modelo, mas não torna JavaScript estático inviolável. Um atacante determinado ainda pode modificar recursos carregados/local overrides/instrumentar o runtime. A barreira forte é o relay/backend rejeitar qualquer comando que não tenha autorização válida do Pa.