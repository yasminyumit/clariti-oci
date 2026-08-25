# 🏥 CLARITI — Inteligência Orçamentária e Acesso Hospitalar para a Saúde Pública

> **Enterprise Challenge Oracle + FIAP 2026**

> **Curso:** Data Science, Analytics, Agents & AI

> **Equipe:** Seraph | **Turma:** 1TSCPF

---

## 📑 Índice

1. [Visão Geral da Solução](#1--visão-geral-da-solução)
2. [Fluxo do Projeto](#2--fluxo-do-projeto-da-fonte-de-dados-à-decisão-do-gestor)
3. [Stack Tecnológico](#3--stack-tecnológico)
4. [Engenharia de Dados: Fontes e Decisões Técnicas](#4--engenharia-de-dados-fontes-e-decisões-técnicas)
5. [Modelagem, Privacidade (LGPD) e Perfil do Paciente](#5--modelagem-privacidade-lgpd-e-perfil-do-paciente)
6. [Select AI: Autonomia para o Gestor](#6--select-ai-autonomia-para-o-gestor)
7. [Indicadores de Desempenho (KPIs)](#7--indicadores-de-desempenho-e-saúde-orçamentária-kpis)
8. [Governança, Segurança e COBIT 2019](#8--governança-segurança-e-cobit-2019)
9. [Estrutura do Repositório](#9--estrutura-do-repositório)
10. [Equipe](#10--equipe)

---

## 1. 🚀 Visão Geral da Solução

### O que é o CLARITI?

O **CLARITI** é uma plataforma que transforma dados públicos e fragmentados do SUS em **decisões concretas de orçamento** para a saúde pública. Ele nasce a partir do desafio oficial da Oracle — construir um Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento — e vai um passo além: em vez de só *mostrar* onde a rede hospitalar está sob pressão, o CLARITI **prevê** essa pressão e recomenda **onde realocar recursos financeiros antes que o problema vire crise**.

Na prática, o CLARITI substitui um fluxo hoje lento e manual — gestor pede um relatório → analista escreve SQL → relatório demora dias — por um fluxo direto: **gestor pergunta em português, o sistema já entende o padrão de risco e aponta a ação**.

### Qual problema o CLARITI resolve?

Hoje, secretarias de saúde precisam responder perguntas como "onde as internações estão crescendo?" ou "qual hospital vai estourar a capacidade?" **sem depender de um analista técnico disponível o tempo todo**. Isso atrasa decisões que, na saúde pública, custam caro — tanto em dinheiro quanto em vidas.

> **Tese central do projeto:** municípios que investem adequadamente em Atenção Primária à Saúde (APS) apresentam menos internações evitáveis (**ICSAP** — Condições Sensíveis à Atenção Primária) e menos reinternações precoces. O CLARITI usa essa tese como fio condutor: ele mede, com dados reais, se o dinheiro está indo para o lugar certo.

### O que a solução entrega (MVP em 4 módulos)

| Módulo | O que faz | Por que importa |
|---|---|---|
| **Dashboard Executivo** | Reúne em um só painel os KPIs de internações, custo, ocupação e capacidade | Dá ao gestor uma visão completa sem precisar cruzar relatórios manualmente |
| **Pergunte ao Banco** (Select AI) | O gestor digita uma pergunta em português e recebe a resposta direto do banco | Elimina a espera por um analista SQL para cada nova dúvida |
| **Análise de Pressão Assistencial** | Cruza demanda (internações), capacidade (leitos) e população | Mostra objetivamente **onde** a rede está mais sobrecarregada |
| **Camada Preventiva** (Machine Learning) | Usa o histórico para prever saturação hospitalar e risco de reinternação | Transforma o painel de reativo em **preventivo** — dá tempo de agir antes do colapso |

### Para quem é o CLARITI?

Secretarias municipais e estaduais de saúde, gestores de redes hospitalares e áreas de planejamento orçamentário que precisam decidir, com evidência e rapidez, **onde investir primeiro**.

---

## 2. 🔄 Fluxo do Projeto (da Fonte de Dados à Decisão do Gestor)

Esta seção explica, passo a passo, o caminho que o dado percorre desde a base bruta do DATASUS até a recomendação que chega ao gestor de saúde.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ETAPA 1 — EXTRAÇÃO E ENGENHARIA DE DADOS (Python)                        │
│ Agregar_SIH_UTI.py · Baixar_CNES.py · Baixar_Populacao_IBGE.py           │
│ SIH/SUS (FTP · .dbc)   ·   CNES (API · JSON)   ·   IBGE/SIDRA (CSV/API)  │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     │ arquivos tratados (.parquet)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ETAPA 2 — ORQUESTRAÇÃO DO PIPELINE (Apache Airflow · DAG)                │
│ Ingestão  →  Transformação  →  Validação  →  Carga Analítica             │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     │ carga no banco
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ETAPA 3 — CONVERGÊNCIA (Oracle Autonomous AI Database)                   │
│ Montar_Dataset_Unificado.py  →  Modelo Estrela (Star Schema)             │
│ Tabela fato "Perfil de Paciente" (800 mil+ internações em UTI)           │
│ Enriquecimento semântico: COMMENT ON TABLE / COMMENT ON COLUMN           │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     │
                     ┌───────────────┴────────────────┐
                     ▼                                  ▼
     ┌───────────────────────────────┐   ┌──────────────────────────────────┐
     │ ETAPA 4A — SELECT AI            │   │ ETAPA 4B — ML + GEORREFERENCIAMENTO│
     │ Pergunta em português           │   │ Previsão de saturação, clusters   │
     │ → SQL gerado automaticamente    │   │ de risco, sinal de reinternação   │
     └────────────────┬────────────────┘   └───────────────────┬────────────────┘
                       └───────────────┬───────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ETAPA 5 — PAINEL EXECUTIVO (Dashboard / Oracle APEX)                     │
│ KPIs de custo, ociosidade e produtividade  ·  Mapas de pressão regional  │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     ▼
                       DECISÃO DO GESTOR DE SAÚDE
        (onde e quando realocar orçamento antes do colapso da rede)
```

### Explicando cada etapa

**Etapa 1 — Extração e Engenharia de Dados.**
Três scripts em Python cuidam de buscar e limpar os dados na origem:
- `Agregar_SIH_UTI.py` baixa os arquivos `.dbc` do SIH/SUS diretamente via FTP do DATASUS (a biblioteca `pysus` se mostrou incompleta para esse recorte), filtra as internações em UTI e converte tudo para `.parquet`;
- `Baixar_CNES.py` extrai, via API (`pysus`), o cadastro de estabelecimentos e leitos;
- `Baixar_Populacao_IBGE.py` traz a população municipal do IBGE/SIDRA, replicando o censo de 2022 para 2023 (o IBGE não publicou estimativa oficial para esse ano, e a ausência quebraria a série temporal).

**Etapa 2 — Orquestração do Pipeline.**
O Apache Airflow organiza essas extrações em uma DAG com quatro fases fixas — **ingestão, transformação, validação e carga analítica** — garantindo que o dado só avance para o banco depois de passar por checagens de qualidade.

**Etapa 3 — Convergência no Oracle Database.**
O script `Montar_Dataset_Unificado.py` junta as três fontes em um **modelo estrela (star schema)**, com a tabela fato "Perfil de Paciente" na granularidade de internação individual em UTI. É aqui que o CLARITI cumpre o requisito de *Single Source of Truth*: os formatos relacional, JSON e CSV deixam de existir separados e passam a conversar entre si dentro do Oracle Autonomous AI Database. Nesta etapa também é feito o enriquecimento semântico (`COMMENT ON TABLE` / `COMMENT ON COLUMN`), essencial para a próxima fase funcionar bem.

**Etapa 4 — Inteligência (em paralelo).**
A partir do dado convergido, dois caminhos rodam lado a lado:
- **Select AI** traduz a pergunta em português do gestor em SQL executável, sem que ele precise conhecer a estrutura das tabelas — isso só funciona bem *porque* a Etapa 3 documentou tudo em linguagem de negócio;
- **ML + Georreferenciamento** analisa o histórico para prever saturação hospitalar, agrupar regiões por perfil de risco e sinalizar reinternações em até 30 dias — o indicador que mede, na prática, o fracasso ou sucesso da atenção primária.

**Etapa 5 — Painel Executivo e Decisão.**
Os resultados das duas frentes chegam ao painel (Oracle APEX / dashboard), que traduz tudo em KPIs de custo, ociosidade e produtividade, além de mapas de pressão. É esse painel que o gestor usa para decidir **onde** e **quando** mover orçamento — fechando o ciclo entre dado bruto e ação de gestão.

---

## 3. 🏗️ Stack Tecnológico

- **Cloud & Banco de Dados:** Oracle Autonomous AI Database (compatível com as versões 23ai e 26 AI), provisionado na Oracle Cloud Infrastructure (OCI)
- **Acesso e Conexão:** Oracle SQL Developer configurado via *Cloud Wallet* (`.zip`)
- **Orquestração de Pipeline:** Apache Airflow (arquitetura Lambda/Kappa)
- **Engenharia em Python:** extração, limpeza (AED) e consolidação da base em `.parquet`
- **IA Generativa:** Oracle Select AI, gerando SQL a partir de linguagem natural
- **Visualização:** Oracle APEX / Dashboard

---

## 4. 📊 Engenharia de Dados: Fontes e Decisões Técnicas

A plataforma implementa o conceito de *Single Source of Truth* ao unificar formatos distintos em um Dataset Unificado para o estado de São Paulo (2022–2024).

| Fonte de Dados | Formato | Papel no Projeto e Decisão de Ingestão |
| :--- | :--- | :--- |
| **SIH/SUS** | Estruturado (`.dbc`) | Dados de internações em UTI, valores pagos e permanência média. **Decisão técnica:** a extração foi feita via FTP direto do DATASUS, pois o catálogo da biblioteca `pysus` apresentou inconsistências (incompleto) para o SIH no recorte avaliado. |
| **CNES** | Semiestruturado (`JSON` via API) | Cadastro de estabelecimentos e infraestrutura (leitos SUS/não-SUS), obtido com sucesso via biblioteca `pysus`. |
| **IBGE (SIDRA)** | Auxiliar (`CSV`/API) | População municipal, usada para cálculos de taxa (por 10 mil habitantes). **Decisão técnica:** como o IBGE não publicou estimativas para 2022/2023, o censo de 2022 foi replicado para 2023, evitando lacunas na série temporal. |

---

## 5. 🧠 Modelagem, Privacidade (LGPD) e Perfil do Paciente

O modelo relacional foi desenhado respeitando a granularidade de **internação individual em UTI** (mais de 800 mil registros) na tabela fato "Perfil de Paciente".

### 🛡️ Privacidade (LGPD) e o sinal de reinternação em 30 dias

Um dos diferenciais preditivos do CLARITI é o indicador `FL_REINTERNACAO_30D`, que sinaliza o fracasso da atenção primária quando um paciente retorna ao hospital em menos de 30 dias.

- Como a base do SIH/SUS não traz CPF, para agrupar internações do mesmo paciente **sem violar a LGPD**, foi gerada uma chave temporária ("impressão digital") cruzando *Data de Nascimento + Sexo + CEP*.
- Essa chave foi usada **apenas** para o agrupamento estatístico e **descartada** do banco final — o dataset persiste apenas resultados agregados e não identificáveis (abordagem *Zero-Trust Data*).

---

## 6. 💬 Select AI: Autonomia para o Gestor

O CLARITI dá autonomia total aos gestores de saúde, permitindo explorar a base sem qualquer conhecimento em SQL. Para que o Select AI responda com precisão, toda a estrutura DDL foi enriquecida com `COMMENT ON TABLE` e `COMMENT ON COLUMN`, traduzindo nomes técnicos em contexto gerencial.

**Exemplos de pergunta que o painel responde:**
- *"Quais municípios estão com maior pressão assistencial?"*
- *"Quais hospitais apresentam maior permanência média?"*
- *"Compare internações e leitos disponíveis por região de saúde."*

---

## 7. 📈 Indicadores de Desempenho e Saúde Orçamentária (KPIs)

O painel reflete cruzamentos cruciais para detectar ineficiência hospitalar:

1. **Custo médio por AIH ajustado por severidade** — compara o custo da unidade com a média regional, detectando desvios operacionais.
2. **Índice de ociosidade e custo de leito inativo** — relaciona leitos cadastrados (CNES) com dias reais de ocupação (SIH) para calcular o custo de estruturas improdutivas.
3. **Produtividade financeira por equipamento crítico** — cruza equipamentos (tomógrafos, ressonâncias) com faturamento no SIH, evitando pagamentos por manutenção de maquinário inativo.

---

## 8. ⚖️ Governança, Segurança e COBIT 2019

Adotando o **Oracle Ethics Shield (OES)**, o projeto trata governança de forma nativa, alinhado ao COBIT 2019:

- **APO12 (Risco):** mitigação de vieses nos modelos de IA de alocação de recursos.
- **DSS05 (Segurança):** criptografia avançada e controles baseados em política *Zero-Trust*.
- **MEA01 (Desempenho):** dashboards de conformidade e rastreabilidade para auditoria ética da IA.

---

## 9. 📁 Estrutura do Repositório

```text
/
├── assets/                          # Evidências, prints de execução, logs de conexão e DAG do Airflow
├── data/                            # Dicionário de dados documentando a consolidação das fontes
├── notebooks/                       # Scripts em Python de engenharia e AED
│   ├── Agregar_SIH_UTI.py           # Converte .dbc do FTP, filtra UTI e gera fato em parquet
│   ├── Baixar_CNES.py               # Extrai infraestrutura via API pysus
│   ├── Baixar_Populacao_IBGE.py     # Trata lacunas de estimativa do censo
│   └── Montar_Dataset_Unificado.py  # Merge do modelo estrela (Star Schema)
├── sql/                             # Scripts DDL, DML validados, inserções e metadados semânticos (COMMENTS)
├── docs/                            # Relatórios exigidos nas Sprints
│   └── evidencias-sprint3-rm9999.pdf # PDF de documentação técnica exigido pelos mentores
└── README.md                        # Este arquivo
```

---

## 10. 👥 Equipe
Filipe Santos de Oliveira | <a href="https://github.com/Pruppety" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="25" ></a>

Giovanni Pascon Corrêa | <a href="https://github.com/gigio-jpeg" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="25"></a> 

Nicolas Fois Lima | <a href="https://github.com/nifois11" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="25"></a> 

Vitor Matias do Nascimento | <a href="https://github.com/Data-Vitor" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="25"></a>

Yasmin Yumi Tsunokawa RM569408 | <a href="https://github.com/yasminyumit" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="25"></a>

