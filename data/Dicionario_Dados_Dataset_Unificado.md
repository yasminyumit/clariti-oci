# 📖 Dicionário de Dados — `dataset_unificado_sp_2022_2024.csv`

**Grão:** 1 registro por **município de residência + diagnóstico (CID-10) + ano + mês**
**Dimensão:** 463.299 linhas × 17 colunas — representando **813.422 internações reais em UTI**

> ⚠️ Este arquivo **não é 1 linha = 1 internação**. Cada linha é um *bucket* que já vem agregado; a contagem real de internações está na coluna `qtd_internacoes_uti` e deve ser **somada**, nunca contada em número de linhas (regra 0 da AED do projeto).

---

## 1. Cobertura

| Item | Valor |
|---|---|
| Período | 2022, 2023 e 2024 (todos os 12 meses) |
| Municípios distintos (`municipio_6`) | 2.175 no total — porque o dataset traz **pacientes de todo o Brasil** internados em UTI residindo fora de SP |
| Municípios de São Paulo (`reside_fora_sp = False`) | 645 |
| Diagnósticos distintos (`diag_princ`) | 6.242 códigos CID-10 |
| Soma de `qtd_internacoes_uti` | **813.422** (251.743 em 2022, 271.679 em 2023, 290.000 em 2024) — bate exatamente com o total já validado na AED |

---

## 2. Dicionário de Colunas

| # | Coluna | Tipo | Nulos | Descrição |
|---|---|---|---|---|
| 1 | `municipio_6` | texto | 0 | Código IBGE (6 dígitos) do município de **residência** do paciente |
| 2 | `diag_princ` | texto | 0 | Código CID-10 do diagnóstico principal da internação (ex.: `I850`, `C16`) |
| 3 | `qtd_internacoes_uti` | inteiro | 0 | Quantidade de internações em UTI neste bucket — **coluna a somar**, não a contar linhas |
| 4 | `soma_val_tot` | decimal | 0 | Soma do valor total pago (AIH) das internações do bucket |
| 5 | `soma_dias_perm` | inteiro | 0 | Soma dos dias de permanência das internações do bucket |
| 6 | `soma_uti_mes_to` | inteiro | 0 | Soma do campo SIH `UTI_MES_TO` — dias de UTI efetivamente faturados |
| 7 | `ano` | inteiro | 0 | Ano de referência (2022–2024) |
| 8 | `mes` | inteiro | 0 | Mês de referência (1–12) |
| 9 | `uf_residencia` | texto | 0 | UF de residência do paciente (27 valores — todos os estados aparecem) |
| 10 | `reside_fora_sp` | booleano | 0 | `True` se o paciente reside fora de São Paulo |
| 11 | `qtd_estabelecimentos` | decimal | 7.833 (1,7%) | Nº de estabelecimentos de saúde no município no mês |
| 12 | `qtd_leitos_existentes` | decimal | 49.737 (10,7%) | Leitos existentes no município no mês |
| 13 | `qtd_leitos_sus` | decimal | 49.737 (10,7%) | Leitos SUS no município no mês |
| 14 | `qtd_leitos_contratados` | decimal | 49.737 (10,7%) | Leitos contratados no município no mês |
| 15 | `qtd_leitos_nao_sus` | decimal | 49.737 (10,7%) | Leitos não-SUS no município no mês |
| 16 | `populacao` | decimal | 7.833 (1,7%) | População do município de residência no ano |
| 17 | `nome_municipio` | texto | 7.833 (1,7%) | Nome do município de residência |

---

## 3. Qualidade dos Dados — Nulos Explicados

Confirmados nos dados reais, duas famílias de nulo com causas bem diferentes:

### Família A — `qtd_estabelecimentos`, `populacao`, `nome_municipio` (7.833 linhas, 1,7%)
- **7.824 linhas** são de pacientes com `reside_fora_sp = True` — como o contexto municipal (população, estabelecimentos, nome) só foi montado para os 645 municípios de SP, pacientes de outros estados ficam sem esse enriquecimento. **Nulo intencional (MAR)**, não é erro.
- **9 linhas-exceção**: pacientes com `reside_fora_sp = False` (ou seja, moram em SP) mas ainda assim sem população/nome preenchidos — concentradas em só 3 códigos de município (`352330`, `354625`, `355120`). Indica um pequeno gap de casamento entre o código do paciente e a tabela de referência municipal — **vale investigar esses 3 códigos antes de fechar a versão final**, mas o volume é irrelevante (9 em 463 mil linhas).

### Família B — `qtd_leitos_*` (4 colunas, 49.737 linhas, 10,7%)
- Bem mais ampla que a Família A: além das 7.824 linhas de fora de SP, inclui **41.913 linhas de dentro de SP** sem dado de leito (9,2% dos registros de residentes de SP).
- Esse excedente **não tem explicação de design** — é um gap de cadastro no CNES (nem todo município reporta leito em todo mês). Já era esperado: é o mesmo padrão descrito na AED do projeto.

---

## 4. Observações Técnicas

- **Não existe coluna de ICSAP neste arquivo.** A classificação de "internação evitável" não vem pronta aqui — ela é calculada à parte, cruzando `diag_princ` com uma lista de referência de CID-10 sensíveis à Atenção Primária. Qualquer uso deste CSV para calcular ICSAP precisa desse join adicional.
- **`qtd_leitos_contratados` é constante em zero** em todas as 413.562 linhas não nulas (média, mínimo e máximo = 0). Ou não há leito contratado registrado em nenhum município de SP no período, ou a fonte não populou esse campo — vale confirmar na extração do CNES antes de usar essa coluna em qualquer análise, porque hoje ela não carrega informação nenhuma.
- **Escopo nacional, não só paulista:** por trazer pacientes residentes em qualquer UF, este arquivo é mais amplo que `painel_municipio_ano_sp_2022_2024.parquet` (que é só município × ano de SP). Ao cruzar os dois datasets, filtrar por `reside_fora_sp = False` antes de comparar.
- **`diag_princ` tem 3 ou 4 caracteres** (nunca menos) — 45.672 códigos com 3 caracteres (categoria CID-10 sem subdivisão, ex. `C16`) e 417.627 com 4 (subcategoria, ex. `I850`).