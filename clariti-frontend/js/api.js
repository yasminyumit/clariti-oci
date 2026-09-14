/**
 * CLARITI — configuração central de API
 *
 * Enquanto o ORDS não estiver publicado, MOCK_MODE = true faz cada página
 * renderizar com dados fictícios (função getMock* abaixo), pra dar pra
 * trabalhar no frontend sem depender do backend estar pronto.
 *
 * Quando o ORDS estiver disponível: preencha ORDS_BASE_URL e
 * SELECT_AI_ENDPOINT, e mude MOCK_MODE para false. Nenhuma outra parte do
 * frontend deveria precisar mudar — todas as páginas chamam só as funções
 * deste arquivo.
 */

const CLARITI_CONFIG = {
  MOCK_MODE: false,

  EXECUTIVO_ENDPOINT: "https://g2fbcde454b473d-bx7cjasthbglzaq5.adb.sa-saopaulo-1.oraclecloudapps.com/ords/rm572828/v1/kpi-executivo",
  TATICO_ENDPOINT: "https://g2fbcde454b473d-bx7cjasthbglzaq5.adb.sa-saopaulo-1.oraclecloudapps.com/ords/rm572828/v1/painel-tatico",
  CLINICO_ENDPOINT: "https://g2fbcde454b473d-bx7cjasthbglzaq5.adb.sa-saopaulo-1.oraclecloudapps.com/ords/rm572828/v1/painel-clinico",

  // TODO: preencher com o endpoint do módulo PL/SQL do Select AI, ex.:
  // "https://<host>/ords/<schema>/clariti/chat/"
  SELECT_AI_ENDPOINT: "",
};

/** Helper genérico de fetch com tratamento de erro consistente. */
async function claritiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Falha ao consultar API CLARITI:", url, err);
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Nível 1 — Executivo (painel_municipio_ano)                          */
/* ------------------------------------------------------------------ */

async function getPainelExecutivo(ano) {
  if (CLARITI_CONFIG.MOCK_MODE) return getMockExecutivo(ano);

  const url = `${CLARITI_CONFIG.EXECUTIVO_ENDPOINT}?ano=${encodeURIComponent(ano)}`;
  return claritiFetch(url);
}

