# 📂 Evidências e Anotações do CLARITI

---

Esta pasta reúne as **evidências técnicas** que comprovam a construção, carga e consulta do banco Oracle do CLARITI ao longo das Sprints 2 e 3. Cada documento contém prints de tela, scripts SQL executados e o resultado das validações — é o rastro de prova de que o que está descrito no README principal do projeto foi, de fato, implementado.

| Arquivo | Sprint | Disciplina | Conteúdo |
|---|---|---|---|
| `1TSCPF_Evidencias_Importacao_CLARITI.docx` | Sprint 2 | Smart SQL & Relational Databases | Primeira carga de dados no Oracle via SQL Developer |
| `Evidências-Sprint_3-rm569408.docx` | Sprint 3 | — | Pipeline completo: banco, KNIME, carga, COMMENTS e Select AI |

---

## 1. Sprint 2 — Evidências de Importação

Documenta a **primeira carga de dados** no Oracle, feita via assistente de importação do SQL Developer.

| Item | Detalhe |
|---|---|
| Dataset importado | `painel_municipio_ano_sp_2022_2024.csv` |
| Registros | 1.935 linhas |
| Colunas | 15 |
| Cobertura | 645 municípios de SP × 3 anos (2022–2024) |
| Tabela de destino | `TB_PAINEL_MUNICIPIO_ANO` |

**O que o documento comprova:**
- Mapeamento coluna a coluna do CSV de origem para os campos da tabela Oracle.
- Prints de cada etapa do assistente (seleção do arquivo, visualização dos dados, método de importação, definição de colunas).
- Validação final por SQL: `COUNT(*) = 1.935`, distribuição de 645 registros por ano, e conferência da estrutura da tabela no dicionário de dados do Oracle (`USER_TAB_COLUMNS`).

> Nesta etapa, o modelo de dados do projeto ainda era composto por **uma única tabela**.

---

## 2. Sprint 3 — Evidências do Pipeline Completo

Documento mais abrangente, cobrindo desde a infraestrutura até as consultas analíticas com IA. Estruturado em 9 blocos:

### 2.1 Infraestrutura Oracle
Instância **Oracle Autonomous AI Database** (workload OLTP, versão 26ai, camada Always Free, região `sa-saopaulo-1`), com conexão validada via **Wallet** no SQL Developer.

### 2.2 Evolução do Modelo Relacional
O modelo de uma tabela da Sprint 2 é **substituído** por um modelo de três tabelas, mais aderente ao escopo final do projeto:

| Tabela | Papel | Granularidade |
|---|---|---|
| `TB_MUNICIPIO` | Dimensão | 1 linha por município (645) |
| `TB_PERFIL_PACIENTE_UTI` | Fato | 1 linha por internação individual em UTI |
| `TB_PAINEL_MUNICIPIO_ANO` | Fato | 1 linha por município × ano |

### 2.3 Tratamento dos Dados no KNIME
Os dois datasets brutos passam por pipelines de limpeza antes da carga:

| Dataset | Entrada | Tratamento | Saída |
|---|---|---|---|
| Perfil de paciente UTI | 813.422 registros / 18 colunas | Remoção de 2021, arredondamento de valores, normalização de flags booleanas | **794.921** registros / 18 colunas |
| Painel município × ano | 1.935 registros / 15 colunas | Renomeação e arredondamento de campos | **1.935** registros / 15 colunas |
| Dimensão município | Derivada do painel tratado | `GroupBy` para 1 linha por município | **645** registros / 2 colunas |

### 2.4 Carga no Oracle e Validação
Importação na ordem `TB_MUNICIPIO → TB_PAINEL_MUNICIPIO_ANO → TB_PERFIL_PACIENTE_UTI` (respeitando a chave estrangeira), com contagens pós-carga conferidas por SQL.

### 2.5 COMMENTS — Documentação Semântica
Todas as tabelas e colunas foram documentadas com `COMMENT ON TABLE` / `COMMENT ON COLUMN`, dando contexto de negócio para que o Select AI interprete corretamente as perguntas em português.

### 2.6 Oracle Select AI
Ativação e validação do perfil `GENAI_PROFILE` (`STATUS = ENABLED`), usando o fluxo **SHOWSQL → validação → RUNSQL** para conferir a lógica antes de executar sobre os dados reais.

### 2.7 Consultas Analíticas (Select AI)

| # | Pergunta de negócio | Insight principal |
|---|---|---|
| 1 | Despesa SIOPS por habitante × proporção de internações ICSAP (2023 vs. 2024) | O efeito do investimento não é imediato nem deve ser lido como causal isoladamente |
| 2 | Perfil etário/sexo × taxa de reinternação em UTI em até 30 dias | Maiores taxas concentradas em faixas etárias jovens (20–29 anos) |
| 3 | Municípios com maior pressão assistencial (internações UTI ÷ leitos SUS) × principal grupo CSAP | Juquitiba, Vargem Grande Paulista e Poá lideram a razão de pressão |

Cada consulta traz: prompt em linguagem natural, print do `SHOWSQL`, print do `RUNSQL`, insight analítico e recomendação executiva.

### 2.8 Síntese Executiva
Recomenda um acompanhamento periódico cruzando proporção de ICSAP, reinternação estimada, perfil do paciente e execução orçamentária, priorizando municípios que aparecem em mais de um indicador crítico simultaneamente.

### 2.9 Checklist Final
Lista de conferência com todos os prints exigidos para a entrega (infraestrutura, tabelas, KNIME, cargas, COMMENTS, Select AI e consultas).

---

## 3. O Que Esta Pasta Comprova

Lida em conjunto, a documentação mostra a **evolução real do banco entre as sprints**:

- **Sprint 2:** uma tabela única e agregada (`TB_PAINEL_MUNICIPIO_ANO`), prova de conceito da carga no Oracle.
- **Sprint 3:** modelo de três tabelas, incluindo grão de paciente individual, com pipeline de tratamento (KNIME), documentação semântica (COMMENTS) e consultas reais via Select AI.

Ou seja: os pilares **Convergência → Autonomia → Prevenção**, descritos no README principal do CLARITI, já estão funcionando de ponta a ponta no Oracle — com prints e queries reais para comprovar cada etapa.

---

## 4. Como Usar Esta Pasta

- Para avaliar a **carga inicial de dados**, consulte `1TSCPF_Evidencias_Importacao_CLARITI.docx`.
- Para avaliar o **pipeline completo** (banco, tratamento, carga e Select AI), consulte `Evidências-Sprint_3-rm569408.docx`.
- Os scripts DDL referenciados nestes documentos estão versionados separadamente na pasta `sql/` do repositório.
