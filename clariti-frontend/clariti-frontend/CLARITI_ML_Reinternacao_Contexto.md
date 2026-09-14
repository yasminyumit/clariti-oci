# CLARITI — Contexto: Integração do Módulo de ML (Risco de Reinternação em UTI)

> Documento de contexto para uso por assistente de IA de código (ex: GitHub Copilot / Claude Code) durante a integração deste módulo na aplicação web CLARITI. Resume o que já foi feito no banco de dados Oracle e o que falta implementar na aplicação.

---

## 1. Visão geral do módulo

O CLARITI possui uma camada de Machine Learning (OML4Py, treinada dentro do Oracle) que estima o **risco de uma nova internação em UTI em até 30 dias após a alta**, a partir dos dados da internação atual. Esse módulo corresponde ao **Módulo 4 — Camada Preventiva** do MVP da CLARITI.

Este módulo é classificado como **Tier 3** no framework de KPIs do projeto: é uma limitação metodológica conhecida (o modelo de 30 dias tem viés de sobrevivência), não um erro, mas **precisa carregar nota metodológica na interface**, seguindo o mesmo padrão de rigor já aplicado à hipótese central do CLARITI sobre investimento em atenção primária × ICSAP (que não foi confirmada pelo teste de Mann-Whitney e cuja comunicação já é tratada como requisito não-negociável no projeto).

### Especificação do modelo
- Treinado com dados de 2022 e 2023, testado fora do tempo em 2024.
- Teste 2024: 248.507 internações avaliadas; frequência geral de reinternação de 14,85%; os 10% de maior risco concentraram 45,72% das reinternações; lift de 3,08x.
- Mensagem central do produto: *"O CLARITI descreve o passado com Select AI, estima risco futuro com OML4Py e traduz os resultados em orientação gerencial governada com AI Agent."*

---

## 2. Banco de dados Oracle — o que já foi feito

### 2.1 Schema e views
Todos os objetos estão no schema **`CLARITI_DEV`**. A aplicação deve consumir **apenas** duas views (nunca a tabela de origem — ver seção 4):

| View | Uso |
|---|---|
| `CLARITI_DEV.VW_REINT_RISCO_MUN_ANO_RESUMO_K5` | Mapa, ranking municipal, cards, comparação entre anos (1 linha por município/ano) |
| `CLARITI_DEV.VW_REINT_RISCO_MUN_ANO_K5` | Drill-down por faixa de risco após clique no mapa (1 linha por município/ano/faixa) |

Contagens de referência (sanity check já validado):
- `VW_REINT_RISCO_MUN_ANO_RESUMO_K5` → 1932 linhas
- `VW_REINT_RISCO_MUN_ANO_K5` → 6207 linhas

### 2.2 Permissões (GRANT)
O usuário `ADMIN` já possui `SELECT` nas duas views. Se a aplicação usar outro usuário Oracle, é necessário rodar:

```sql
GRANT SELECT ON CLARITI_DEV.VW_REINT_RISCO_MUN_ANO_RESUMO_K5 TO NOME_DO_USUARIO;
GRANT SELECT ON CLARITI_DEV.VW_REINT_RISCO_MUN_ANO_K5 TO NOME_DO_USUARIO;
```

### 2.3 ORDS — habilitação auto-REST (feito)
As duas views foram habilitadas via `ORDS.ENABLE_OBJECT` (auto-REST, sem autenticação obrigatória — `p_auto_rest_auth => FALSE`). Endpoints auto-REST testados e funcionando:

```
GET /ords/clariti_dev/vw_reint_risco_mun_ano_resumo_k5/
GET /ords/clariti_dev/vw_reint_risco_mun_ano_k5/
```

> Limitação conhecida: auto-REST pagina em 25 registros por padrão e não suporta bind variable amigável para filtro por município — por isso foi criado um módulo customizado (seção 2.4).

### 2.4 ORDS — módulo customizado com handlers parametrizados (feito)
Módulo `claridev.ml.reinternacao` criado com `ORDS.DEFINE_MODULE` / `DEFINE_TEMPLATE` / `DEFINE_HANDLER`, expondo dois endpoints com bind variables seguras (`:ano`, `:municipio`):

```
GET /ords/clariti_dev/ml/risco-municipal/:ano
GET /ords/clariti_dev/ml/risco-faixas/:ano/:municipio
```

**Base URL do ambiente:**
```
https://g2fbcde454b473d-bx7cjasthbglzaq5.adb.sa-saopaulo-1.oraclecloudapps.com/ords/clariti_dev
```

Query do endpoint `risco-municipal/:ano`:
```sql
SELECT CD_MUNICIPIO_RES, NM_MUNICIPIO, RISCO_MEDIO_PCT,
       QT_INTERNACOES_AVALIADAS, QT_PRIORITARIO_PUBLICADA,
       PC_PRIORITARIO_PUBLICADA, STATUS_PRIORITARIO,
       QT_ELEVADO_OU_PRIORITARIO, PC_ELEVADO_OU_PRIORITARIO,
       STATUS_ELEVADO_OU_PRIORITARIO
FROM CLARITI_DEV.VW_REINT_RISCO_MUN_ANO_RESUMO_K5
WHERE NR_ANO_ADMISSAO = :ano
ORDER BY RISCO_MEDIO_PCT DESC
```

