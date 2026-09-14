let sazonalidadeChart;

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
    <div class="panel-grid">
      <div class="panel">
        <h3 class="panel-title">Diagnósticos por volume</h3>
        <p class="panel-note">Clique num diagnóstico para abrir o perfil clínico.</p>
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

  renderListaDiagnosticos(dados.diagnosticos);
  renderSazonalidade(dados.sazonalidade_mensal);
}

function renderListaDiagnosticos(diagnosticos) {
  const list = document.getElementById("lista-diag");
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
