async function carregarClinico() {
  const diag = localStorage.getItem("clariti_diag_princ");
  const municipioNome = localStorage.getItem("clariti_municipio_nome");
  const container = document.getElementById("conteudo-clinico");

  if (!diag) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Nenhum diagnóstico selecionado</h2>
        <p>Volte ao <a href="tatico.html">Dashboard Tático</a> e clique num diagnóstico da lista para abrir o perfil clínico dele aqui.</p>
      </div>`;
    return;
  }

  document.getElementById("titulo-diag").textContent = `Dashboard Clínico — ${diag}${municipioNome ? " · " + municipioNome : ""}`;

  const municipioCodigo = localStorage.getItem("clariti_municipio_6") || "";
  let dados;
  try {
    dados = await getPainelClinico(municipioCodigo, anoAtualSelecionado(), "", diag);
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Não foi possível carregar o diagnóstico</h2>
        <p>Verifique a conexão com o endpoint clínico e tente novamente.</p>
      </div>`;
    return;
  }

  if (!dados.grupo_csap?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Sem dados clínicos para este recorte</h2>
        <p>A API respondeu corretamente, mas não encontrou casos para ${diag} neste município e ano.</p>
      </div>`;
    return;
  }

  const maxCasos = Math.max(...dados.grupo_csap.map((g) => g.casos));
  const totalCasos = Number(dados.total_casos) || dados.grupo_csap.reduce((total, grupo) => total + Number(grupo.casos || 0), 0);

  container.innerHTML = `
    <div class="panel-grid">
      <div class="panel">
        <h3 class="panel-title">Distribuição por grupo CSAP</h3>
        ${dados.grupo_csap.map((g) => `
          <div class="funnel-step">
            <div class="funnel-label"><span>${g.grupo}</span><strong>${g.casos}</strong></div>
            <div class="funnel-bar-track">
              <div class="funnel-bar-fill" style="width:${(g.casos / maxCasos) * 100}%"></div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="panel">
        <h3 class="panel-title">Indicadores de cuidado</h3>
        <div class="kpi-card" style="margin-bottom:12px;">
          <div class="kpi-label">Casos analisados</div>
          <span class="kpi-value">${fmtNumero(totalCasos, 0)}</span>
        </div>
        <div class="kpi-card" style="margin-bottom:12px;">
          <div class="kpi-label">Taxa de UTI entre casos ICSAP</div>
          <span class="kpi-value">${fmtNumero(dados.taxa_uti_icsap, 1)}%</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Reinternação em 30 dias</div>
          <span class="kpi-value">${fmtNumero(dados.reinternacao_30d, 1)}%</span>
        </div>
        <div class="callout">
          Uma taxa alta pode indicar dificuldade na continuidade do cuidado, alta precoce ou maior
          complexidade dos casos. Não deve ser interpretada isoladamente como falha do município,
          pois depende do perfil dos pacientes e da gravidade dos casos. Ver <a href="metodologia.html">metodologia</a>.
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("clariti:ano-mudou", carregarClinico);
document.addEventListener("DOMContentLoaded", carregarClinico);
