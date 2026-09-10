# NOT Security Bot

Ferramenta de teste separada do jogo, mantida dentro do repositório Modelo para facilitar transporte e evolução.

## Uso

Abra `security-bot/index.html`, informe uma licença exclusiva de pentest e execute a vistoria.

A key digitada não é persistida pelo Security Bot e não deve ser adicionada ao repositório.

## Portabilidade

A pasta `security-bot/` pode ser copiada para outros ambientes de laboratório. O arquivo `security-bot.js` concentra os testes externos do Pa. Testes que dependem do runtime interno de um jogo devem ficar em módulos de laboratório opcionais, nunca como requisito do jogo de produção.

## Segurança operacional

As tentativas inválidas são requisições reais ao Pa e contam no anti-bruteforce. Por isso o runner não executa brute force massivo automaticamente.