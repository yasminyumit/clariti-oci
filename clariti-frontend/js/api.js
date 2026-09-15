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
  REINTERNACAO_ENDPOINT: "https://g2fbcde454b473d-bx7cjasthbglzaq5.adb.sa-saopaulo-1.oraclecloudapps.com/ords/clariti_dev",

  // TODO: preencher com o endpoint do módulo PL/SQL do Select AI, ex.:
  // "https://<host>/ords/<schema>/clariti/chat/"
 SELECT_AI_ENDPOINT: "https://g2fbcde454b473d-bx7cjasthbglzaq5.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/clariti/chat/",
}

/** Helper genérico de fetch com tratamento de erro consistente e retry transitório. */
async function claritiFetch(url, options = {}, { retries = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, options);
      const body = await res.text();
      const isOra20050 = body.includes("ORA-20050");

      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}`);
        error.isTransient = isOra20050 || res.status === 408 || res.status === 429 || res.status >= 500;
        throw error;
      }

      return body ? JSON.parse(body) : null;
    } catch (err) {
      lastError = err;
      const isNetworkError = !(err instanceof Error && /^HTTP \d+$/.test(err.message));
      if ((!err.isTransient && !isNetworkError) || attempt === retries) break;
    }
  }

  console.error("Falha ao consultar API CLARITI:", url, lastError);
  throw lastError;
}

function getItems(resposta) {
  if (Array.isArray(resposta)) return resposta;
  return resposta?.items || resposta?.data || [];
}

function statusK5Display(status) {
  return status === "SUPRIMIDO_K5" ? "Suprimido pela política de publicação" : status ?? null;
}

function normalizeRiscoMunicipal(item) {
  const statusPrioritario = item.STATUS_PRIORITARIO ?? item.status_prioritario;
  const statusElevadoOuPrioritario = item.STATUS_ELEVADO_OU_PRIORITARIO ?? item.status_elevado_ou_prioritario;
  const prioritarioSuprimido = statusPrioritario === "SUPRIMIDO_K5";
  const elevadoOuPrioritarioSuprimido = statusElevadoOuPrioritario === "SUPRIMIDO_K5";

  return {
    ...item,
    municipioCodigo: item.CD_MUNICIPIO_RES ?? item.cd_municipio_res,
    municipio: item.NM_MUNICIPIO ?? item.nm_municipio,
    riscoMedioPct: item.RISCO_MEDIO_PCT ?? item.risco_medio_pct,
    internacoesAvaliadas: item.QT_INTERNACOES_AVALIADAS ?? item.qt_internacoes_avaliadas,
    prioritarioSuprimido,
    elevadoOuPrioritarioSuprimido,
    statusPrioritario,
    statusPrioritarioDisplay: statusK5Display(statusPrioritario),
    statusElevadoOuPrioritario,
    statusElevadoOuPrioritarioDisplay: statusK5Display(statusElevadoOuPrioritario),
    qtPrioritarioPublicada: prioritarioSuprimido ? null : (item.QT_PRIORITARIO_PUBLICADA ?? item.qt_prioritario_publicada),
    pcPrioritarioPublicada: prioritarioSuprimido ? null : (item.PC_PRIORITARIO_PUBLICADA ?? item.pc_prioritario_publicada),
    qtElevadoOuPrioritario: elevadoOuPrioritarioSuprimido ? null : (item.QT_ELEVADO_OU_PRIORITARIO ?? item.qt_elevado_ou_prioritario),
    pcElevadoOuPrioritario: elevadoOuPrioritarioSuprimido ? null : (item.PC_ELEVADO_OU_PRIORITARIO ?? item.pc_elevado_ou_prioritario),
  };
}

function normalizeRiscoFaixa(item) {
  return {
    ...item,
    faixaRisco: item.FAIXA_RISCO ?? item.faixa_risco,
    ordemFaixa: item.ORDEM_FAIXA ?? item.ordem_faixa,
    internacoesAvaliadas: item.QT_INTERNACOES_AVALIADAS ?? item.qt_internacoes_avaliadas,
    probabilidadeMedia: item.PROBABILIDADE_MEDIA ?? item.probabilidade_media,
  };
}

async function getRiscoMunicipal(ano) {
  if (CLARITI_CONFIG.MOCK_MODE) return [];

  const url = `${CLARITI_CONFIG.REINTERNACAO_ENDPOINT}/ml/risco-municipal/${encodeURIComponent(ano)}`;
  const resposta = await claritiFetch(url);
  return getItems(resposta).map(normalizeRiscoMunicipal);
}

async function getRiscoFaixas(ano, municipio) {
  if (CLARITI_CONFIG.MOCK_MODE) return [];

  const url = `${CLARITI_CONFIG.REINTERNACAO_ENDPOINT}/ml/risco-faixas/${encodeURIComponent(ano)}/${encodeURIComponent(municipio)}`;
  const resposta = await claritiFetch(url);
  return getItems(resposta).map(normalizeRiscoFaixa).sort((a, b) => (a.ordemFaixa ?? 0) - (b.ordemFaixa ?? 0));
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
const CONVERSATION_ID_KEY = "clariti_conversation_id";

function getConversationId() {
  return localStorage.getItem(CONVERSATION_ID_KEY); // pode ser null — e está tudo bem
}

function setConversationId(id) {
  localStorage.setItem(CONVERSATION_ID_KEY, id);
}

function resetConversationId() {
  localStorage.removeItem(CONVERSATION_ID_KEY);
}

async function askClaritiAI(pergunta) {
  const conversationId = getConversationId(); // null na primeira pergunta

  if (CLARITI_CONFIG.MOCK_MODE) {
    return Promise.resolve(
      "(modo mock) Endpoint do Select AI ainda não conectado — configure SELECT_AI_ENDPOINT em js/api.js. " +
      `Sua pergunta foi: "${pergunta}" (conversation_id: ${conversationId ?? "novo"})`
    );
  }

  const body = { prompt: pergunta };
  if (conversationId) body.conversation_id = conversationId; // só manda se já existir

  const data = await claritiFetch(CLARITI_CONFIG.SELECT_AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Sempre guarda o conversation_id que o Oracle devolveu — é ele que manda
  if (data.conversation_id) {
    setConversationId(data.conversation_id);
  }

  return {
    text: data.resposta ?? data.resposta_texto ?? data.message ?? "",
    chart: data.grafico ?? data.chart ?? data.visualizacao ?? await graficoParaPergunta(pergunta),
  };
}

async function graficoParaPergunta(pergunta) {
  const texto = String(pergunta).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  try {
    if (texto.includes("municip") && (texto.includes("icsap") || texto.includes("taxa"))) {
      const dados = await getPainelExecutivo(anoAtualSelecionado());
      return {
        title: "Municípios com maior taxa de ICSAP",
        type: "bar",
        data: dados.ranking_icsap,
      };
    }
    if (texto.includes("empenhado") || texto.includes("liquidado") || texto.includes("orcament")) {
      const dados = await getPainelExecutivo(anoAtualSelecionado());
      return {
        title: "Execução orçamentária",
        labels: ["Dotação", "Empenhado", "Liquidado", "Pago"],
        values: [dados.funil.dotacao, dados.funil.empenhado, dados.funil.liquidado, dados.funil.pago],
      };
    }
    if (texto.includes("diagnostico") || texto.includes("internac") || texto.includes("custo")) {
      const municipioCodigo = localStorage.getItem("clariti_municipio_6");
      if (!municipioCodigo) return null;
      const dados = await getPainelTatico(municipioCodigo, anoAtualSelecionado());
      return { title: "Diagnósticos do município", data: dados.diagnosticos };
    }
    if (texto.includes("clinico") || texto.includes("paciente") || texto.includes("perfil")) {
      const municipioCodigo = localStorage.getItem("clariti_municipio_6");
      const diagnostico = localStorage.getItem("clariti_diag_princ");
      if (!municipioCodigo || !diagnostico) return null;
      const dados = await getPainelClinico(municipioCodigo, anoAtualSelecionado(), "", diagnostico);
      return { title: "Perfil clínico", data: dados.grupo_csap };
    }
  } catch (error) {
    console.warn("Não foi possível preparar o gráfico contextual:", error);
  }
  return null;
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
