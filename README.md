# CLARITI — Inteligência Orçamentária para a Saúde Pública

> **Enterprise Challenge Oracle + FIAP | Curso de Data Science / Tecnologia em Artificial Intelligence, Analytics, Cloud & Data Platforms**

## 1. Sobre o Challenge

O **Enterprise Challenge** é uma atividade extensionista da FIAP que simula uma experiência profissional real, permitindo que os alunos apliquem técnicas, ferramentas, metodologias e boas práticas trabalhadas ao longo do curso para resolver problemas reais e gerar impacto para a sociedade. No Challenge de 2026, a empresa parceira é a **Oracle**, que propõe um desafio hands on relacionado à ciência de dados, engenharia de dados, analytics e tomada de decisão orientada por dados.

O desafio oficial apresentado pela Oracle e pela FIAP é o desenvolvimento de um **“Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento”**, construído a partir de dados do SUS/DATASUS para compreender internações, pressão regional e capacidade hospitalar. A solução deve transformar grandes volumes de dados em informações visuais, acessíveis e acionáveis, reduzindo a dependência de análises manuais realizadas exclusivamente por profissionais especializados em SQL.

## 2. Definição oficial do desafio

### O problema

Secretarias de Saúde e redes hospitalares precisam acompanhar rapidamente a demanda por atendimento, a capacidade hospitalar e o comportamento das internações. Entretanto, no cenário proposto pelo Challenge, informações importantes ficam distribuídas em diferentes fontes e formatos e, atualmente, sua exploração depende fortemente de consultas técnicas e do trabalho de analistas SQL.

Esse processo dificulta a resposta rápida a perguntas estratégicas como:

- Quais regiões apresentam crescimento no número de internações?
- Quais perfis de atendimento estão pressionando mais o sistema de saúde?
- Onde a capacidade hospitalar está sendo ultrapassada?
- Quais municípios e hospitais apresentam maior pressão assistencial?
- Quais tipos de atendimento estão crescendo com maior intensidade?

O Challenge orienta os grupos a transformar esse cenário em uma solução analítica com forte capacidade de comunicação e apoio à decisão.

### A pergunta central do negócio

> **Como transformar dados fragmentados do sistema de saúde em informações confiáveis, acessíveis e acionáveis para que gestores consigam identificar rapidamente pressão assistencial, crescimento da demanda e necessidade de intervenção na rede hospitalar?**

## 3. Fontes de dados exigidas pelo cenário

A proposta oficial considera três fontes principais:

| Fonte | Formato | Papel no projeto |
|---|---|---|
| **SIH/SUS** | Relacional / estruturado | Internações, valores pagos, permanência média, município e período |
| **CNES** | JSON via API | Hospitais, leitos, UBS, tipologias, contatos e atributos dos estabelecimentos |
| **Dados auxiliares** | CSV / External Table | População municipal, região de saúde, metas e classificações |

O uso combinado dessas fontes permite cruzar demanda, estrutura disponível e contexto territorial para construir indicadores de pressão e capacidade.

## 4. Objetivos analíticos do Challenge

A solução deve evoluir de uma exploração inicial dos dados para uma análise capaz de:

1. Identificar sazonalidades por período e região.
2. Construir rankings e comparações entre municípios e hospitais.
3. Relacionar volume de internações, permanência média e estrutura hospitalar.
4. Identificar regiões e unidades com maior pressão assistencial.
5. Investigar padrões, agrupamentos e perfis de maior criticidade.
6. Explicar os resultados em linguagem de negócio.
7. Utilizar **Select AI** para permitir perguntas em linguagem natural e aproximar gestores da análise dos dados.

## 5. A proposta CLARITI

### O que é a CLARITI?

A **CLARITI** é a proposta de solução do grupo para transformar o painel hospitalar solicitado pelo Challenge em uma plataforma de **inteligência financeira e operacional para a gestão da saúde pública**.

A solução parte do problema de acesso e interpretação dos dados hospitalares e amplia seu valor para a tomada de decisão: em vez de apenas mostrar o que aconteceu, a CLARITI organiza os dados para ajudar o gestor a entender **onde está a pressão, quais fatores contribuem para ela e onde os recursos podem ser priorizados**.

