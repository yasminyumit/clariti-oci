let sazonalidadeChart;
let rankingDiagnosticosChart;
let diagnosticosAtuais = [];

async function carregarTatico() {
  const municipioCodigo = localStorage.getItem("clariti_municipio_6");
  const municipioNome = localStorage.getItem("clariti_municipio_nome");
  const container = document.getElementById("conteudo-tatico");

  if (!municipioCodigo) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Nenhum município selecionado</h2>
        <p>Volte ao <a href="executivo.html">Dashboard Executivo</a> e clique num município do ranking de ICSAP para abrir a análise tática dele aqui.</p>
      </div>`;
    return;
  }

  document.getElementById("titulo-municipio").textContent = `Dashboard Tático — ${municipioNome}`;

  const ano = anoAtualSelecionado();
  let dados;
  try {
    dados = await getPainelTatico(municipioCodigo, ano);
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Não foi possível carregar o município</h2>
        <p>Verifique a conexão com o endpoint tático e tente novamente.</p>
      </div>`;
    return;
  }

  if (!dados.diagnosticos?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Sem dados táticos para este recorte</h2>
        <p>A API respondeu corretamente, mas não encontrou diagnósticos para ${municipioNome} em ${ano}.</p>
      </div>`;
    return;
  }

  const mixLeitos = dados.mix_leitos || {};
  const formatarLeito = (valor) => valor === null || valor === undefined ? "indisponível" : valor;

  container.innerHTML = `
    <div class="panel panel-full tactical-controls">
      <div>
        <h3 class="panel-title">Filtros de análise</h3>
        <p class="panel-note">Altere a métrica e o recorte do ranking sem recarregar os dados.</p>
      </div>
      <div class="filter-row">
        <label>
          Buscar diagnóstico
          <input id="filtro-diagnostico" type="search" placeholder="Ex.: I500" autocomplete="off">
        </label>
        <label>
          Ordenar por
          <select id="metrica-diagnostico">
            <option value="internacoes">Volume de internações</option>
            <option value="custo_medio">Custo médio</option>
          </select>
        </label>
        <label>
          Exibir
          <select id="limite-diagnostico">
            <option value="5">Top 5</option>
            <option value="10" selected>Top 10</option>
            <option value="all">Todos</option>
          </select>
        </label>
      </div>
    </div>
    <div class="panel-grid">
      <div class="panel">
        <h3 class="panel-title">Ranking por diagnóstico</h3>
        <p class="panel-note">Clique numa barra ou item para abrir o perfil clínico.</p>
        <canvas id="chart-ranking-diagnosticos"></canvas>
        <div id="lista-diag"></div>
      </div>
      <div class="panel">
        <h3 class="panel-title">Sazonalidade mensal</h3>
        <canvas id="chart-sazonalidade"></canvas>
      </div>
    </div>
    <div class="panel panel-full">
      <h3 class="panel-title">Mix de leitos</h3>
      <p class="panel-note">SUS: ${formatarLeito(mixLeitos.sus)} · Contratados: ${formatarLeito(mixLeitos.contratados)} · Não-SUS: ${formatarLeito(mixLeitos.nao_sus)}</p>
    </div>
  `;

  diagnosticosAtuais = dados.diagnosticos;
  document.getElementById("filtro-diagnostico").addEventListener("input", atualizarDiagnosticos);
  document.getElementById("metrica-diagnostico").addEventListener("change", atualizarDiagnosticos);
  document.getElementById("limite-diagnostico").addEventListener("change", atualizarDiagnosticos);
  atualizarDiagnosticos();
  renderSazonalidade(dados.sazonalidade_mensal);
}

function atualizarDiagnosticos() {
  const busca = document.getElementById("filtro-diagnostico").value.trim().toLowerCase();
  const metrica = document.getElementById("metrica-diagnostico").value;
  const limite = document.getElementById("limite-diagnostico").value;
  const filtrados = diagnosticosAtuais
    .filter((diagnostico) => String(diagnostico.diag).toLowerCase().includes(busca))
    .sort((a, b) => Number(b[metrica]) - Number(a[metrica]));
  const exibidos = limite === "all" ? filtrados : filtrados.slice(0, Number(limite));

  renderRankingDiagnosticos(exibidos, metrica);
  renderListaDiagnosticos(exibidos);
}

function renderListaDiagnosticos(diagnosticos) {
  const list = document.getElementById("lista-diag");
  if (!diagnosticos.length) {
    list.innerHTML = `<div class="data-unavailable">Nenhum diagnóstico encontrado para este filtro.</div>`;
    return;
  }
  list.innerHTML = "";

  diagnosticos.forEach((diagnostico) => {
    const button = document.createElement("button");
    button.className = "level-card diagnostico-button";
    button.type = "button";
    button.innerHTML = `
      <strong></strong><br>
      <span></span>`;
    button.querySelector("strong").textContent = diagnostico.diag;
    button.querySelector("span").textContent =
      `${diagnostico.internacoes} internações · custo médio ${fmtMoeda(diagnostico.custo_medio)}`;
    button.addEventListener("click", () => irParaClinico(diagnostico.diag));
    list.appendChild(button);
  });
}

function renderRankingDiagnosticos(diagnosticos, metrica) {
  const ctx = document.getElementById("chart-ranking-diagnosticos");
  if (rankingDiagnosticosChart) rankingDiagnosticosChart.destroy();

  rankingDiagnosticosChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: diagnosticos.map((diagnostico) => diagnostico.diag),
      datasets: [{
        data: diagnosticos.map((diagnostico) => diagnostico[metrica]),
        backgroundColor: metrica === "custo_medio" ? "#C9564B" : "#1769AA",
        borderRadius: 2,
      }],
    },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => metrica === "custo_medio"
              ? ` ${fmtMoeda(item.raw)} por internação`
              : ` ${fmtNumero(item.raw, 0)} internações`,
          },
        },
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: metrica === "custo_medio" ? "Custo médio (R$)" : "Internações" } },
      },
      onClick: (_event, elements) => {
        if (!elements.length) return;
        irParaClinico(diagnosticos[elements[0].index].diag);
      },
    },
  });
}

function renderSazonalidade(valores) {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const ctx = document.getElementById("chart-sazonalidade");
  if (sazonalidadeChart) sazonalidadeChart.destroy();

  sazonalidadeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        data: valores,
        borderColor: "#1769AA",
        backgroundColor: "rgba(23,105,170,0.12)",
        fill: true,
        tension: 0.3,
      }],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

document.addEventListener("clariti:ano-mudou", carregarTatico);
document.addEventListener("DOMContentLoaded", carregarTatico);
