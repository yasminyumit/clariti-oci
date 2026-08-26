# 📓 notebooks/ — CLARITI

> Challenge Oracle + FIAP 2026 · Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento

---

## Sobre o CLARITI (resumo geral do projeto)

O **CLARITI** transforma dados públicos e fragmentados do SUS em **decisões concretas de orçamento** para a saúde pública. Ele nasce do desafio oficial da Oracle — um Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento — e vai além: em vez de só mostrar onde a rede hospitalar está sob pressão, ele busca **prever** essa pressão e recomendar **onde realocar recursos** antes que o problema vire crise.

A solução se apoia em três pilares, unificados no Oracle Autonomous AI Database:

| Pilar | O que é |
|---|---|
| 🔗 **Convergência** | Dados do SIH/SUS, CNES e IBGE/SIOPS unificados em um único repositório (*Single Source of Truth*) |
| 🗣️ **Autonomia** | Gestores consultam o banco em português via **Select AI**, sem depender de um analista SQL |
| 🛡️ **Prevenção** | Machine Learning e georreferenciamento para antecipar saturação hospitalar e orientar a alocação orçamentária |

**Tese central do projeto:** municípios que investem adequadamente em Atenção Primária à Saúde (APS) deveriam apresentar menos internações evitáveis (**ICSAP** — Condições Sensíveis à Atenção Primária). É exatamente essa tese que o notebook desta pasta testa formalmente — com um resultado que merece atenção especial (ver seção 3 abaixo).

---

## Conteúdo desta pasta

| Arquivo | Papel no pipeline |
|---|---|
| `Agregar_SIH_UTI.py` | Extrai o SIH/SUS via FTP do DATASUS, filtra internações em UTI, gera `.parquet` |
| `Baixar_CNES.py` | Extrai o cadastro de estabelecimentos e leitos via API (`pysus`) |
| `Baixar_Populacao_IBGE.py` | Extrai população municipal via IBGE/SIDRA |
| `Montar_Dataset_Unificado.py` | Consolida as três fontes no modelo estrela (Star Schema) |
| **`AED_ICSAP_UTI_SP_10.ipynb`** | Análise Exploratória de Dados + Teste de Hipótese sobre o dataset unificado |

---

## 📊 `AED_ICSAP_UTI_SP_10.ipynb` — Resumo

### Objetivo

Este notebook conduz a **Análise Exploratória de Dados (AED)** do dataset unificado de internações com UTI em São Paulo, classificadas por ICSAP, e depois **testa estatisticamente a tese central do projeto** — se investir mais em atenção primária reduz internações evitáveis. Segue o "Guia de Métodos Estatísticos" da disciplina (passos 9–16), atendendo diretamente aos requisitos oficiais do Challenge para a disciplina de Statistical Methods & Machine Learning (dataset unificado, dicionário de dados, distribuição, missing, outliers, correlações e conclusão).

### Datasets utilizados

| Dataset | Granularidade | Tamanho |
|---|---|---|
| `dataset_unificado_sp_2022_2024.parquet` | Bucket agregado (município + diagnóstico + ano + mês) | 463.299 linhas, representando 813.422 internações reais em UTI |
| `painel_municipio_ano_sp_2022_2024.parquet` | Município × ano | 1.935 linhas (645 municípios × 3 anos), inclui dados SIOPS |

Cobertura: 645 municípios de São Paulo, 2022–2024.

### Estrutura do notebook (10 etapas)

