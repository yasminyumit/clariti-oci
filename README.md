# 🏥 CLARITI: Inteligência Orçamentária e Acesso Hospitalar na Saúde Pública

> **Enterprise Challenge: Oracle + FIAP — 2026**  
> **Curso:** Data Science, Analytics, Agents & AI
> **Turma:** 1TSCPF  
> **Grupo:** Seraph
> **Integrantes:**
> Filipe Santos de Oliveira | @Pruppety
> Giovanni Pascon Corrêa | @gigio-jpeg
> Nicolas Fois Lima | @nifois11
> Vitor Matias do Nascimento | @Data-Vitor 
> Yasmin Yumi Tsunokawa | @yasminyumit


---

## 🚀 1. Sobre o Projeto

O projeto **CLARITI** é uma plataforma de inteligência financeira e operacional desenvolvida para o **Enterprise Challenge Oracle + FIAP**.

A solução transforma dados fragmentados do **Sistema Único de Saúde (SUS)** em uma **fonte única da verdade (*Single Source of Truth*)**, hospedada na nuvem da Oracle, integrando informações relacionadas à:

- demanda hospitalar;
- capacidade instalada;
- contexto territorial;
- utilização de recursos;
- saúde orçamentária.

O objetivo principal da **CLARITI** é fornecer **consciência situacional ao gestor financeiro e de saúde pública**, superando análises puramente descritivas para apoiar:

- priorização de recursos;
- identificação de desperdícios;
- otimização da capacidade instalada;
- análise da demanda hospitalar;
- tomada de decisão baseada em dados;
- atuação preventiva sobre possíveis problemas na rede de saúde.

---

# 📊 2. Fontes de Dados Utilizadas

O ecossistema da **CLARITI** integra dados públicos e fidedignos extraídos do **DATASUS** e de ecossistemas abertos do **Ministério da Saúde**, organizados em três frentes principais.

### 🏥 Fonte 1 — SIH/SUS

**Tipo:** Estruturado

Os dados do **Sistema de Informações Hospitalares do SUS (SIH/SUS)** são utilizados para analisar informações relacionadas a:

- internações;
- valores pagos;
- permanência média;
- município;
- período;
- procedimentos hospitalares;
- Internações por Condições Sensíveis à Atenção Primária (ICSAP).

Os dados são tratados e preparados para integração com as demais fontes utilizadas pela solução.

---

### 🏨 Fonte 2 — CNES

**Tipo:** Semiestruturado — API/JSON

O **Cadastro Nacional de Estabelecimentos de Saúde (CNES)** fornece informações sobre a infraestrutura e capacidade instalada da rede de saúde.

Entre os dados utilizados estão:

- hospitais;
- estabelecimentos de saúde;
- leitos existentes;
- unidades básicas;
- tipologias;
- atributos dos estabelecimentos;
- equipamentos e capacidade instalada.

Essas informações permitem comparar a **estrutura disponível** com a **demanda efetivamente observada**.

---

### 🗺️ Fonte 3 — Dados Auxiliares

**Tipo:** CSV / External Table

São utilizados dados auxiliares relacionados ao contexto municipal e territorial.

Entre eles:

- população municipal;
- região de saúde;
- metas;
- classificações;
- informações complementares utilizadas na análise.

Esses dados podem ser disponibilizados diretamente no banco por meio de **External Tables**, permitindo sua utilização nas consultas analíticas sem a necessidade de replicação desnecessária.

---

# 🏗️ 3. Arquitetura e Stack Tecnológica

A arquitetura da **CLARITI** foi projetada para suportar integração de dados, processamento analítico, inteligência artificial e visualização executiva em um ambiente Oracle Cloud.

## ☁️ Banco de Dados Central

**Oracle Autonomous Database (ADB)** hospedado na **Oracle Cloud Infrastructure (OCI)**.

O banco atua como o núcleo da solução, concentrando os dados integrados e fornecendo uma base única para as análises e aplicações.

---

## 💻 Desenvolvimento e Carga

**Oracle SQL Developer**

Utilizado para:

- criação das tabelas relacionais;
- execução de DDL e DML;
- consultas SQL;
- validação dos dados;
- gerenciamento do banco;
- conexão com o ambiente OCI por meio do **Cloud Wallet**.

---

## 🔄 Orquestração e Pipeline

**Apache Airflow**

Responsável pela automação e orquestração do pipeline de dados.

O fluxo contempla:

```text
Ingestão
   ↓
Transformação
   ↓
Validação
   ↓
Carga Analítica
