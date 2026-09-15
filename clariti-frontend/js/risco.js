let riscoMunicipal = [];
let municipioSelecionado = null;

function riscoNumero(valor, casas = 1) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "indisponível";
  return fmtNumero(Number(valor), casas);
}

function riscoStatusOuPercentual(item, percentualKey, statusKey) {
  if (item[statusKey] === "SUPRIMIDO_K5") return item[`${statusKey}Display`];
  const valor = item[percentualKey];
  return valor === null || valor === undefined ? "indisponível" : `${riscoNumero(valor)}%`;
}

function mostrarErroRisco(mensagem) {
  document.getElementById("risco-ranking").innerHTML = `<div class="data-unavailable">${mensagem}</div>`;
  document.getElementById("risco-kpis").innerHTML = "";
}

async function carregarRisco() {
  const button = document.getElementById("carregar-risco-btn");
  button.disabled = true;
  button.textContent = "Atualizando...";

  try {
    riscoMunicipal = await getRiscoMunicipal(anoAtualSelecionado());
    municipioSelecionado = null;
    renderRiscoKpis();
    renderRiscoRanking();
    limparRiscoDetalhe();
  } catch (error) {
    mostrarErroRisco("Não foi possível carregar o risco estimado para este ano.");
  } finally {
    button.disabled = false;
    button.textContent = "Atualizar dados";
  }
}

function renderRiscoKpis() {
  const avaliadas = riscoMunicipal.reduce((total, item) => total + (Number(item.internacoesAvaliadas) || 0), 0);
  const riscos = riscoMunicipal.map((item) => Number(item.riscoMedioPct)).filter(Number.isFinite);
  const maiorRisco = riscos.length ? Math.max(...riscos) : null;
  const prioritarios = riscoMunicipal.filter((item) => item.statusPrioritario === "PUBLICADO").length;

  document.getElementById("risco-kpis").innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Internações avaliadas</div>
      <span class="kpi-value">${avaliadas.toLocaleString("pt-BR")}</span>
      <span class="kpi-delta">${riscoMunicipal.length.toLocaleString("pt-BR")} municípios</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Maior risco médio estimado</div>
      <span class="kpi-value">${maiorRisco === null ? "indisponível" : `${riscoNumero(maiorRisco)}%`}</span>
      <span class="kpi-delta">entre os municípios publicados</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Municípios com prioritário publicado</div>
      <span class="kpi-value">${prioritarios.toLocaleString("pt-BR")}</span>
      <span class="kpi-delta">status de publicação</span>
    </div>`;
}

function renderRiscoRanking() {
  const container = document.getElementById("risco-ranking");
  if (!riscoMunicipal.length) {
    container.innerHTML = '<div class="data-unavailable">Nenhum município encontrado para este ano.</div>';
    return;
  }

  const maiorRisco = Math.max(...riscoMunicipal.map((item) => Number(item.riscoMedioPct)).filter(Number.isFinite));
  container.innerHTML = "";

  riscoMunicipal.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "risk-ranking-item";
    button.setAttribute("aria-label", `Abrir detalhes de ${item.municipio}`);

    const risco = Number(item.riscoMedioPct);
    const percentualBarra = Number.isFinite(risco) && maiorRisco > 0 ? Math.max(4, (risco / maiorRisco) * 100) : 0;
    const riscoTexto = Number.isFinite(risco) ? `${riscoNumero(risco)}%` : "indisponível";
    const statusTexto = item.statusPrioritario === "SUPRIMIDO_K5"
      ? item.statusPrioritarioDisplay
      : riscoStatusOuPercentual(item, "pcPrioritarioPublicada", "statusPrioritario");

    button.innerHTML = `
      <span class="risk-rank-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="risk-ranking-main">
        <strong></strong>
        <span class="risk-bar-track"><span class="risk-bar-fill" style="width:${percentualBarra}%"></span></span>
      </span>
      <span class="risk-ranking-value">
        <strong>${riscoTexto}</strong>
        <small>${statusTexto}</small>
      </span>`;
    button.querySelector("strong").textContent = item.municipio || "Município sem nome";
    button.addEventListener("click", () => selecionarMunicipio(item, button));
    container.appendChild(button);
  });
}

async function selecionarMunicipio(item, button) {
  document.querySelectorAll(".risk-ranking-item.is-selected").forEach((element) => element.classList.remove("is-selected"));
  button.classList.add("is-selected");
  municipioSelecionado = item;
  const detalhe = document.getElementById("risco-detalhe");
  detalhe.innerHTML = '<div class="data-unavailable">Carregando distribuição por faixa...</div>';
  document.getElementById("detalhe-risco-subtitle").textContent = item.municipio;

  try {
    const faixas = await getRiscoFaixas(anoAtualSelecionado(), item.municipio);
    renderRiscoDetalhe(faixas);
  } catch (error) {
    detalhe.innerHTML = '<div class="data-unavailable">Não foi possível carregar as faixas de risco.</div>';
  }
}

function renderRiscoDetalhe(faixas) {
  const detalhe = document.getElementById("risco-detalhe");
  if (!faixas.length) {
    detalhe.innerHTML = '<div class="data-unavailable">Nenhuma faixa encontrada para este município.</div>';
    return;
  }

  const maior = Math.max(...faixas.map((item) => Number(item.internacoesAvaliadas)).filter(Number.isFinite));
  detalhe.innerHTML = faixas.map((item) => {
    const quantidade = Number(item.internacoesAvaliadas);
    const largura = Number.isFinite(quantidade) && maior > 0 ? Math.max(4, (quantidade / maior) * 100) : 0;
    return `
      <div class="risk-band">
        <div class="funnel-label"><span>${item.faixaRisco || "Faixa não informada"}</span><strong>${Number.isFinite(quantidade) ? quantidade.toLocaleString("pt-BR") : "indisponível"}</strong></div>
        <div class="funnel-bar-track"><div class="funnel-bar-fill" style="width:${largura}%"></div></div>
        <div class="risk-band-note">Probabilidade média: ${riscoNumero(item.probabilidadeMedia)}%</div>
      </div>`;
  }).join("");
}

function limparRiscoDetalhe() {
  document.getElementById("detalhe-risco-subtitle").textContent = "Nenhum município selecionado.";
  document.getElementById("risco-detalhe").innerHTML = "Clique em um município do ranking.";
}

document.addEventListener("clariti:ano-mudou", carregarRisco);
document.addEventListener("DOMContentLoaded", carregarRisco);
