# 📖 Dicionário de Dados — `painel_municipio_ano_sp_2022_2024.parquet`

**Grão:** 1 registro por **município + ano**
**Dimensão:** 1.935 linhas × 15 colunas (645 municípios de SP × 3 anos: 2022, 2023, 2024)

> Este arquivo é a **fonte bruta** que, após passar pelo KNIME e ser renomeada, vira a tabela `ADMIN.TB_PAINEL_MUNICIPIO_ANO` no Oracle . Os nomes de coluna aqui ainda estão no padrão de origem, antes da renomeação para o padrão do banco.

---

## 1. Chave

| Item | Definição |
|---|---|
| Chave do registro | `municipio_6` + `ano` (não há duplicidade — confirmado: 645 municípios × 3 anos = 1.935 linhas exatas) |
| `municipio_6` | Sempre 6 caracteres (código IBGE) — 100% consistente, sem exceção |

---

## 2. Dicionário de Colunas

| # | Coluna | Tipo | Nulos | Mín. | Mediana | Máx. | Descrição | Coluna no Oracle |
|---|---|---|---|---|---|---|---|---|
| 1 | `municipio_6` | texto | 0 | — | — | — | Código IBGE de 6 dígitos do município | `CD_MUNICIPIO_RES` |
| 2 | `ano` | inteiro | 0 | 2022 | 2023 | 2024 | Ano de referência | `NR_ANO` |
| 3 | `populacao` | inteiro | 0 | 907 | 13.171 | 11.895.578 | População do município no ano (IBGE) | `QT_POPULACAO` |
| 4 | `nome_municipio` | texto | 0 | — | — | — | Nome do município | `NM_MUNICIPIO` |
| 5 | `qtd_internacoes_uti` | inteiro | 0 | 3 | 92 | 63.070 | Total de internações em UTI no ano | `QT_INTERNACOES_UTI` |
| 6 | `qtd_internacoes_icsap_uti` | inteiro | 0 | 0 | 16 | 9.874 | Internações em UTI classificadas como ICSAP | `QT_INTERNACOES_ICSAP_UTI` |
| 7 | `soma_val_tot` | decimal | 0 | R$ 17,2 mil | R$ 745,8 mil | R$ 569,3 milhões | Valor total pago (AIH) das internações em UTI | `VL_TOTAL_UTI` |
| 8 | `soma_dias_perm` | inteiro | 0 | 14 | 968 | 834.597 | Soma dos dias de permanência em UTI | `QT_DIAS_PERM_UTI` |
| 9 | `qtd_estabelecimentos_media` | decimal | 0 | 2,0 | 20,6 | 23.378,9 | Média mensal de estabelecimentos de saúde ativos | `QT_ESTABELECIMENTOS_MEDIA` |
| 10 | `qtd_leitos_existentes_media` | decimal | **853 (44,1%)** | 1,0 | 63,0 | 38.236,5 | Média mensal de leitos existentes | `QT_LEITOS_EXISTENTES_MEDIA` |
| 11 | `qtd_leitos_sus_media` | decimal | **853 (44,1%)** | 0,0 | 44,0 | 18.724,1 | Média mensal de leitos SUS | `QT_LEITOS_SUS_MEDIA` |
| 12 | `siops_dotacao_atualizada` | decimal | **645 (33,3%)** | R$ 0 | R$ 15,0 milhões | R$ 17,1 bilhões | Dotação orçamentária de saúde (ano anterior) | `VL_SIOPS_DOTACAO_ATUALIZADA` |
| 13 | `siops_despesa_empenhada` | decimal | **645 (33,3%)** | R$ 3,1 milhões | R$ 14,5 milhões | R$ 16,8 bilhões | Despesa empenhada em saúde (ano anterior) | `VL_SIOPS_DESPESA_EMPENHADA` |
| 14 | `siops_despesa_liquidada` | decimal | **645 (33,3%)** | R$ 3,1 milhões | R$ 14,0 milhões | R$ 16,0 bilhões | Despesa liquidada em saúde (ano anterior) | `VL_SIOPS_DESPESA_LIQUIDADA` |
| 15 | `siops_despesa_paga` | decimal | **645 (33,3%)** | R$ 2,9 milhões | R$ 13,5 milhões | R$ 15,9 bilhões | Despesa paga em saúde (ano anterior) | `VL_SIOPS_DESPESA_PAGA` |

---

## 3. Qualidade dos Dados — Nulos Explicados

| Grupo de colunas | Nulos | Padrão observado | Causa |
|---|---|---|---|
| `siops_*` (4 colunas) | 645 — **100% concentrado em 2022** | 2023 e 2024 sem nenhum nulo | Design, não falha: essas colunas trazem o orçamento do **ano anterior**, e não há SIOPS de 2021 disponível para associar a 2022 |
| `qtd_leitos_existentes_media` / `qtd_leitos_sus_media` | 853 no total, distribuído quase igual entre os 3 anos (282 / 285 / 286) | Sem concentração em um ano específico | Gap de cadastro no CNES — nem todo município reporta leitos em todo período |

Nenhuma outra coluna tem valor nulo. `qtd_estabelecimentos_media` está sempre preenchida, mesmo quando leitos não estão — ou seja, o município aparece cadastrado, mas sem detalhamento de leito naquele ano.

---

## 4. Checagens de Consistência (validadas nos dados reais)

| Regra | Resultado |
|---|---|
| `qtd_internacoes_icsap_uti` nunca maior que `qtd_internacoes_uti` | ✅ 0 violações |
| `municipio_6` sempre com 6 caracteres | ✅ 100% das linhas |
| `qtd_estabelecimentos_media` nunca zero | ✅ mínimo observado é 2,0 |
| 645 municípios × 3 anos = 1.935 linhas | ✅ bate exato, sem duplicidade nem lacuna |

---

## 5. Observação sobre Escala

Os valores de população, internações e orçamento têm **amplitude enorme** entre o menor e o maior município (ex.: população vai de 907 a quase 12 milhões de habitantes). Isso já era esperado e é o motivo pelo qual a AED do projeto recomenda usar **mediana e taxas por 10 mil habitantes**, em vez de média bruta, para qualquer comparação entre municípios.