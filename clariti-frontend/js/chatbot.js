function appendChatMessage(log, text, type) {
  const message = document.createElement("div");
  message.className = `chat-msg ${type}`;
  if (type === "bot") {
    renderBotText(message, text);
  } else {
    message.textContent = text;
  }
  log.appendChild(message);
  log.scrollTop = log.scrollHeight;
  return message;
}

function appendInlineBotText(container, text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  parts.forEach((part) => {
    if (/^(\*\*|__).+\1$/.test(part)) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      container.appendChild(strong);
    } else if (part) {
      container.appendChild(document.createTextNode(part));
    }
  });
}

function renderBotText(message, text) {
  message.replaceChildren();
  const lines = String(text ?? "").replace(/\r/g, "").split("\n");
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const element = document.createElement("p");
    appendInlineBotText(element, paragraph.join(" ").trim());
    message.appendChild(element);
    paragraph = [];
  };

  const closeList = () => {
    if (list) {
      message.appendChild(list);
      list = null;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      closeList();
      return;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (numbered || bullet) {
      flushParagraph();
      if (!list || list.tagName.toLowerCase() !== (numbered ? "ol" : "ul")) {
        closeList();
        list = document.createElement(numbered ? "ol" : "ul");
      }
      const item = document.createElement("li");
      appendInlineBotText(item, (numbered || bullet)[1]);
      list.appendChild(item);
      return;
    }

    closeList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  closeList();
}

function normalizarResposta(resposta) {
  if (typeof resposta === "string") {
    const blocoJson = resposta.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (blocoJson) {
      try {
        const parsed = JSON.parse(blocoJson[1]);
        return { text: parsed.text ?? parsed.resposta ?? resposta, chart: parsed.chart ?? parsed.grafico ?? null };
      } catch {
        return { text: resposta, chart: null };
      }
    }
    return montarTextoEGrafico(resposta);
  }
  const text = resposta?.text ?? resposta?.resposta ?? "";
  const chartExplicito = resposta?.chart ?? resposta?.grafico ?? null;
  if (chartExplicito) return { text, chart: chartExplicito };
  return montarTextoEGrafico(text);
}

// Sempre esconde qualquer trecho que pareça tabela markdown (linhas "| ... |")
// da mensagem exibida no chat, tenha ou não virado gráfico — o usuário nunca
// deve ver "| Município | | --- | |" cru, mesmo quando a IA não manda uma
// coluna de valor numérico (e por isso extrairTabela não consegue montar chart).
function montarTextoEGrafico(texto) {
  const chart = extrairTabela(texto);
  const temTabela = texto.split("\n").some((linha) => {
    const trimmed = linha.trim();
    return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1;
  });
  return { text: temTabela ? removerTabelaMarkdown(texto) : texto, chart };
}

function removerTabelaMarkdown(texto) {
  return texto
    .split("\n")
    .filter((linha) => !(linha.trim().startsWith("|") && linha.trim().endsWith("|")))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function paraNumeroTabela(valor) {
  let limpo = String(valor ?? "").trim().replace(/[^\d,.-]/g, "");
  if (limpo === "" || limpo === "-") return NaN;
  // Formato BR (ex.: "772.972.627,23"): ponto é separador de milhar, vírgula é decimal.
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  return Number(limpo);
}

function extrairTabela(texto) {
  const linhas = texto.split("\n").map((linha) => linha.trim()).filter((linha) => linha.startsWith("|") && linha.endsWith("|"));
  if (linhas.length < 3) return null;

  const cabecalho = linhas[0].split("|").slice(1, -1).map((item) => item.trim());
  const dados = linhas.slice(2).map((linha) => linha.split("|").slice(1, -1).map((item) => item.trim()));

  // Escolhe a coluna com mais células numéricas de verdade, ignorando a
  // primeira (é sempre o rótulo/nome do item na tabela pedida à IA).
  let valorIndex = -1;
  let melhorContagem = 0;
  cabecalho.forEach((_item, index) => {
    if (index === 0) return;
    const contagem = dados.filter((linha) => Number.isFinite(paraNumeroTabela(linha[index]))).length;
    if (contagem > melhorContagem) {
      melhorContagem = contagem;
      valorIndex = index;
    }
  });
  if (valorIndex < 0) return null;

  const pontos = dados
    .map((linha) => ({ label: linha[0], value: paraNumeroTabela(linha[valorIndex]) }))
    .filter((ponto) => ponto.label && Number.isFinite(ponto.value));
  return pontos.length >= 2 ? { title: cabecalho[valorIndex], labels: pontos.map((ponto) => ponto.label), values: pontos.map((ponto) => ponto.value) } : null;
}

const MIN_ITENS_GRAFICO = 4;

function criarGraficoResposta(message, chartData) {
  if (!window.Chart || !chartData) return;
  let labels = chartData.labels;
  let values = chartData.values;
  if ((!labels || !values) && Array.isArray(chartData.data) && chartData.data.every((item) => item && typeof item === "object")) {
    const labelKey = ["label", "municipio", "diag", "grupo", "nome"].find((key) => chartData.data.some((item) => item[key] !== undefined));
    const valueKey = ["value", "valor", "taxa", "internacoes", "custo_medio", "casos"].find((key) => chartData.data.some((item) => Number.isFinite(Number(item[key]))));
    if (labelKey && valueKey) {
      labels = chartData.data.map((item) => item[labelKey]);
      values = chartData.data.map((item) => Number(item[valueKey]));
    }
  }
  values = values ?? chartData.data;
  if (!Array.isArray(labels) || !Array.isArray(values) || labels.length !== values.length || labels.length < MIN_ITENS_GRAFICO) return;
  if (values.some((value) => !Number.isFinite(Number(value)))) return;

  const canvas = document.createElement("canvas");
  canvas.className = "chat-response-chart";
  canvas.setAttribute("aria-label", chartData.title || "Gráfico da resposta");
  message.appendChild(canvas);
  new Chart(canvas, {
    type: chartData.type === "line" ? "line" : "bar",
    data: {
      labels,
      datasets: [{
        label: chartData.label || chartData.title || "Resultado",
        data: values.map(Number),
        backgroundColor: "rgba(23, 105, 170, 0.72)",
        borderColor: "#0B3D6E",
        borderWidth: 1.5,
        borderRadius: 2,
        fill: chartData.type === "line",
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: Boolean(chartData.label) } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function appendBotResponse(log, resposta) {
  const normalized = normalizarResposta(resposta);
  const message = appendChatMessage(log, normalized.text, "bot");
  criarGraficoResposta(message, normalized.chart);
  return message;
}

function iniciarNovaConversa(log, input) {
  resetConversationId();
  log.innerHTML = "";
  appendChatMessage(log, "Olá, eu sou a Athena. Posso ajudar a interpretar os indicadores do CLARITI. Qual recorte você quer investigar?", "bot");
  input.value = "";
  input.disabled = false;
  input.focus();
}

function initChatPage() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const log = document.getElementById("chat-log");
  const newConversationButton = document.getElementById("nova-conversa-btn");
  if (!form || !input || !log) return;

  newConversationButton?.addEventListener("click", () => iniciarNovaConversa(log, input));

  document.querySelectorAll(".prompt-chip").forEach((prompt) => {
    prompt.addEventListener("click", () => {
      input.value = prompt.textContent;
      input.focus();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    appendChatMessage(log, question, "user");
    input.value = "";
    input.disabled = true;
    const waiting = appendChatMessage(log, "Consultando os dados...", "bot");

    try {
      const resposta = await askClaritiAI(question);
      const normalized = normalizarResposta(resposta);
      renderBotText(waiting, normalized.text);
      criarGraficoResposta(waiting, normalized.chart);
    } catch (error) {
      console.error("Falha ao consultar a Athena (Select AI):", error);
      renderBotText(waiting, "Não foi possível consultar a Athena. Verifique o endpoint e a conexão com o ORDS.");
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", initChatPage);
