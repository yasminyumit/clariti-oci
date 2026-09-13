function appendChatMessage(log, text, type) {
  const message = document.createElement("div");
  message.className = `chat-msg ${type}`;
  message.textContent = text;
  log.appendChild(message);
  log.scrollTop = log.scrollHeight;
  return message;
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
    return { text: resposta, chart: extrairTabela(resposta) };
  }
  return {
    text: resposta?.text ?? resposta?.resposta ?? "",
    chart: resposta?.chart ?? resposta?.grafico ?? null,
  };
}

function extrairTabela(texto) {
  const linhas = texto.split("\n").map((linha) => linha.trim()).filter((linha) => linha.startsWith("|") && linha.endsWith("|"));
  if (linhas.length < 3) return null;

  const cabecalho = linhas[0].split("|").slice(1, -1).map((item) => item.trim());
  const dados = linhas.slice(2).map((linha) => linha.split("|").slice(1, -1).map((item) => item.trim()));
  const valorIndex = cabecalho.findIndex((_item, index) => dados.some((linha) => Number(linha[index]?.replace(/[^\d,.-]/g, "").replace(",", ".")) === Number(linha[index]?.replace(/[^\d,.-]/g, "").replace(",", "."))));
  if (valorIndex < 0) return null;

  const pontos = dados.map((linha) => ({ label: linha[0], value: Number(linha[valorIndex].replace(/[^\d,.-]/g, "").replace(",", ".")) })).filter((ponto) => ponto.label && Number.isFinite(ponto.value));
  return pontos.length >= 2 ? { title: cabecalho[valorIndex], labels: pontos.map((ponto) => ponto.label), values: pontos.map((ponto) => ponto.value) } : null;
}

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
  if (!Array.isArray(labels) || !Array.isArray(values) || labels.length !== values.length || !labels.length) return;

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
  appendChatMessage(log, "Olá. Posso ajudar a interpretar os indicadores do CLARITI. Qual recorte você quer investigar?", "bot");
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
      waiting.textContent = normalized.text;
      criarGraficoResposta(waiting, normalized.chart);
    } catch (error) {
      console.error("Falha ao consultar o Select AI:", error);
      waiting.textContent = "Não foi possível consultar o Select AI. Verifique o endpoint e a conexão com o ORDS.";
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", initChatPage);