### Proposta de valor

> **CLARITI transforma dados fragmentados do SUS em inteligência de gestão, conectando demanda hospitalar, capacidade da rede, contexto territorial e informação financeira em uma visão única para apoiar decisões mais rápidas e preventivas.**

## 6. Como a CLARITI responde ao desafio

### 6.1 Convergência — Single Source of Truth

O Challenge trabalha com diferentes formatos de dados. A CLARITI propõe centralizar essas informações em uma arquitetura de dados convergente, permitindo que dados estruturados, semiestruturados e arquivos CSV sejam relacionados em um ambiente único.

A ideia é criar uma **Single Source of Truth**, na qual os dados necessários para os indicadores do painel possam ser consultados de forma consistente.

Na prática:

**SIH/SUS + CNES/JSON + CSV de população/região + dados financeiros → Oracle Database → modelo analítico único → indicadores e insights.**

Essa convergência permite reduzir a fragmentação dos dados e facilitar os cruzamentos necessários para analisar pressão assistencial, capacidade, território e utilização de recursos.

### 6.2 Autonomia — Select AI

Um dos principais diferenciais solicitados pelo Challenge é o uso do **Select AI** para consultas em linguagem natural. O ambiente utiliza os metadados do banco para gerar e executar SQL a partir de perguntas simples em português.

Na CLARITI, essa funcionalidade transforma o gestor em usuário ativo da informação. Em vez de depender exclusivamente de filtros técnicos ou de solicitar uma nova consulta ao time de dados, o gestor pode formular perguntas de negócio, por exemplo:

> “Quais municípios tiveram maior crescimento de internações nos últimos meses?”

> “Quais hospitais apresentam maior permanência média?”

> “Onde existe maior pressão assistencial em relação à população?”

> “Quais regiões apresentam maior crescimento de demanda e maior necessidade de recursos?”

O Select AI não elimina a importância da modelagem, da qualidade dos dados ou da análise realizada pela equipe. Ele funciona como uma camada de acesso que reduz a barreira técnica entre o gestor e o banco de dados.

### 6.3 Prevenção — Analytics, ML e georreferenciamento

Como evolução da proposta oficial do Challenge, a CLARITI busca sair de uma visão predominantemente descritiva e avançar para uma visão preventiva.

A solução pode combinar:

- indicadores históricos de internações;
- permanência média;
- capacidade e estrutura hospitalar;
- população municipal;
- distribuição territorial da demanda;
- evolução temporal dos atendimentos;
- modelos de Machine Learning para identificar padrões e tendências.

Com o **georreferenciamento**, o gestor consegue visualizar onde a pressão está concentrada e comparar regiões. Com a camada analítica e preditiva, a CLARITI busca identificar sinais de deterioração antes que uma situação crítica esteja consolidada.

O objetivo não é substituir a decisão do gestor, mas fornecer **evidências para antecipar cenários, priorizar ações e melhorar a alocação de recursos**.

## 7. Quem utiliza a CLARITI?

### Público-alvo principal

- Secretarias Municipais de Saúde.
- Gestores de redes hospitalares.
- Gestores responsáveis por orçamento e planejamento da saúde.
- Áreas de planejamento e regulação assistencial.

### Usuário principal

O usuário central é o **gestor de saúde**, especialmente aquele responsável por acompanhar demanda, capacidade da rede e utilização de recursos e precisa transformar dados em decisões sem depender constantemente de uma equipe técnica para cada pergunta.

## 8. O que a CLARITI entrega

A solução é estruturada em três grandes camadas de valor:

### 1. Visão

Painel com indicadores, rankings, mapas e comparações para mostrar:

- volume de internações;
- evolução da demanda;
- permanência média;
- pressão assistencial;
- capacidade da rede;
- distribuição territorial;
- perfis de atendimento.

### 2. Pergunta

Interface de linguagem natural apoiada pelo Select AI, permitindo ao gestor consultar o banco utilizando perguntas de negócio em português.

### 3. Prevenção

Camada analítica que utiliza histórico, contexto territorial e modelos de análise/predição para destacar regiões ou unidades que demandam atenção e apoiar decisões de priorização.

