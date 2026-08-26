# 📖 Dicionário de Dados — CLARITI

**Tabela:** `ADMIN.TB_PAINEL_MUNICIPIO_ANO`
**Fonte:** `1TSCPF_SCRIPT_DDL_CLARITI.sql`
**Disciplina:** Smart SQL & Relational Databases — Entrega 03 (Sprint 2)
**Grão:** 1 registro por **município + ano** (2022, 2023 ou 2024)

---

## 1. Visão Geral

`TB_PAINEL_MUNICIPIO_ANO` é o **painel anual consolidado por município de São Paulo**. Ela reúne, em uma única linha por município/ano, quatro blocos de informação que hoje vivem em fontes separadas:

| Bloco | Origem dos dados | O que representa |
|---|---|---|
| Demografia | IBGE | População do município |
| Demanda hospitalar | SIH/SUS | Internações em UTI e ICSAP |
| Capacidade instalada | CNES | Estabelecimentos e leitos |
| Orçamento em saúde | SIOPS | Dotação e despesas públicas |

É essa tabela que sustenta diretamente a tese central do CLARITI: cruzar **quanto o município gastou em saúde** com **quantas internações evitáveis (ICSAP) ele teve**, para apontar onde o investimento em Atenção Primária não está sendo suficiente.

---

## 2. Chave e Relacionamentos

| Item | Definição |
|---|---|
| **Chave primária (PK)** | `CD_MUNICIPIO_RES` + `NR_ANO` (composta) |
| **Índice único** | `PK_PAINEL_MUNICIPIO_ANO` sobre (`CD_MUNICIPIO_RES`, `NR_ANO`) |
| **Chave estrangeira (FK)** | `FK_PAINEL_MUNICIPIO`: `CD_MUNICIPIO_RES` → `ADMIN.TB_MUNICIPIO(CD_MUNICIPIO_RES)` |

> A PK composta garante que só exista **um registro por município em cada ano** — essencial para a tabela funcionar como painel de série temporal (2022→2023→2024) sem duplicidade.

---

## 3. Dicionário de Colunas

| # | Coluna | Tipo | Nulo? | Chave | Descrição |
|---|---|---|:---:|:---:|---|
| 1 | `CD_MUNICIPIO_RES` | VARCHAR2(6) | Não | PK, FK | Código IBGE de 6 dígitos do município. |
| 2 | `NR_ANO` | NUMBER(4,0) | Não | PK | Ano de referência do registro municipal. |
| 3 | `QT_POPULACAO` | NUMBER(9,0) | Não | — | População do município no ano de referência, conforme dados do IBGE. |
| 4 | `NM_MUNICIPIO` | VARCHAR2(60) | Não | — | Nome do município conforme identificação do IBGE. |
| 5 | `QT_INTERNACOES_UTI` | NUMBER(6,0) | Não | — | Total de internações com UTI de residentes do município no ano. |
| 6 | `QT_INTERNACOES_ICSAP_UTI` | NUMBER(6,0) | Não | — | Quantidade de internações em UTI classificadas como Condições Sensíveis à Atenção Primária (ICSAP). |
| 7 | `VL_TOTAL_UTI` | NUMBER(18,2) | Não | — | Valor total pago pelas AIHs das internações com UTI do município no ano. |
| 8 | `QT_DIAS_PERM_UTI` | NUMBER(8,0) | Não | — | Soma dos dias de permanência das internações com UTI do município no ano. |
| 9 | `QT_ESTABELECIMENTOS_MEDIA` | NUMBER(10,2) | Sim | — | Média mensal de estabelecimentos de saúde ativos no município no ano. |
| 10 | `QT_LEITOS_EXISTENTES_MEDIA` | NUMBER(10,2) | Sim | — | Média mensal de leitos existentes no município no ano. |
| 11 | `QT_LEITOS_SUS_MEDIA` | NUMBER(10,2) | Sim | — | Média mensal de leitos SUS no município no ano. |
| 12 | `VL_SIOPS_DOTACAO_ATUALIZADA` | NUMBER(18,2) | Sim | — | Dotação atualizada de saúde do município referente ao ano **anterior** ao desfecho analisado. |
| 13 | `VL_SIOPS_DESPESA_EMPENHADA` | NUMBER(18,2) | Sim | — | Despesa empenhada em saúde do município referente ao ano **anterior** ao desfecho analisado. |
| 14 | `VL_SIOPS_DESPESA_LIQUIDADA` | NUMBER(18,2) | Sim | — | Despesa liquidada em saúde do município referente ao ano **anterior** ao desfecho analisado. |
| 15 | `VL_SIOPS_DESPESA_PAGA` | NUMBER(18,2) | Sim | — | Despesa efetivamente paga em saúde pelo município no ano **anterior** ao desfecho analisado. |

---

## 4. Regras de Negócio (Constraints)

| Constraint | Coluna(s) | Regra |
|---|---|---|
| `CK_PAINEL_ANO` | `NR_ANO` | Só aceita os anos `2022`, `2023` ou `2024` |
| `CK_PAINEL_POPULACAO` | `QT_POPULACAO` | Deve ser ≥ 0 |
| `CK_PAINEL_INTERNACOES_UTI` | `QT_INTERNACOES_UTI` | Deve ser ≥ 0 |
| `CK_PAINEL_ICSAP_UTI` | `QT_INTERNACOES_ICSAP_UTI` | Deve ser ≥ 0 **e** menor ou igual a `QT_INTERNACOES_UTI` (ICSAP é sempre um subconjunto do total de internações em UTI) |
| `CK_PAINEL_VALOR_UTI` | `VL_TOTAL_UTI` | Deve ser ≥ 0 |
| `CK_PAINEL_DIAS_PERM` | `QT_DIAS_PERM_UTI` | Deve ser ≥ 0 |

---

## 5. Observações Técnicas

- **Colunas 1–8 são obrigatórias (NOT NULL):** são os dados centrais do painel — identificação, demografia e demanda hospitalar — que vêm de fontes com cobertura completa (IBGE e SIH/SUS).
- **Colunas 9–15 são opcionais (permitem NULL):** são dados agregados de CNES (capacidade) e SIOPS (orçamento), fontes que podem ter lacunas de reporte para algum município/ano — por isso o modelo não força obrigatoriedade nelas.
- **Defasagem proposital nas colunas SIOPS (12–15):** os valores de dotação e despesa se referem ao **ano anterior** ao desfecho analisado (ex.: orçamento de 2022 associado às internações de 2023). Essa escolha de modelagem é o que permite à camada preventiva do CLARITI testar a hipótese "o quanto foi investido no ano passado explica o número de internações evitáveis deste ano?" — é a espinha dorsal analítica da tese ICSAP do projeto.
- **Granularidade agregada:** diferente da tabela fato "Perfil de Paciente" (nível de internação individual em UTI), `TB_PAINEL_MUNICIPIO_ANO` já é uma tabela **resumo**, pensada para consumo direto por dashboards e pelo Select AI, sem necessidade de agregações pesadas em tempo de consulta.
