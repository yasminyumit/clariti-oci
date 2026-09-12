# Contexto do projeto CLARITI — documento de handoff para IA

Cole este documento inteiro no início de uma nova conversa com qualquer IA, e depois diga em qual etapa você está (ex.: "estou na etapa 4, ligando o drill-down"). A IA deve conseguir continuar o trabalho sem precisar reperguntar o básico do projeto.

---

## 1. O que é o CLARITI

Plataforma de analytics financeiro em saúde pública, construída sobre stack Oracle (Autonomous Database 23ai, ODI, OML, Spatial & Graph, Select AI, OAC). Projeto do Oracle+FIAP Challenge 2026, competindo contra o grupo acadêmico "Ora, Dados!".

Foco analítico central: **ICSAP** (internações sensíveis à atenção primária — hospitalizações evitáveis se a atenção primária funcionasse) e comparação de leitos hospitalares, voltado para CFOs e gestores de saúde pública.

Fontes de dados públicas usadas: SIH/SUS, CNES, SIOPS, FNS, IBGE.

Escopo do MVP: Select AI (exigência do challenge), modelagem preditiva não-linear, dashboard geoespacial para CFOs. Integração com farmácia/SISAB ficou fora do MVP (roadmap futuro).

## 2. Equipe

Pup (Filipe) está em papel de liderança/coordenação junto de mais um gestor, com três membros técnicos (G, V, N) responsáveis pela execução. Pup também executa entregáveis pessoalmente, coordenando seis frentes de trabalho. Projeto está em reta final, próximo da apresentação.

## 3. Schema de dados (3 tabelas, granularidades diferentes)

### `PERFIL_PACIENTE` — grão: internação individual
```
ID, MUNICIPIO_6, DIAG_PRINC, CSAP, GRUPO_CSAP_COD, GRUPO_CSAP_NOME, IDADE_FAIXA, SEXO,
ANO, MES, DIA_SEMANA, FIM_DE_SEMANA, FERIADO, VAL_TOT, DIAS_PERM, UTI_MES_TO,
REINTERNACAO_30D, QTD_INTERNACOES_PACIENTE_PERIODO, CHAVE_COLISAO_SUSPEITA
```

### `DATASET_UNIFICADO_SP_2022_2024` — grão: município × diagnóstico × mês
```
municipio_6, diag_princ, qtd_internacoes_uti, soma_val_tot, soma_dias_perm, soma_uti_mes_to,
ano, mes, uf_residencia, reside_fora_sp, qtd_estabelecimentos, qtd_leitos_existentes,
qtd_leitos_sus, qtd_leitos_contratados, qtd_leitos_nao_sus, populacao, nome_municipio
```

### `painel_municipio_ano` — grão: município × ano
```
municipio_6, ano, populacao, nome_municipio, qtd_internacoes_uti, qtd_internacoes_icsap_uti,
soma_val_tot, soma_dias_perm, qtd_estabelecimentos_media, qtd_leitos_existentes_media,
qtd_leitos_sus_media, siops_dotacao_atualizada, siops_despesa_empenhada,
siops_despesa_liquidada, siops_despesa_paga
```

**Atenção**: `GRUPO_CSAP_COD/NOME` só existe em `PERFIL_PACIENTE` — não está nas outras duas tabelas.

As três tabelas formam uma hierarquia natural de drill-down: `painel_municipio_ano` (estratégico) → `DATASET_UNIFICADO...` (tático) → `PERFIL_PACIENTE` (clínico).

## 4. Sistema de Tiers dos KPIs (usar sempre que adicionar um indicador novo)

- **Tier 1 — indicador direto**: sem risco relevante de indução a erro. Pode virar card/gráfico simples sem nota extra.
- **Tier 2 — precisa de framing contextual**: número real, mas isolado induz conclusão errada. Precisa vir com variável de contexto junto ou nota fixa.
- **Tier 3 — não vira gatilho automático**: tem problema metodológico conhecido (viés). Pode aparecer em relatório técnico, nunca como alerta automático.

### Ressalvas já identificadas e que devem ser preservadas em qualquer versão do painel:
- **Investimento per capita × Taxa de ICSAP** (Tier 2): confundido pelo porte do município (testado com Mann-Whitney) — nunca apresentar como card isolado de correlação simples. Sempre como scatter com bolha = população, com a nota: *"O tamanho do município (população) confunde essa relação — municípios maiores têm custo fixo de infraestrutura diluído e tendem a investimento per capita menor, independente da eficiência da rede."*
- **Reinternação em 30 dias** (Tier 3): viés de sobrevivência (paciente precisa sobreviver e receber alta pra "contar").
- **Funil orçamentário**: nota fixa — *"Queda entre 'Empenhado' e 'Liquidado' indica gargalo de execução, não falta de orçamento."*
- **`CHAVE_COLISAO_SUSPEITA`**: SIH/SUS não tem ID único de paciente; a chave é construída por combinação de campos e sujeita a colisão. Não é KPI de saúde — é indicador de qualidade de dados, cabe numa aba administrativa/governança (COBIT DSS05/MEA01), não no painel público do gestor.