## 9. Fluxo conceitual da solução

```text
                 FONTES DE DADOS
        ┌────────────┬─────────────┬─────────────┐
        │            │             │             │
     SIH/SUS       CNES          CSV       Outras fontes
   internações   hospitais    população        públicas
        │            │             │             │
        └────────────┴──────┬──────┴─────────────┘
                            │
                            ▼
                 INGESTÃO + HARMONIZAÇÃO
                            │
                            ▼
                ORACLE DATABASE / CLARITI
                  Single Source of Truth
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          SQL/BI         Select AI      Analytics/ML
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                  PAINEL INTELIGENTE
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
       KPIs /             Mapas /         Alertas /
      Rankings          Geográficos       Tendências
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                    DECISÃO DO GESTOR
                            │
                            ▼
               PRIORIZAÇÃO DE RECURSOS
```

## 10. Relação direta entre desafio e solução

| Necessidade do Challenge | Resposta da CLARITI |
|---|---|
| Integrar SIH/SUS, CNES e CSV | Arquitetura convergente e repositório único |
| Entender crescimento das internações | Séries temporais, indicadores e rankings |
| Identificar pressão assistencial | Cruzamento de demanda, permanência, capacidade e população |
| Localizar regiões críticas | Mapas e georreferenciamento |
| Reduzir dependência de SQL manual | Select AI em linguagem natural |
| Apoiar decisões de gestão | Dashboard com insights acionáveis |
| Evoluir de análise descritiva para preventiva | Analytics + Machine Learning |
| Considerar ética, segurança e governança | Camada de governança, controles de acesso, auditoria e conformidade |

## 11. Diferencial da CLARITI

O Challenge oficial concentra-se na criação de um painel inteligente capaz de transformar dados do SUS em insights para acesso hospitalar, perfil de atendimento, pressão regional e capacidade hospitalar.

A CLARITI mantém esse núcleo obrigatório e adiciona uma camada de **inteligência orçamentária e prevenção**.

### O diferencial pode ser resumido em:

**Painel → Pergunta → Diagnóstico → Previsão → Priorização**

Isso posiciona a solução não apenas como uma ferramenta de visualização, mas como uma plataforma de apoio à decisão.

## 12. Governança, ética e segurança

A documentação do Challenge para Sprint 3 também exige atenção a ética, governança e segurança, incluindo análise de vieses, LGPD, segurança da informação e auditoria. A proposta apresentada nas regras relaciona essas preocupações ao Oracle Ethics Shield (OES) e ao COBIT 2019.

Na CLARITI, essas preocupações devem estar presentes desde a arquitetura até a apresentação dos insights:

- controle de acesso aos dados;
- proteção das informações sensíveis;
- rastreabilidade das consultas e decisões;
- monitoramento de vieses em análises e modelos;
- explicabilidade dos indicadores e resultados;
- conformidade com princípios da LGPD.

A governança não deve ser tratada apenas como uma etapa documental: ela deve fazer parte do ciclo completo dos dados.

## 13. Arquitetura e tecnologias

A arquitetura da CLARITI é pensada para suportar o cenário do Challenge e suas diferentes fontes de dados.

### Componentes principais

| Componente | Função |
|---|---|
| **Oracle Database** | Repositório central e camada de dados analítica |
| **Oracle Cloud / OCI** | Infraestrutura e serviços de banco na nuvem |
| **SQL Developer** | Desenvolvimento, modelagem e consultas |
| **Select AI** | Interface de perguntas em linguagem natural |
| **Python** | Tratamento, automação e componentes analíticos |
| **Airflow** | Orquestração do pipeline, quando aplicável |
| **Dashboard / BI** | Visualização dos indicadores e insights |
| **Machine Learning** | Identificação de padrões e tendências |
| **Georreferenciamento** | Análise espacial da pressão e demanda |

> **Observação importante sobre a versão do Oracle:** as regras oficiais consultadas do Challenge mencionam Oracle Database 26 AI / Autonomous AI Database no ambiente educacional. A proposta CLARITI apresentada pelo grupo utiliza o termo **Oracle Database 23ai**. Portanto, a versão efetivamente utilizada na implementação deve ser registrada de forma consistente com o ambiente fornecido e com a infraestrutura final do projeto.

