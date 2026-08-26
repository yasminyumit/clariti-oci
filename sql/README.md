# 🗄️ sql/ — CLARITI

Scripts SQL da tabela `TB_PAINEL_MUNICIPIO_ANO`, o painel anual por município que sustenta os indicadores e o Select AI do CLARITI.

## Arquivos desta pasta

| Arquivo | Tipo | O que faz |
|---|---|---|
| `1TSCPF_SCRIPT_DDL_CLARITI.sql` | DDL | Cria a estrutura da tabela (colunas, chaves, constraints, comentários) |
| `1TSCPF_SCRIPT_DML_CLARITI.sql` | DML | Popula a tabela com os dados reais (1.935 linhas) |

**Ordem de execução: DDL primeiro, DML depois.** O DML só funciona se a tabela já existir com a estrutura certa.

---

## 1. Como o DDL funciona

O script faz 4 coisas, nesta ordem:

1. **`DROP TABLE`** — apaga a tabela se ela já existir, pra permitir rodar o script de novo do zero sem erro.
2. **`CREATE TABLE`** — cria `ADMIN.TB_PAINEL_MUNICIPIO_ANO` com 15 colunas: identificação do município/ano, população, internações em UTI, ICSAP, valor pago, dias de permanência, capacidade (estabelecimentos/leitos) e orçamento (SIOPS).
3. **`COMMENT ON TABLE` / `COMMENT ON COLUMN`** — documenta em português o que cada coluna significa. Isso não é decoração: é o que permite ao **Select AI** entender as perguntas do gestor sem precisar que ele conheça os nomes técnicos das colunas.
4. **Índice, constraints e FK** — depois da tabela criada:
   - Índice único (`PK_PAINEL_MUNICIPIO_ANO`) sobre `CD_MUNICIPIO_RES` + `NR_ANO`, que vira a chave primária.
   - 8 colunas marcadas como `NOT NULL` (as obrigatórias: identificação, população, internações).
   - 6 `CHECK`: ano só pode ser 2022/2023/2024, e nenhum valor numérico (população, internações, dias, valor) pode ser negativo. Uma delas garante que `ICSAP <= total de internações` — regra de negócio, não só de tipo de dado.
   - `FOREIGN KEY` de `CD_MUNICIPIO_RES` apontando para `TB_MUNICIPIO`.

**Dependência importante:** a FK exige que `TB_MUNICIPIO` já exista e já esteja populada com os 645 códigos de município **antes** de rodar o DML desta tabela — senão o INSERT falha por violação de chave estrangeira.

---

## 2. Como o DML funciona

É um script gerado pelo próprio SQL Developer (não escrito à mão): **1.935 comandos `INSERT`**, um por combinação de município + ano, seguidos de `COMMIT` no final.

```sql
Insert into ADMIN.TB_PAINEL_MUNICIPIO_ANO
  (CD_MUNICIPIO_RES, NR_ANO, QT_POPULACAO, NM_MUNICIPIO, ...)
values
  ('351990','2022','7619','Iepê - SP','81','22', ... );
```

Cada linha carrega os valores na mesma ordem das colunas do DDL. Conferido diretamente no arquivo:

| Checagem | Resultado |
|---|---|
| Total de `INSERT` | 1.935 |
| Distribuição por ano | 645 (2022) + 645 (2023) + 645 (2024) = 1.935 — bate exato com 645 municípios × 3 anos |
| Fecha com `COMMIT`? | Sim |
| Colunas SIOPS em 2022 | **100% nulas** nas 645 linhas (`null,null,null,null` no final de cada insert) |

### Por que SIOPS vem nulo em 2022 — e isso é esperado, não erro

As 4 colunas de orçamento (`VL_SIOPS_*`) guardam o investimento do **ano anterior** ao desfecho (o orçamento de 2022 é associado às internações de 2023, por exemplo — decisão de modelagem já documentada no dicionário de dados). Como não existe SIOPS de 2021 no escopo do projeto, **não tem como preencher SIOPS de 2022**, e por isso o script traz esses 4 campos nulos em todas as 645 linhas daquele ano — de propósito, não é dado faltando por falha de carga. A partir de 2023 esses campos vêm preenchidos normalmente.

---

## Resumo rápido

| Item | Valor |
|---|---|
| Tabela | `ADMIN.TB_PAINEL_MUNICIPIO_ANO` |
| Linhas carregadas | 1.935 (645 municípios × 3 anos) |
| Colunas | 15 (8 obrigatórias + 7 opcionais) |
| Chave primária | `CD_MUNICIPIO_RES` + `NR_ANO` |
| Chave estrangeira | `CD_MUNICIPIO_RES` → `TB_MUNICIPIO` |
| Constraints `CHECK` | 6 |
| Pré-requisito para rodar o DML | `TB_MUNICIPIO` já criada e populada |