Query do endpoint `risco-faixas/:ano/:municipio`:
```sql
SELECT FAIXA_RISCO, ORDEM_FAIXA, QT_INTERNACOES_AVALIADAS, PROBABILIDADE_MEDIA
FROM CLARITI_DEV.VW_REINT_RISCO_MUN_ANO_K5
WHERE NR_ANO_ADMISSAO = :ano
  AND UPPER(NM_MUNICIPIO) = UPPER(:municipio)
ORDER BY ORDEM_FAIXA
```

### 2.5 Testes realizados
- Ambos os endpoints customizados (`risco-municipal/2024`, `risco-faixas/2024/São Paulo`) testados via navegador → **200 OK**, sem 404.
- Faixas de risco fixas (referência 2022/2023):
  - MENOR: < 11,3476%
  - INTERMEDIÁRIO: 11,3476% a < 18,2177%
  - ELEVADO: 18,2177% a < 26,7039%
  - PRIORITÁRIO: ≥ 26,7039%

**Status: banco de dados e camada REST prontos e validados.**

---

## 3. Objeto restrito — NUNCA acessar

```
CLARITI_DEV.TB_REINT_SCORE_ML_V1
```

Contém pontuações no grão da internação individual; serve apenas como camada interna para gerar os agregados k=5. A aplicação, o Select AI e qualquer AI Agent **não devem** ter acesso a essa tabela, direta ou indiretamente.

---

## 4. Regras de governança (não-negociáveis na aplicação)

Essas regras precisam virar **lógica de código**, não apenas texto de rodapé:

1. **Supressão k=5**: quando `STATUS_PRIORITARIO` ou `STATUS_ELEVADO_OU_PRIORITARIO` retornar `"SUPRIMIDO_K5"`, a UI deve exibir literalmente **"Suprimido pela política de publicação"**. O `NULL`/status suprimido **nunca** deve ser coagido para `0` (cuidado com `|| 0`, `??`, `.toFixed()` aplicados antes de checar o status).
2. **Terminologia obrigatória**: usar sempre **"internações avaliadas"** — nunca "pacientes" (os registros não representam necessariamente pacientes únicos).
3. **Framing obrigatório**: apresentar sempre como **"risco estimado"** — nunca como certeza de reinternação.
4. **Proibido**: sugerir diagnóstico, causalidade ou conduta clínica individual a partir do risco.
5. **k=5 é regra de governança do projeto** (proporcional), não uma exigência literal da LGPD — não afirmar isso na interface ou documentação.
6. **Nota metodológica Tier 3**: como este é um modelo com viés de sobrevivência conhecido (janela de 30 dias), a interface deve trazer uma nota metodológica breve, consistente com o padrão já usado para o framing da hipótese ICSAP × investimento (que também não foi confirmada e exige comunicação cuidadosa).

---

## 5. Próximos passos — Aplicação Web

### 5.1 Integração em `api.js`
- Criar funções de fetch para os dois endpoints customizados (`/ml/risco-municipal/:ano` e `/ml/risco-faixas/:ano/:municipio`), seguindo o mesmo padrão de tratamento de erro/resiliência já usado no `api.js` (o mesmo arquivo que trata `CONVERSATION_ID_KEY` e o retry silencioso do `ORA-20050` no Select AI).
- Normalizar a resposta da view resumo para tratar `SUPRIMIDO_K5` como estado explícito (campo derivado tipo `statusPrioritarioDisplay`), evitando que o dado suprimido seja formatado como número em qualquer etapa posterior.
- Fazer `encodeURIComponent` no nome do município antes de montar a URL do endpoint de drill-down (nomes com acento/espaço, ex: "São Paulo").

### 5.2 Frontend (usando o Leaflet já integrado)
- **Mapa**: colorir municípios por `RISCO_MEDIO_PCT`, com filtro por `NR_ANO_ADMISSAO`; municípios com status suprimido devem ter tratamento visual neutro (não podem herdar cor de escala de risco).
- **Ranking municipal**: ordenado por `RISCO_MEDIO_PCT` (view resumo).
- **Cards**: `QT_INTERNACOES_AVALIADAS` e `PC_PRIORITARIO_PUBLICADA` (respeitando a regra de supressão).
- **Drill-down**: ao clicar em um município no mapa, buscar `risco-faixas/:ano/:municipio` e renderizar gráfico de barras empilhadas por `FAIXA_RISCO`, ordenado por `ORDEM_FAIXA`.

### 5.3 Consistência de comunicação (crítico)
- Alinhar o texto de apresentação do módulo com o texto sugerido pela equipe de dados:
  > "O CLARITI identifica onde se concentram internações com maior risco estimado de nova internação em UTI em até 30 dias, apoiando o planejamento territorial e a priorização de acompanhamento."
- Garantir que a nota metodológica Tier 3 deste módulo não contradiga nem destoe da nota já usada para a hipótese ICSAP/investimento em outras partes do dashboard — ambas comunicam limitações estatísticas e devem seguir o mesmo tom/formato visual.
- Decidir onde este módulo entra na navegação: página própria (Módulo 4 dedicado) ou integrado ao Nível 2 (tático), que estava em configuração de gráficos no APEX Page Designer no último checkpoint.

---

## 6. Stack e ambiente de referência

- **Banco**: Oracle Autonomous AI Database 23ai/26ai, OCI `sa-saopaulo-1`
- **Schema do módulo ML**: `CLARITI_DEV`
- **ORDS workspace/alias**: `clariti_dev`
- **Frontend**: Vanilla HTML/CSS/JS + endpoints ORDS; Leaflet para mapas; Oracle APEX para páginas de visualização
- **Modelo**: OML4Py, treinado no próprio Oracle Database