## 14. Aderência aos critérios de avaliação

As regras do Challenge indicam cinco pontos centrais de avaliação: clareza na definição do problema, uso correto dos diferentes formatos de dados, valor para decisão, storytelling e utilidade das perguntas realizadas com Select AI.

A CLARITI atende esses critérios da seguinte maneira:

### Clareza do problema

Define uma pergunta objetiva: como transformar dados fragmentados de saúde em inteligência para identificar pressão, demanda e necessidade de intervenção.

### Uso dos formatos

Utiliza os dados estruturados do SIH/SUS, o CNES em JSON e dados auxiliares em CSV, preservando o propósito de cada fonte.

### Valor para decisão

Conecta indicadores de demanda e capacidade a priorização territorial e, na proposta expandida, à inteligência orçamentária.

### Storytelling

Organiza a experiência em uma narrativa simples: **o que está acontecendo → onde está acontecendo → por que importa → o que pode acontecer → onde agir**.

### Select AI

Permite perguntas de negócio em português, diretamente conectadas aos indicadores e às decisões estratégicas do gestor.

## 15. MVP da CLARITI

Para manter o escopo viável e alinhado ao Challenge, o MVP deve priorizar as funcionalidades essenciais:

### Módulo 1 — Dashboard Executivo

- KPIs de internações;
- evolução temporal;
- ranking de municípios/hospitais;
- permanência média;
- pressão assistencial;
- mapa regional.

### Módulo 2 — Pergunte ao Banco

Campo de linguagem natural utilizando Select AI para consultas estratégicas.

### Módulo 3 — Análise de Pressão

Indicadores que relacionam demanda e capacidade para destacar regiões e unidades críticas.

### Módulo 4 — Camada Preventiva

Primeiros modelos ou regras analíticas para destacar tendências e possíveis cenários críticos.

## 16. Métricas de sucesso

A efetividade da CLARITI pode ser acompanhada por métricas como:

- redução do tempo necessário para obter uma resposta de negócio;
- quantidade de perguntas respondidas sem consulta SQL manual;
- identificação de regiões críticas;
- precisão/qualidade das análises preditivas, quando aplicadas;
- cobertura de municípios e unidades analisadas;
- consistência dos dados integrados;
- tempo entre identificação de um risco e ação de gestão;
- potencial de otimização da alocação de recursos.

## 17. Resultado esperado

Ao final, a CLARITI deve demonstrar que é possível transformar dados públicos do SUS em uma experiência de decisão mais rápida, acessível e orientada por evidências.

O resultado esperado é um gestor capaz de responder, em poucos passos:

> **Onde está o problema?**
>
> **O que está causando a pressão?**
>
> **Como essa situação está evoluindo?**
>
> **Onde o risco está aumentando?**
>
> **Qual região ou unidade deve receber atenção prioritária?**

## 18. Resumo executivo

> **CLARITI é uma plataforma de inteligência para gestão da saúde pública que converte dados fragmentados do SUS em informações acionáveis. Por meio da convergência de dados, do Select AI, de análises territoriais e de recursos de Analytics e Machine Learning, a solução aproxima o gestor da informação e cria uma base para decisões mais rápidas e preventivas. Assim, a proposta mantém o objetivo central do Challenge Oracle/FIAP — o Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento — e o amplia para uma visão integrada de pressão assistencial, planejamento e priorização de recursos.**

## 19. Referência do Challenge

Este README foi estruturado com base no documento oficial **Regras Gerais Challenge Oracle – Fevereiro 2026**, que descreve o Enterprise Challenge da FIAP, o desafio proposto pela Oracle, as fontes de dados, os objetivos analíticos, o uso do Select AI e os critérios de avaliação.

---

### Status do projeto

**Projeto:** CLARITI  
**Challenge:** Enterprise Challenge Oracle + FIAP 2026  
**Tema oficial:** Painel Inteligente de Acesso Hospitalar e Perfil de Atendimento  
**Área:** Data Science / Analytics / Engenharia de Dados / Inteligência Artificial  
**Objetivo:** transformar dados do SUS em inteligência para decisão na gestão da saúde pública.