function getMockExecutivo(ano) {
  return Promise.resolve({
    ano,
    kpis: {
      taxa_internacao: { valor: 7.42, delta_pct: -3.1 },
      pct_icsap: { valor: 28.6, delta_pct: 1.4 },
      custo_medio: { valor: 3184.5, delta_pct: 6.2 },
      permanencia_media: { valor: 4.8, delta_pct: -0.6 },
      leitos_sus_1000: { valor: 1.92, delta_pct: -1.8 },
    },
    ranking_icsap: [
      { municipio_6: "3541406", municipio: "Presidente Prudente", taxa: 41.2 },
      { municipio_6: "3529005", municipio: "Marília", taxa: 38.7 },
      { municipio_6: "3542602", municipio: "Registro", taxa: 36.9 },
      { municipio_6: "3507605", municipio: "Bragança Paulista", taxa: 34.1 },
      { municipio_6: "3522208", municipio: "Itapetininga", taxa: 33.5 },
      { municipio_6: "3504503", municipio: "Avaré", taxa: 31.8 },
      { municipio_6: "3507506", municipio: "Botucatu", taxa: 30.4 },
      { municipio_6: "3534904", municipio: "Ourinhos", taxa: 29.6 },
      { municipio_6: "3504602", municipio: "Assis", taxa: 28.9 },
      { municipio_6: "3525300", municipio: "Jaú", taxa: 27.5 },
    ],
    funil: {
      dotacao: 182_400_000,
      empenhado: 165_100_000,
      liquidado: 121_300_000,
      pago: 118_900_000,
    },
    scatter: [
      { municipio: "São Paulo", investimento_pc: 412.3, taxa_icsap: 19.2, populacao: 12300000 },
      { municipio: "Campinas", investimento_pc: 388.1, taxa_icsap: 21.5, populacao: 1223000 },
      { municipio: "Presidente Prudente", investimento_pc: 201.4, taxa_icsap: 41.2, populacao: 230000 },
      { municipio: "Marília", investimento_pc: 215.8, taxa_icsap: 38.7, populacao: 240000 },
      { municipio: "Registro", investimento_pc: 178.9, taxa_icsap: 36.9, populacao: 57000 },
      { municipio: "Bauru", investimento_pc: 295.0, taxa_icsap: 24.8, populacao: 385000 },
      { municipio: "Sorocaba", investimento_pc: 310.6, taxa_icsap: 23.1, populacao: 695000 },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Nível 2 — Tático (PERFIL_PACIENTE + painel_municipio_ano para leitos) */
/* ------------------------------------------------------------------ */

async function getPainelTatico(municipioCodigo, ano) {
  if (CLARITI_CONFIG.MOCK_MODE) return getMockTatico(municipioCodigo, ano);

  const params = new URLSearchParams({ municipio_6: municipioCodigo, ano });
  const url = `${CLARITI_CONFIG.TATICO_ENDPOINT}?${params}`;
  return claritiFetch(url);
}

function getMockTatico(municipioCodigo, ano) {
  return Promise.resolve({
    municipio: "Presidente Prudente",
    ano,
    diagnosticos: [
      { diag: "Pneumonia bacteriana", internacoes: 412, custo_medio: 2980 },
      { diag: "Insuficiência cardíaca", internacoes: 388, custo_medio: 4110 },
      { diag: "Diabetes com complicações", internacoes: 301, custo_medio: 3520 },
      { diag: "DPOC", internacoes: 276, custo_medio: 3050 },
      { diag: "ITU", internacoes: 190, custo_medio: 1870 },
    ],
    sazonalidade_mensal: [120, 108, 132, 145, 160, 175, 190, 182, 150, 138, 125, 118],
    mix_leitos: { sus: 420, contratados: 60, nao_sus: 35 },
  });
}

/* ------------------------------------------------------------------ */
/* Nível 3 — Clínico (PERFIL_PACIENTE)                                  */
/* ------------------------------------------------------------------ */

async function getPainelClinico(municipioCodigo, ano, mes, diagPrinc) {
  if (CLARITI_CONFIG.MOCK_MODE) return getMockClinico();

  const params = new URLSearchParams({ municipio_6: municipioCodigo, ano, diag_princ: diagPrinc });
  if (mes) params.set("mes", mes);
  const url = `${CLARITI_CONFIG.CLINICO_ENDPOINT}?${params}`;
  return claritiFetch(url);
}

function getMockClinico() {
  return Promise.resolve({
    grupo_csap: [
      { grupo: "Doenças cardiovasculares", casos: 210 },
      { grupo: "Doenças respiratórias", casos: 175 },
      { grupo: "Diabetes mellitus", casos: 140 },
      { grupo: "Infecções renais e do trato urinário", casos: 88 },
    ],
    taxa_uti_icsap: 12.4,
    reinternacao_30d: 8.1,
  });
}

/* ------------------------------------------------------------------ */
/* Select AI — chatbot                                                  */
/* ------------------------------------------------------------------ */

async function askClaritiAI(pergunta) {
  if (CLARITI_CONFIG.MOCK_MODE) {
    return Promise.resolve(
      "(modo mock) Endpoint do Select AI ainda não conectado — configure SELECT_AI_ENDPOINT em js/api.js. " +
      `Sua pergunta foi: "${pergunta}"`
    );
  }

  const data = await claritiFetch(CLARITI_CONFIG.SELECT_AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: pergunta }),
  });
  return data.resposta;
}

/* ------------------------------------------------------------------ */
/* Formatação pt-BR                                                     */
/* ------------------------------------------------------------------ */

function fmtNumero(valor, casas = 1) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function fmtMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDelta(pct) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) return "sem comparação";
  const sinal = pct >= 0 ? "+" : "";
  return `${sinal}${fmtNumero(pct, 1)}%`;
}