## 5. Decisão de arquitetura (histórico — importante pra não repetir erro)

Tentativa inicial foi montar o painel no **Oracle APEX** usando o wizard "Create Page" com assistência de IA (Cohere via OCI Generative AI). Isso foi abandonado porque:
- O wizard cria **uma página inteira por vez**, nunca adiciona regions a uma página existente.
- O page type "Dashboard" só suporta layout fixo (2/4/6 charts) e tipos limitados (area/bar/line/pie) — sem funnel nem scatter/bubble nesse fluxo.
- A tabela de dados precisa ser selecionada manualmente numa LOV; a IA não lê o nome da tabela em texto livre, e por isso ele caía em dado de amostra.

**Decisão atual**: construir um frontend próprio (não-APEX), consumindo os dados via **ORDS** (Oracle REST Data Services, nativo do ADB), mantendo o Select AI como exigência do challenge através de um endpoint dedicado.

### Arquitetura escolhida
```
Frontend (páginas + botão "gerar dashboard" + chat)
        │  fetch/HTTP
        ▼
ORDS — expõe tabelas/views/PL-SQL como endpoints REST
        │
        ▼
Autonomous Database 23ai — painel_municipio_ano / DATASET_UNIFICADO / PERFIL_PACIENTE
        │
        ▼
Select AI (DBMS_CLOUD_AI, perfil Cohere via OCI Generative AI) — endpoint do chatbot
```

### Ferramentas decididas
| Camada | Ferramenta |
|---|---|
| Dados | Autonomous Database 23ai |
| API | ORDS (Auto-REST nas tabelas/views) |
| API do chatbot | Módulo PL/SQL + ORDS, chamando `DBMS_CLOUD_AI.GENERATE` (ação `chat` ou `narrate`) |
| IA do chatbot | Select AI, perfil apontando pro modelo Cohere via OCI Generative AI |
| Frontend | HTML/CSS/JS simples + Chart.js ou ECharts |
| Teste de API | Postman ou Insomnia |
| Hospedagem | OCI Object Storage (static website) ou Vercel/Netlify |
| Versionamento | Git/GitHub |

## 6. Páginas planejadas

1. **Home / Sobre o CLARITI** — abertura curta com o problema e navegação.
2. **Dashboard Executivo** (nível 1, `painel_municipio_ano`) — 5 cards de KPI, ranking de ICSAP por município (bar chart top 15), funil orçamentário (4 etapas: dotação → empenhado → liquidado → pago), scatter investimento per capita × ICSAP (bolha = população). Botão "Gerar dashboard", filtro de ano.
3. **Dashboard Tático** (nível 2, `DATASET_UNIFICADO_SP_2022_2024`) — acessado via clique num município da página 2.
4. **Dashboard Clínico** (nível 3, `PERFIL_PACIENTE`) — acessado via clique num diagnóstico da página tática.
5. **Chatbot** — página própria ou widget flutuante, consumindo o endpoint Select AI.
6. **Metodologia / Governança** — documenta os Tiers e as ressalvas da seção 4.

## 7. Etapas de construção (sequência)

1. Habilitar ORDS (Auto-REST) nas 3 tabelas/views e testar cada endpoint no Postman antes de tocar no frontend.
2. Criar o AI Profile do Select AI (`DBMS_CLOUD_AI.CREATE_PROFILE`, provider `oci`, modelo Cohere) e um módulo PL/SQL exposto via ORDS que recebe pergunta em texto e devolve resposta do `DBMS_CLOUD_AI.GENERATE`.
3. Montar o esqueleto HTML das páginas e a navegação entre elas.
4. Ligar a Página 1 (Executivo) ao endpoint ORDS de `painel_municipio_ano` — cards, ranking, funil, scatter.
5. Ligar o drill-down: clique num município guarda `municipio_6` (localStorage/querystring) e navega pra página tática já filtrada; mesma lógica pro nível clínico.
6. Ligar o chatbot ao endpoint do passo 2.
7. Construir a página de Metodologia com o conteúdo da seção 4 deste documento.
8. Deploy dos arquivos estáticos + configurar CORS no ORDS pro domínio do frontend + teste fim a fim em rede real (não só localhost).
9. Preparar plano B: prints/gravação de cada tela funcionando, caso a rede do local da apresentação bloqueie a chamada ao vivo pro ADB.

## 8. Como continuar a partir daqui

Ao retomar, diga:
- Em qual etapa da seção 7 você está.
- O que já foi feito e o que travou (erro específico, decisão pendente, etc.).
- Se algo mudou na arquitetura ou no schema desde este documento — atualize a IA antes de pedir ajuda, porque ela só sabe o que está escrito aqui.
