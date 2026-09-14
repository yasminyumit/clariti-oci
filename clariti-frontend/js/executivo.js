/**
 * CLARITI — Dashboard Executivo (nível 1).
 * Depende de api.js e nav.js já carregados.
 */

const KPI_META = [
  { key: "taxa_internacao", label: "Taxa de internação /1.000 hab", tipo: "num", casas: 2, boaSubida: false },
  { key: "pct_icsap", label: "% ICSAP sobre total de internações", tipo: "pct", casas: 1, boaSubida: false },
  { key: "custo_medio", label: "Custo médio por internação", tipo: "moeda", boaSubida: false },
  { key: "permanencia_media", label: "Permanência média (dias)", tipo: "num", casas: 1, boaSubida: false },
  { key: "leitos_sus_1000", label: "Leitos SUS /1.000 hab", tipo: "num", casas: 2, boaSubida: true },
];

let rankingChart, scatterChart;

async function carregarExecutivo() {
  const ano = anoAtualSelecionado();
  const btn = document.getElementById("gerar-btn");
  btn.disabled = true;
  btn.textContent = "Gerando...";

  try {
    const dados = await getPainelExecutivo(ano);
    renderKpis(dados.kpis);
    renderRanking(dados.ranking_icsap);
    renderFunil(dados.funil);
    renderScatter(dados.scatter);
  } catch (err) {
    document.getElementById("kpi-row").innerHTML =
      `<div class="empty-state" style="grid-column:1/-1;"><h2>Não foi possível carregar os dados</h2><p>Verifique se o endpoint ORDS está no ar e configurado em js/api.js.</p></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Gerar dashboard";
  }
}

function renderKpis(kpis) {
  const row = document.getElementById("kpi-row");
  row.innerHTML = KPI_META.map((meta) => {
    const item = kpis[meta.key];
    if (!item || item.valor === null || item.valor === undefined) {
      return `
        <div class="kpi-card">
          <div class="kpi-label">${meta.label}</div>
          <span class="kpi-value">—</span>
          <span class="kpi-delta">indisponível</span>
        </div>`;
    }
    const valorFmt =
      meta.tipo === "moeda" ? fmtMoeda(item.valor) :
      meta.tipo === "pct" ? `${fmtNumero(item.valor, meta.casas)}%` :
      fmtNumero(item.valor, meta.casas);

    const subiu = Number(item.delta_pct) >= 0;
    const positivo = meta.boaSubida ? subiu : !subiu;
    const deltaClass = positivo ? "up" : "down";

    return `
      <div class="kpi-card">
        <div class="kpi-label">${meta.label}</div>
        <span class="kpi-value">${valorFmt}</span>
        <span class="kpi-delta ${deltaClass}">${fmtDelta(item.delta_pct)} vs. ano anterior</span>
      </div>`;
  }).join("");
}

function renderRanking(ranking) {
  const ctx = document.getElementById("chart-ranking");
  if (rankingChart) rankingChart.destroy();

  rankingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ranking.map((r) => r.municipio),
      datasets: [{
        data: ranking.map((r) => r.taxa),
        backgroundColor: "#1769AA",
        borderRadius: 2,
      }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "% ICSAP" } },
      },
      onClick: (evt, elements) => {
        if (!elements.length) return;
        const idx = elements[0].index;
        const municipio = ranking[idx].municipio;
        const municipioCodigo = ranking[idx].municipio_6;
        if (!municipioCodigo) return;
        irParaTatico(String(municipioCodigo), municipio);
      },
    },
  });
}

function renderFunil(funil) {
  const funilEl = document.getElementById("funil");
  const valores = [funil?.dotacao, funil?.empenhado, funil?.liquidado, funil?.pago];
  if (valores.some((valor) => valor === null || valor === undefined || Number.isNaN(Number(valor)))) {
    funilEl.innerHTML = `<div class="data-unavailable">Funil orçamentário indisponível para este ano.</div>`;
    return;
  }

  const etapas = [
    { label: "Dotação atualizada", valor: funil.dotacao },
    { label: "Empenhado", valor: funil.empenhado },
    { label: "Liquidado", valor: funil.liquidado },
    { label: "Pago", valor: funil.pago },
  ];
  const max = etapas[0].valor;

  const html = etapas.map((etapa, i) => {
    const pct = (etapa.valor / max) * 100;
    const conv = i === 0 ? null : ((etapa.valor / etapas[i - 1].valor) * 100).toFixed(1);
    return `
      <div class="funnel-step">
        <div class="funnel-label">
          <span>${etapa.label}</span>
          <strong>${fmtMoeda(etapa.valor)}</strong>
        </div>
        <div class="funnel-bar-track">
          <div class="funnel-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
      ${conv ? `<div class="funnel-conv">↓ ${conv}% do estágio anterior</div>` : ""}
    `;
  }).join("");

  funilEl.innerHTML = html;
}

function renderScatter(pontos) {
  let ctx = document.getElementById("chart-scatter");
  if (scatterChart) scatterChart.destroy();

  const pontosValidos = pontos.filter((p) => Number.isFinite(Number(p.investimento_pc)));
  if (!pontosValidos.length) {
    if (ctx) ctx.replaceWith(Object.assign(document.createElement("div"), {
      id: "scatter-unavailable",
      className: "data-unavailable",
      textContent: "Investimento per capita indisponível para este ano.",
    }));
    return;
  }

  const unavailable = document.getElementById("scatter-unavailable");
  if (unavailable) {
    ctx = document.createElement("canvas");
    ctx.id = "chart-scatter";
    ctx.style.maxHeight = "340px";
    unavailable.replaceWith(ctx);
  }

  const maxPop = Math.max(...pontosValidos.map((p) => p.populacao));

  scatterChart = new Chart(ctx, {
    type: "bubble",
    data: {
      datasets: [{
        label: "Municípios",
        data: pontosValidos.map((p) => ({
          x: p.investimento_pc,
          y: p.taxa_icsap,
          r: 6 + (p.populacao / maxPop) * 26,
          municipio: p.municipio,
        })),
        backgroundColor: "rgba(23, 105, 170, 0.55)",
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `${item.raw.municipio}: R$ ${item.raw.x}/hab, ${item.raw.y}% ICSAP`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: "Investimento per capita (R$)" } },
        y: { title: { display: true, text: "Taxa de ICSAP (%)" } },
      },
    },
  });
}

document.getElementById("gerar-btn").addEventListener("click", carregarExecutivo);
document.addEventListener("clariti:ano-mudou", carregarExecutivo);
document.addEventListener("DOMContentLoaded", carregarExecutivo);
