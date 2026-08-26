# ⚙️ CLARITI — Resumo Técnico

## Banco de Dados
- Oracle Autonomous AI Database (23ai/26ai), na OCI, região `sa-saopaulo-1`
- Conexão via SQL Developer (Cloud Wallet)

## Modelo de Dados (3 tabelas)
| Tabela | Grão |
|---|---|
| `TB_MUNICIPIO` | Dimensão — 645 municípios de SP |
| `TB_PERFIL_PACIENTE_UTI` | Internação individual em UTI |
| `TB_PAINEL_MUNICIPIO_ANO` | Município × ano (1.935 linhas) |

PK/FK, `CHECK` constraints e `COMMENT ON TABLE/COLUMN` (documentação semântica para o Select AI).

## Fontes de Dados
- **SIH/SUS** (FTP) — internações em UTI
- **CNES** (API/JSON) — leitos e estabelecimentos
- **IBGE** — população municipal
- **SIOPS** — orçamento em saúde, defasado 1 ano (investimento de N-1 associado ao desfecho de N)

## Pipeline
Extração em Python → tratamento no KNIME → carga via SQL Developer, na ordem: `TB_MUNICIPIO` → `TB_PAINEL_MUNICIPIO_ANO` → `TB_PERFIL_PACIENTE_UTI`

## Consulta em Linguagem Natural
Select AI (`GENAI_PROFILE`) traduz pergunta em português → SQL, via fluxo `SHOWSQL` → `RUNSQL`

## Análise Estatística
- AED completa: missing, outliers, correlação, sazonalidade, geografia
- Teste de hipótese (Mann-Whitney) sobre a tese central do projeto → resultado aponta **confundimento por porte do município**, não efeito direto do investimento em saúde
