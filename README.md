# 🏥 CLARITI — Inteligência Orçamentária e Acesso Hospitalar para a Saúde Pública

> **Enterprise Challenge Oracle + FIAP 2026**

> **Curso:** Data Science, Analytics, Agents & AI

> **Equipe:** Seraph | **Turma:** 1TSCPF

🔗 **Site publicado:** [clariti-oci.vercel.app](https://clariti-oci.vercel.app/?_vercel_share=89KgaQen8FBq2zPjFQPVzA3vjIG02uR8)
> O link inclui um token de compartilhamento do Vercel (`_vercel_share=...`), que costuma ser temporário. Se parar de funcionar, gere um novo link de preview no painel do Vercel ou aponte para o domínio de produção sem o parâmetro.

---

## 📑 Índice

1. [Visão Geral da Solução](#1--visão-geral-da-solução)
2. [Achado Central e Rigor Metodológico](#2--achado-central-e-rigor-metodológico)
3. [Fluxo do Projeto (da Fonte de Dados à Decisão do Gestor)](#3--fluxo-do-projeto-da-fonte-de-dados-à-decisão-do-gestor)
4. [Stack Tecnológico](#4--stack-tecnológico)
5. [Engenharia de Dados: Fontes e Decisões Técnicas](#5--engenharia-de-dados-fontes-e-decisões-técnicas)
6. [Modelagem, Privacidade (LGPD) e Perfil do Paciente](#6--modelagem-privacidade-lgpd-e-perfil-do-paciente)
7. [Select AI: Autonomia para o Gestor](#7--select-ai-autonomia-para-o-gestor)
8. [Indicadores de Desempenho (KPIs)](#8--indicadores-de-desempenho-e-saúde-orçamentária-kpis)
9. [Governança, Segurança e COBIT 2019](#9--governança-segurança-e-cobit-2019)
10. [Estrutura do Repositório](#10--estrutura-do-repositório)
11. [Equipe](#11--equipe)

---

## 1. 🚀 Visão Geral da Solução

### O que é o CLARITI?

O **CLARITI** é uma plataforma que transforma dados públicos e fragmentados do SUS em **decisões concretas de orçamento** para a saúde pública. Ele nasce a partir do desafio oficial da Oracle — construir um Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento — e vai um passo além: em vez de só *mostrar* onde a rede hospitalar está sob pressão, o CLARITI ajuda o gestor a entender **onde e por que** investir, com o rigor estatístico pra não confundir correlação com causa (ver seção 2).

Na prática, o CLARITI substitui um fluxo hoje lento e manual — gestor pede um relatório → analista escreve SQL → relatório demora dias — por um fluxo direto: **gestor navega por um painel em três níveis de profundidade, ou pergunta em português direto pro banco.**

### Qual problema o CLARITI resolve?

Hoje, secretarias de saúde precisam responder perguntas como "onde as internações estão crescendo?" ou "o investimento em atenção primária está realmente evitando internações evitáveis?" **sem depender de um analista técnico disponível o tempo todo**. Isso atrasa decisões que, na saúde pública, custam caro — tanto em dinheiro quanto em vidas.

> **Tese que motivou o projeto:** municípios que investem mais em Atenção Primária à Saúde (APS) apresentam menos internações evitáveis (**ICSAP** — Condições Sensíveis à Atenção Primária). O CLARITI testou essa tese com dados reais — e o resultado tem uma nuance importante, detalhada na seção 2.

### O que a solução entrega

| Nível / Módulo | O que faz | Por que importa |
|---|---|---|
| **Dashboard Executivo** (nível 1) | KPIs estaduais, ranking de municípios por taxa de ICSAP, mapa interativo, funil orçamentário (dotação → empenhado → liquidado → pago), scatter investimento × ICSAP | Visão completa do estado sem cruzar relatórios manualmente |
| **Dashboard Tático** (nível 2) | Diagnósticos que mais pesam num município específico, sazonalidade mensal, mix de leitos | Mostra objetivamente onde a rede está mais sobrecarregada dentro do município escolhido |
| **Dashboard Clínico** (nível 3) | Perfil agregado por grupo CSAP, taxa de UTI, reinternação em 30 dias, por trás de um diagnóstico específico | Desce até o padrão clínico que está gerando a pressão vista nos níveis acima |
| **Pergunte ao Banco** (Select AI) | Gestor digita uma pergunta em português e recebe a resposta direto do banco | Elimina a espera por um analista SQL para cada nova dúvida |
| **Metodologia** | Documenta o sistema de Tiers de confiabilidade de cada indicador (seção 2) | Garante que nenhum número vire decisão sem o contexto certo |

### Para quem é o CLARITI?

Secretarias municipais e estaduais de saúde, gestores de redes hospitalares e áreas de planejamento orçamentário que precisam decidir, com evidência e rapidez, **onde investir primeiro**.

---

## 2. 🔬 Achado Central e Rigor Metodológico

A tese que abre este documento foi **testada estatisticamente contra os dados reais**, não apenas assumida como verdadeira.

**Resultado:** o teste de Mann-Whitney aplicado **não confirmou** essa relação de forma direta. O que os dados mostram é que o **porte do município atua como variável de confusão**: municípios maiores diluem custo fixo de infraestrutura e por isso tendem a ter investimento per capita menor — independentemente da eficiência real da rede de saúde ali. Ou seja, "menos investimento per capita" muitas vezes só significa "cidade grande", não "gestão pior".

Isso não é um resultado negativo do projeto — é exatamente o tipo de rigor que separa uma tese apresentada como fato de uma tese testada com honestidade. Por isso, no painel, essa relação **nunca aparece como card isolado de correlação**: ela é sempre exibida como gráfico de dispersão com o porte do município como terceira variável (tamanho da bolha), acompanhada da ressalva por escrito.

### Sistema de confiabilidade dos indicadores (Tiers)

Pra essa honestidade metodológica não depender de lembrar caso a caso, todo indicador do painel é classificado em um de três níveis, documentados na página **Metodologia** do sistema:

| Tier | Significado | Exemplo |
|---|---|---|
| **1 — Indicador direto** | Sem risco relevante de indução a erro; vira card ou gráfico simples sem nota extra | Taxa de internação por 1.000 habitantes |
| **2 — Precisa de framing contextual** | Número real, mas isolado induz conclusão errada; exige variável de contexto ou nota fixa | Investimento per capita × Taxa de ICSAP |
| **3 — Não vira gatilho automático** | Tem limitação metodológica conhecida; aparece só em leitura técnica, nunca como alerta automático | Reinternação em 30 dias (viés de sobrevivência — o paciente precisa sobreviver e receber alta pra "contar") |

O mesmo cuidado vale pro indicador `CHAVE_COLISAO_SUSPEITA`: como o SIH/SUS não tem ID único de paciente, essa chave (ver seção 6) é construída por combinação de campos e está sujeita a colisão. Não é um indicador de saúde — é um indicador de qualidade de dado, e por isso vive numa trilha de auditoria administrativa, não no painel público do gestor.

---

## 3. 🔄 Fluxo do Projeto (da Fonte de Dados à Decisão do Gestor)

Esta seção explica, passo a passo, o caminho que o dado percorre desde a base bruta do DATASUS até a decisão que chega ao gestor de saúde.

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
     │ ETAPA 4A — SELECT AI            │   │ ETAPA 4B — ANÁLISE ESTATÍSTICA     │
     │ Pergunta em português           │   │ Teste de Mann-Whitney, análise de │
     │ → SQL gerado automaticamente    │   │ confusão por porte do município   │
     └────────────────┬────────────────┘   └───────────────────┬────────────────┘
                       └───────────────┬───────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ETAPA 5 — API E PAINEL (ORDS + Frontend próprio)                         │
│ ORDS expõe o modelo estrela como REST  ·  HTML/CSS/JS + Chart.js/Leaflet │
│ 3 níveis de dashboard + mapa interativo + assistente em linguagem natural│
└───────────────────────────────────┬──────────────────────────────────────┘
                                     ▼
                          DEPLOY — Vercel (site estático)
                                     ▼
                       DECISÃO DO GESTOR DE SAÚDE
        (onde investir e por que — com a ressalva certa em cada número)
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
O script `Montar_Dataset_Unificado.py` junta as três fontes em um **modelo estrela (star schema)**, com a tabela fato "Perfil de Paciente" na granularidade de internação individual em UTI. É aqui que o CLARITI cumpre o requisito de *Single Source of Truth*: os formatos relacional, JSON e CSV deixam de existir separados e passam a conversar entre si dentro do Oracle Autonomous AI Database. Nesta etapa também é feito o enriquecimento semântico (`COMMENT ON TABLE` / `COMMENT ON COLUMN`), essencial pra próxima fase funcionar bem.

**Etapa 4 — Inteligência (em paralelo).**
A partir do dado convergido, dois caminhos rodam lado a lado:
- **Select AI** traduz a pergunta em português do gestor em SQL executável, sem que ele precise conhecer a estrutura das tabelas — isso só funciona bem *porque* a Etapa 3 documentou tudo em linguagem de negócio;
- **Análise estatística** aplica o teste de Mann-Whitney sobre investimento per capita × taxa de ICSAP e identifica o porte do município como variável de confusão (ver seção 2) — esse resultado é o que define como cada indicador pode (ou não pode) aparecer no painel.

**Etapa 5 — API e Painel.**
Diferente da tentativa inicial (montar o painel direto no Oracle APEX com o wizard "Create Page"), essa abordagem foi abandonada porque o wizard cria uma página inteira por vez, o tipo "Dashboard" só suporta layout fixo com gráficos limitados (sem funil, sem bubble chart), e a seleção de tabela é manual numa LOV — a IA do wizard não lia o nome da tabela em texto livre e caía em dado de amostra. A decisão foi expor o modelo estrela via **ORDS** (Oracle REST Data Services, Auto-REST nativo do ADB) e consumir isso num **frontend próprio** — HTML/CSS/JS vanilla, Chart.js pros gráficos e Leaflet/OpenStreetMap pro mapa interativo de municípios — com os três níveis de dashboard e o assistente Select AI como página dedicada.

**Etapa 6 — Deploy e Decisão.**
O frontend é publicado como site estático no **Vercel**. É esse painel que o gestor usa pra decidir onde e quando mover orçamento — fechando o ciclo entre dado bruto, teste estatístico e ação de gestão.

---

## 4. 🏗️ Stack Tecnológico

- **Cloud & Banco de Dados:** Oracle Autonomous AI Database (compatível com as versões 23ai e 26 AI), provisionado na Oracle Cloud Infrastructure (OCI), região `sa-saopaulo-1`
- **Acesso e Conexão:** Oracle SQL Developer configurado via *Cloud Wallet* (`.zip`)
- **Orquestração de Pipeline:** Apache Airflow (arquitetura Lambda/Kappa)
- **Engenharia em Python:** extração, limpeza (AED) e consolidação da base em `.parquet`
- **API:** ORDS (Oracle REST Data Services) — expõe o modelo estrela como REST pro frontend consumir
- **IA Generativa:** Oracle Select AI, modelo Cohere `command-a-03-2025` via OCI Generative AI, gerando SQL a partir de linguagem natural
- **Frontend:** HTML/CSS/JS vanilla, Chart.js (gráficos), Leaflet + OpenStreetMap (mapa interativo)
- **Deploy:** Vercel (site estático)

---

## 5. 📊 Engenharia de Dados: Fontes e Decisões Técnicas

A plataforma implementa o conceito de *Single Source of Truth* ao unificar formatos distintos em um Dataset Unificado para o estado de São Paulo (2022–2024).

| Fonte de Dados | Formato | Papel no Projeto e Decisão de Ingestão |
| :--- | :--- | :--- |
| **SIH/SUS** | Estruturado (`.dbc`) | Dados de internações em UTI, valores pagos e permanência média. **Decisão técnica:** a extração foi feita via FTP direto do DATASUS, pois o catálogo da biblioteca `pysus` apresentou inconsistências (incompleto) para o SIH no recorte avaliado. |
| **CNES** | Semiestruturado (`JSON` via API) | Cadastro de estabelecimentos e infraestrutura (leitos SUS/não-SUS), obtido com sucesso via biblioteca `pysus`. |
| **SIOPS** | Auxiliar (defasado 1 ano) | Execução orçamentária municipal (dotação, empenhado, liquidado, pago) — base do funil orçamentário do Dashboard Executivo. |
| **IBGE (SIDRA)** | Auxiliar (`CSV`/API) | População municipal, usada para cálculos de taxa (por 10 mil habitantes). **Decisão técnica:** como o IBGE não publicou estimativas para 2022/2023, o censo de 2022 foi replicado para 2023, evitando lacunas na série temporal. |

---

## 6. 🧠 Modelagem, Privacidade (LGPD) e Perfil do Paciente

O modelo relacional foi desenhado respeitando a granularidade de **internação individual em UTI** (mais de 800 mil registros) na tabela fato "Perfil de Paciente".

### 🛡️ Privacidade (LGPD) e o sinal de reinternação em 30 dias

Um dos indicadores mais sensíveis do CLARITI é `FL_REINTERNACAO_30D`, que sinaliza quando um paciente retorna ao hospital em menos de 30 dias (classificado como Tier 3 — ver seção 2, por conta do viés de sobrevivência).

- Como a base do SIH/SUS não traz CPF, para agrupar internações do mesmo paciente **sem violar a LGPD**, foi gerada uma chave temporária ("impressão digital") cruzando *Data de Nascimento + Sexo + CEP*.
- Essa chave foi usada **apenas** para o agrupamento estatístico e **descartada** do banco final — o dataset persiste apenas resultados agregados e não identificáveis (abordagem *Zero-Trust Data*).
- Essa mesma chave, por ser construída via combinação de campos (não um ID único real), está sujeita a colisão — por isso vive como indicador de qualidade de dado (`CHAVE_COLISAO_SUSPEITA`) numa trilha de auditoria administrativa, não no painel público do gestor.

---

## 7. 💬 Athena: agente de consulta governado (Select AI)

A Athena é o assistente do CLARITI. O gestor pergunta em português e recebe uma resposta produzida a partir dos dados governados no Oracle, sem precisar escrever SQL.

A diferença entre apenas ativar o Select AI e governá-lo está em três decisões:

**Enriquecimento semântico.** Os objetos disponibilizados ao Select AI possuem `COMMENT ON TABLE` e `COMMENT ON COLUMN`, traduzindo nomes técnicos para a linguagem de negócio. O perfil `CLARITI_SAFE_PROFILE` também restringe quais objetos podem ser consultados por meio de `enforce_object_list`.

**Vocabulário controlado de CID-10.** O CID-10 está integrado pela view enriquecida `CLARITI_DEV.VW_DIAG_MUN_ANO_K5` e pela Tool `CLARITI_DIAG_K5_TOOL`, conectada à função `CLARITI_DEV.FN_TOP_DIAG_GESTOR_K5`.

As tabelas de referência `TB_CID10_FONTE` e `TB_CID10_REFERENCIA` não ficam abertas para consulta livre pelo agente. O Oracle devolve código oficial, descrição e versão já governados. Assim, a Athena reproduz o dicionário CID-10 DATASUS V2008 armazenado no banco, em vez de completar diagnósticos pela memória do modelo de linguagem.

A carga contém 14.233 códigos únicos e cobre os 1.599 códigos utilizados pelo CLARITI. A view publicou 26.136 células município × ano × CID, sem descrição ausente e sem violação da política k=5.

**Continuidade de contexto.** Cada conversa recebe um `conversation_id`, criado por `DBMS_CLOUD_AI.CREATE_CONVERSATION()`. A aplicação deve guardar esse identificador durante a sessão e reutilizá-lo nas perguntas seguintes. O botão “Nova conversa” gera outro identificador.

O perfil utiliza o provider Cohere, o modelo `command-a-03-2025` e a credencial Oracle `COHERE_CRED`.

### Perguntas homologadas

| Pergunta | Resposta comprovada da Athena |
|---|---|
| “Quais foram os cinco diagnósticos principais mais frequentes nas internações UTI de Colina em 2024?” | A41.9 — Septicemia não especificada: 14 internações; N39.0 — Infecção do trato urinário de localização não especificada: 12; I21.9 — Infarto agudo do miocárdio não especificado: 11; I64 — Acidente vascular cerebral, não especificado como hemorrágico ou isquêmico: 10; J15.9 — Pneumonia bacteriana não especificada: 10. Todos retornados com a versão `CID-10 DATASUS V2008`. |
| “Qual foi o mês de pico histórico das internações UTI do grupo CSAP Asma?” | Agosto, com 608 internações. Janeiro teve a menor contagem, 190. O histórico contém 4.402 internações e média mensal de 366,83. A Athena esclarece que o padrão histórico não é uma previsão. |
| “O modelo consegue priorizar quando a capacidade é limitada?” | No grupo formado pelos 10% de maior escore, 45,7205% das internações apresentaram o desfecho no teste de 2024, contra 14,8483% no conjunto completo. Lift de 3,079179 em 248.507 internações avaliadas. |
| “Qual a taxa de reinternação para pessoas de 60 a 69 anos com insuficiência cardíaca em Altinópolis em 2023?” | O recorte municipal ficou abaixo da política k=5. A Athena não publicou o valor municipal e aplicou fallback para o polo de Ribeirão Preto: 226 internações, 30 reinternações e taxa de 13,27%, diante de 11,97% no estado. |

A Athena utiliza sete Tools governadas para separar consultas gerais, reinternação, diagnósticos, sazonalidade, priorização por ML, explicabilidade e alternativas gerenciais. As respostas preservam o recorte, a unidade analisada e os limites de interpretação.

---

## 8. 📈 Indicadores de Desempenho e Saúde Orçamentária (KPIs)

O painel reflete cruzamentos cruciais para detectar ineficiência hospitalar:

1. **Custo médio por AIH ajustado por severidade** — compara o custo da unidade com a média regional, detectando desvios operacionais.
2. **Índice de ociosidade e custo de leito inativo** — relaciona leitos cadastrados (CNES) com dias reais de ocupação (SIH) para calcular o custo de estruturas improdutivas.
3. **Produtividade financeira por equipamento crítico** — cruza equipamentos (tomógrafos, ressonâncias) com faturamento no SIH, evitando pagamentos por manutenção de maquinário inativo.

Todo indicador novo passa pelo sistema de Tiers da seção 2 antes de virar card no painel.

---

## 9. ⚖️ Governança, Segurança e COBIT 2019

Adotando o **Oracle Ethics Shield (OES)**, o projeto trata governança de forma nativa, alinhado ao COBIT 2019:

- **APO12 (Risco):** mitigação de vieses nos modelos de IA de alocação de recursos.
- **DSS05 (Segurança):** criptografia avançada e controles baseados em política *Zero-Trust*.
- **MEA01 (Desempenho):** dashboards de conformidade e rastreabilidade para auditoria ética da IA.

---

## 10. 📁 Estrutura do Repositório

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
├── clariti-frontend/                # Site publicado (clariti-oci.vercel.app)
│   ├── index.html                   # Página inicial
│   ├── executivo.html               # Nível 1 — Dashboard Executivo (KPIs, mapa, ranking, funil, scatter)
│   ├── tatico.html                  # Nível 2 — Dashboard Tático
│   ├── clinico.html                 # Nível 3 — Dashboard Clínico
│   ├── metodologia.html             # Tiers dos KPIs e ressalvas metodológicas
│   ├── chatbot.html                 # Assistente IA (Select AI)
│   ├── css/style.css
│   └── js/                          # api.js, nav.js, executivo.js, tatico.js, clinico.js, chatbot.js
├── docs/                            # Relatórios exigidos nas Sprints
│   └── evidencias-sprint3-rm9999.pdf # PDF de documentação técnica exigido pelos mentores
└── README.md                        # Este arquivo
```

---

## 11. 👥 Equipe
Filipe Santos de Oliveira | <a href="https://github.com/Pruppety" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="20" ></a>

Giovanni Pascon Corrêa | <a href="https://github.com/gigio-jpeg" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="20"></a>

Nicolas Fois Lima | <a href="https://github.com/nifois11" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="20"></a>

Vitor Matias do Nascimento | <a href="https://github.com/Data-Vitor" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="20"></a>

Yasmin Yumi Tsunokawa | <a href="https://github.com/yasminyumit" target="_blank"><img loading="lazy" src="https://github.com/devicons/devicon/blob/v2.17.0/icons/github/github-original.svg" target="_blank" width="20"></a>
