# CLARITI — esqueleto do frontend

## Estrutura

```
index.html        Página inicial
executivo.html     Nível 1 — Dashboard Executivo
tatico.html         Nível 2 — Dashboard Tático (aberto via clique no ranking do Executivo)
clinico.html         Nível 3 — Dashboard Clínico (aberto via clique num diagnóstico do Tático)
metodologia.html    Tiers dos KPIs e ressalvas de interpretação
chatbot.html          Assistente IA — página própria de conversa com o Select AI
css/style.css        Todos os estilos
js/api.js             Config central de API + dados mock (EDITAR AQUI quando o ORDS estiver pronto)
js/nav.js              Menu lateral, navegação e seletor de ano global
js/chatbot.js          Interface da página própria do chatbot
js/executivo.js       Lógica da página Executivo
js/tatico.js           Lógica da página Tático
js/clinico.js           Lógica da página Clínico
```

## Como rodar agora (sem backend)

Abra `index.html` direto no navegador. `MOCK_MODE` está `true` em `js/api.js`, então
todas as páginas já renderizam com dados fictícios — dá pra navegar, clicar no ranking,
ver o drill-down funcionando e testar o chat (ele responde com uma mensagem de mock).

## Como plugar o ORDS quando estiver pronto

Só mexa em `js/api.js`:

1. Preencha `ORDS_BASE_URL` com a base do seu módulo REST no ADB.
2. Preencha `SELECT_AI_ENDPOINT` com o endpoint do módulo PL/SQL que chama `DBMS_CLOUD_AI.GENERATE`.
3. Mude `MOCK_MODE` para `false`.
4. Ajuste os paths dentro de `getPainelExecutivo`, `getPainelTatico`, `getPainelClinico` e
   `askClaritiAI` conforme os nomes reais dos seus módulos ORDS — estão marcados com `// TODO`.
5. Confira o formato do JSON que o ORDS devolve contra o formato que as funções mock
   retornam (`getMockExecutivo`, etc.) — se o shape for diferente, ajuste ali, não nas páginas.

Nenhuma outra parte do frontend deveria precisar mudar.

## Rodando com um servidor local (recomendado ao testar com o ORDS real)

Abrir os arquivos direto como `file://` funciona no modo mock, mas ao plugar fetch()
num domínio real o navegador pode reclamar de CORS dependendo do ambiente. Rode um
servidor estático simples na pasta, por exemplo:

```
python3 -m http.server 8080
```

E acesse `http://localhost:8080`. Lembre de liberar esse domínio/origem no CORS do ORDS.

## O que falta (intencionalmente deixado como próximo passo)

- Confirmar os códigos `municipio_6` e o formato final devolvidos pelo ORDS; o mock já
  fornece códigos municipais para testar o drill-down sem o placeholder.
- Mapa coroplético (nível 1): não incluído neste esqueleto — depende do GeoJSON dos
  645 municípios, que é uma decisão separada (ver conversa anterior sobre a Region 3).
- Autenticação/controle de acesso, se o challenge exigir.
