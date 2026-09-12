/**
 * CLARITI — navegação, seletor de ano global e widget de chat.
 * Incluído em toda página. Depende de api.js estar carregado antes.
 */

const ANO_STORAGE_KEY = "clariti_ano_selecionado";
const DEFAULT_ANOS = [2024, 2023, 2022];

function anoAtualSelecionado() {
  return Number(localStorage.getItem(ANO_STORAGE_KEY)) || DEFAULT_ANOS[0];
}

function initYearSelect() {
  const select = document.getElementById("year-select");
  if (!select) return;

  select.innerHTML = DEFAULT_ANOS.map((a) => `<option value="${a}">${a}</option>`).join("");
  select.value = anoAtualSelecionado();

  select.addEventListener("change", () => {
    localStorage.setItem(ANO_STORAGE_KEY, select.value);
    document.dispatchEvent(new CustomEvent("clariti:ano-mudou", { detail: { ano: Number(select.value) } }));
  });
}

function initModeBadge() {
  const controls = document.querySelector(".nav-controls");
  if (!controls || typeof CLARITI_CONFIG === "undefined" || !CLARITI_CONFIG.MOCK_MODE) return;

  const badge = document.createElement("span");
  badge.className = "mode-badge";
  badge.textContent = "Demonstração";
  controls.insertBefore(badge, controls.firstChild);
}

function marcarLinkAtivo() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .side-links a").forEach((link) => {
    if (link.getAttribute("href") === path) link.classList.add("active");
  });
}

function initSidebar() {
  const menu = document.getElementById("side-menu");
  const toggle = document.getElementById("menu-toggle");
  const close = document.getElementById("menu-close");
  const overlay = document.getElementById("nav-overlay");
  if (!menu || !toggle || !close || !overlay) return;

  const setOpen = (open) => {
    menu.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-is-open", open);
  };

  toggle.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", () => setOpen(false));
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
}

/* ---------- Navegação de drill-down entre páginas ---------- */

function irParaTatico(municipioCodigo, nomeMunicipio) {
  localStorage.setItem("clariti_municipio_6", municipioCodigo);
  localStorage.setItem("clariti_municipio_nome", nomeMunicipio);
  window.location.href = "tatico.html";
}

function irParaClinico(diagPrinc) {
  localStorage.setItem("clariti_diag_princ", diagPrinc);
  window.location.href = "clinico.html";
}

document.addEventListener("DOMContentLoaded", () => {
  initYearSelect();
  initModeBadge();
  marcarLinkAtivo();
  initSidebar();
});