| Etapa | O que faz | Achado principal |
|---|---|---|
| 0 | Regras metodológicas definidas antes da análise | Somar em vez de contar linha; taxa sempre por 10 mil hab.; mediana/IQR em vez de média/desvio; outlier clínico não se remove sem investigar |
| 1 | Perfil geral do dataset | 18,7% das internações em UTI são ICSAP, crescendo ano a ano |
| 2 | Missing (valores ausentes) | 3 famílias de nulo com causas distintas — nulo por design (83%), MAR intencional (1,7%, pacientes de fora de SP), MAR/possível MNAR acidental (10,7%, gap de cadastro de leitos). Nenhuma imputação feita, tudo documentado |
| 3 | Distribuição das métricas centrais | 5 métricas por município × ano; mediana de 67,3 internações UTI/10k hab., 18,3% ICSAP |
| 4 | Outliers | 90,4% dos município-ano não é outlier em nada; o caso de Tupã é outlier real (volume alto), não ruído estatístico |
| 5 | Correlação com capacidade instalada | Correlação fraca (no máximo -0,24) — leitos e estabelecimentos sozinhos não explicam a variação entre municípios |
| 6 | Sazonalidade | Sinal fraco no agregado (~8–9%), mas forte por grupo de doença: internações pulmonares variam quase 70%, com pico no inverno |
| 7 | Recorte geográfico | Região (IBGE) é o fator mais explicativo encontrado: taxa ICSAP varia mais que o dobro entre regiões; confirma a hipótese de "polo regional de saúde" |
| 8 | Síntese da AED | Fecha as 7 dimensões e identifica a lacuna a resolver: falta a variável de investimento (SIOPS) para testar a tese central |
| 9 | Preparação estatística | Testa normalidade (rejeitada nos dois grupos) e confundimento — a correlação bruta entre investimento e internação (0,841) cai para praticamente zero (0,034) ao controlar pelo município |
| 10 | Teste de hipótese (Mann-Whitney) | Resultado **inverte** a tese original do projeto (ver destaque abaixo) |

### ⚠️ Achado central: o teste de hipótese inverteu a tese do projeto

O notebook testou formalmente: *"município que investe mais por habitante em atenção primária tem taxa de internação evitável menor?"*

- **Resultado:** não. O teste principal (Mann-Whitney, unicaudal) **não rejeitou H0** (p = 0,9994). Na direção oposta, o resultado foi **altamente significativo** (p entre 0,0006 e 0,0078) em três recortes diferentes (mediana, tercil, quartil).
- **Por quê:** não é que investir mais piora o resultado. É **confundimento pelo porte do município**. Município pequeno tem custo fixo de manter uma rede de saúde dividido por menos habitantes — o que eleva o investimento per capita — e, ao mesmo tempo, tem pior acesso à rede especializada de referência — o que eleva a taxa de internação evitável. As duas coisas nascem da mesma causa (tamanho do município), não uma da outra. Isso fica comprovado na etapa 9: a correlação bruta (0,841) cai para 0,034 quando se olha só a variação *dentro* do mesmo município ao longo do tempo.
- **O que isso muda para o CLARITI:** um gestor que olhasse só a correlação bruta chegaria à conclusão errada de que reduzir investimento melhoraria o resultado. A recomendação do notebook não é aumentar o repasse per capita de município pequeno de forma genérica (ele já recebe mais por habitante e continua com taxa alta) — é priorizar **intervenção estrutural de acesso** (telemedicina, mutirão itinerante de especialista, vínculo formal com um polo regional já identificado, como Tupã) nos municípios pequenos e isolados. Qualquer ranking de investimento × resultado no painel do CLARITI deve vir acompanhado do porte do município, para não induzir decisão de alocação de recurso equivocada.

> Este é um achado honesto e estatisticamente robusto — vale mais para a gestão pública do que uma confirmação simples da hipótese original teria valido, e deve ser refletido na forma como o CLARITI comunica sua tese central nas próximas entregas (evitar a leitura simplista "investir mais = interna menos").

### Outros achados relevantes da AED

- **Sazonalidade real existe, mas escondida no agregado**: só aparece quando quebrada por grupo de doença — internações pulmonares no inverno são o sinal mais forte (quase 70% de variação).
- **"Polo de saúde regional" é um padrão, não um caso isolado**: cerca de 20 municípios do interior de SP (Tupã, São José do Rio Preto, Ribeirão Preto, Marília, Bauru, entre outros) combinam alta capacidade instalada per capita com alto volume de atendimento — sinal de que atendem pacientes de municípios vizinhos.
- **Capacidade hospitalar (leitos/estabelecimentos) explica pouco da variação entre municípios**; região geográfica (IBGE) é o fator mais explicativo identificado até agora.

### Como isso se conecta ao restante do Challenge

Esta AED cobre o pilar **"Sazonalidade por Região"** e parte do pilar **"Internação"** do case do grupo. O pilar **"Perfil"** (quem são os pacientes) fica para a etapa de Machine Learning, que usa a tabela em grão de paciente individual (`perfil_paciente_sp_2022_2024.parquet`, ~813 mil linhas) — a mesma que sustenta `TB_PERFIL_PACIENTE_UTI` no banco Oracle.
