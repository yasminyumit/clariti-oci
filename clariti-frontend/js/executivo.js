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

let rankingChart, scatterChart, icsapMap;

const MUNICIPIO_COORDS = {
  "350910": [-21.8319, -51.9887],
  "350995": [-22.7029, -45.0527],
  "351010": [-21.3256, -48.6309],
  "351250": [-21.3555, -50.2854],
  "351270": [-22.2211, -47.6250],
  "351680": [-20.7957, -50.1908],
  "351890": [-20.6492, -50.6623],
  "352120": [-24.5843, -48.5940],
  "352300": [-20.6435, -51.5084],
  "352380": [-21.7309, -46.9743],
  "352540": [-20.3105, -47.5916],
  "352630": [-23.0898, -45.1904],
  "352790": [-22.3384, -50.3940],
  "352885": [-21.2575, -49.1315],
  "353040": [-20.6147, -49.4628],
  "353205": [-21.5096, -48.1504],
  "353330": [-20.8558, -50.2619],
  "353400": [-20.6071, -49.2951],
  "353420": [-20.1819, -49.3508],
  "353660": [-20.0296, -49.3999],
  "353970": [-22.6328, -50.2050],
  "354220": [-22.2295, -50.8922],
  "354270": [-20.6032, -47.4831],
  "354280": [-24.6577, -49.0086],
  "354323": [-21.8378, -51.6022],
  "355255": [-20.5011, -51.0247],
  "355260": [-20.9648, -49.0332],
  "355550": [-22.5261, -49.6635],
  "350115": [-23.5203, -47.2575],
  "350140": [-22.0788, -49.7195],
  "351580": [-21.6760, -51.3805],
  "352044": [-20.4281, -51.3411],
  "352560": [-22.2486, -50.7677],
  "353215": [-22.6191, -51.2382],
  "353310": [-21.3330, -51.6466],
  "353380": [-22.9423, -49.3408],
  "353657": [-22.5730, -49.3985],
  "353990": [-20.7837, -49.8150],
  "354440": [-21.2996, -50.7299],
  "354610": [-20.0939, -50.9264],
  "354710": [-21.3513, -51.7534],
  "355120": [-23.2747, -49.4772],
  "355190": [-20.8108, -48.8054],
  "3541406": [-22.1207, -51.3882],
  "3529005": [-22.2171, -49.9501],
  "3542602": [-24.4875, -47.8436],
  "3507605": [-22.9519, -46.5419],
  "3522208": [-23.5917, -48.0531],
  "3504503": [-23.105, -48.925],
  "3507506": [-22.8858, -48.445],
  "3534904": [-22.9788, -49.8706],
  "3504602": [-22.6617, -50.4117],
  "3525300": [-22.2966, -48.5592],
};

const MUNICIPIO_COORDS_BY_NAME = {
  "aluminio": [-23.5203, -47.2575],
  "alvaro de carvalho": [-22.0788, -49.7195],
  "flora rica": [-21.6760, -51.3805],
  "ilha solteira": [-20.4281, -51.3411],
  "joao ramalho": [-22.2486, -50.7677],
  "nantes": [-22.6191, -51.2382],
  "nova guataporanga": [-21.3330, -51.6466],
  "oleo": [-22.9423, -49.3408],
  "paulistania": [-22.5730, -49.3985],
  "poloni": [-20.7837, -49.8150],
  "rubiacea": [-21.2996, -50.7299],
  "santa clara d'oeste": [-20.0939, -50.9264],
  "santa mercedes": [-21.3513, -51.7534],
  "sarutaia": [-23.2747, -49.4772],
  "severinia": [-20.8108, -48.8054],
};

function normalizarNomeMunicipio(nome) {
  return String(nome || "")
    .replace(/\s*-\s*SP\s*$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function carregarExecutivo() {
  const ano = anoAtualSelecionado();
  const btn = document.getElementById("gerar-btn");
  btn.disabled = true;
  btn.textContent = "Gerando...";

  try {
    const dados = await getPainelExecutivo(ano);
    renderKpis(dados.kpis);
    renderRanking(dados.ranking_icsap);
    renderMap(dados.ranking_icsap);
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

function renderMap(ranking) {
  const mapEl = document.getElementById("icsap-map");
  const unavailableEl = document.getElementById("map-unavailable");
  if (!mapEl || !window.L) {
    if (mapEl) mapEl.hidden = true;
    unavailableEl.hidden = false;
    return;
  }

  const pontos = ranking.map((item) => {
    const latitude = Number(item.latitude ?? item.lat ?? item.latitude_deg);
    const longitude = Number(item.longitude ?? item.lng ?? item.longitude_deg);
    const coords = Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [latitude, longitude]
      : MUNICIPIO_COORDS[String(item.municipio_6)] ||
        MUNICIPIO_COORDS_BY_NAME[normalizarNomeMunicipio(item.municipio)];
    return { ...item, coords };
  }).filter((item) => item.coords);

  if (!pontos.length) {
    mapEl.hidden = true;
    unavailableEl.hidden = false;
    return;
  }

  mapEl.hidden = false;
  unavailableEl.hidden = true;
  if (icsapMap) icsapMap.remove();

  icsapMap = L.map(mapEl, { scrollWheelZoom: false }).setView([-22.4, -48.5], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(icsapMap);

  const taxas = pontos.map((item) => Number(item.taxa)).filter(Number.isFinite);
  const menor = Math.min(...taxas);
  const maior = Math.max(...taxas);
  const escala = (taxa) => maior === menor ? 0.5 : (Number(taxa) - menor) / (maior - menor);
  const cor = (taxa) => {
    const proporcao = escala(taxa);
    const vermelho = Math.round(101 + proporcao * 101);
    const verde = Math.round(169 - proporcao * 87);
    const azul = Math.round(196 - proporcao * 121);
    return `rgb(${vermelho}, ${verde}, ${azul})`;
  };

  const bounds = [];
  pontos.forEach((item) => {
    const marker = L.circleMarker(item.coords, {
      radius: 7 + escala(item.taxa) * 7,
      color: "#FFFFFF",
      weight: 1.5,
      fillColor: cor(item.taxa),
      fillOpacity: 0.9,
    }).addTo(icsapMap);
    marker.bindPopup(`<div class="map-popup-title">${item.municipio}</div><div class="map-popup-value">${fmtNumero(Number(item.taxa), 1)}% ICSAP</div>`);
    marker.on("click", () => {
      if (item.municipio_6) irParaTatico(String(item.municipio_6), item.municipio);
    });
    bounds.push(item.coords);
  });
  icsapMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 9 });
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

  const ordenado = [...ranking].sort((a, b) => Number(b.taxa) - Number(a.taxa));
  const principais = ordenado.slice(0, 10);
  const restantes = ordenado.slice(10).filter((item) => Number.isFinite(Number(item.taxa)));
  const dadosGrafico = [...principais];
  if (restantes.length) {
    const mediaOutros = restantes.reduce((total, item) => total + Number(item.taxa), 0) / restantes.length;
    dadosGrafico.push({
      municipio: `Outros municípios (${restantes.length})`,
      taxa: mediaOutros,
      municipio_6: null,
    });
  }

  rankingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dadosGrafico.map((r) => r.municipio),
      datasets: [{
        data: dadosGrafico.map((r) => r.taxa),
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
        const municipio = dadosGrafico[idx].municipio;
        const municipioCodigo = dadosGrafico[idx].municipio_6;
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
