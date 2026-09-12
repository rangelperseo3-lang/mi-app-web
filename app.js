/* =========================================================
   INVERSIONES JORAN - Lógica de la plataforma
   ========================================================= */

let SESSION = { rol: null, usuario: null, usuarioId: null, clienteId: null, trabajadorId: null, vista: null };
const CHARTS = {};


/* =========================================================
   TEMA VISUAL JORAN — identidad corporativa
   Azul marino + dorado del logo. Se aplica sin alterar la lógica.
   ========================================================= */
function aplicarTemaJoran() {
  if (document.getElementById('joran-theme-v2')) return;
  const style = document.createElement('style');
  style.id = 'joran-theme-v2';
  style.textContent = `
    :root{
      --joran-navy:#0B2A4A;
      --joran-navy-2:#123B63;
      --joran-navy-3:#071B31;
      --joran-gold:#C9942E;
      --joran-gold-2:#E0B44C;
      --joran-bg:#F4F6F8;
      --joran-card:#FFFFFF;
      --joran-text:#1E293B;
      --joran-muted:#64748B;
      --joran-border:#E2E8F0;
      --joran-shadow:0 8px 24px rgba(11,42,74,.08);
      --joran-shadow-hover:0 12px 30px rgba(11,42,74,.14);
      --navy:var(--joran-navy);
      --navy-deep:var(--joran-navy-3);
      --navy-mid:var(--joran-navy-2);
      --gold:var(--joran-gold);
      --gold-light:var(--joran-gold-2);
      --text-main:var(--joran-text);
      --text-muted:var(--joran-muted);
      --border-color:var(--joran-border);
    }

    html{background:var(--joran-bg);}
    body{background:var(--joran-bg)!important;color:var(--joran-text);}
    button,.btn-main,.btn-secondary,.btn-danger,.nav-link,input,select,textarea{transition:all .18s ease;}

    /* Cabecera */
    #app-header,.app-header,.topbar,.header-bar{
      background:rgba(255,255,255,.96)!important;
      border-bottom:1px solid var(--joran-border)!important;
      box-shadow:0 4px 18px rgba(11,42,74,.06)!important;
      backdrop-filter:blur(10px);
    }
    #titulo-pagina{color:var(--joran-navy)!important;font-weight:800!important;letter-spacing:-.02em;}
    #header-user-name{color:var(--joran-navy)!important;font-weight:800!important;}
    #header-user-role{color:var(--joran-muted)!important;}
    #header-avatar-initials{
      background:linear-gradient(145deg,var(--joran-navy),var(--joran-navy-2))!important;
      color:#fff!important;border:2px solid rgba(201,148,46,.35);
      box-shadow:0 4px 12px rgba(11,42,74,.18);
    }

    /* Menú lateral */
    #app-sidebar,.sidebar,.app-sidebar{
      background:linear-gradient(180deg,var(--joran-navy-3) 0%,var(--joran-navy) 58%,#0D3155 100%)!important;
      border-right:1px solid rgba(224,180,76,.16)!important;
      box-shadow:8px 0 28px rgba(7,27,49,.12)!important;
    }
    #app-sidebar .brand,.sidebar .brand,.app-sidebar .brand{
      color:#fff!important;
    }
    #app-sidebar .brand span,.sidebar .brand span,.app-sidebar .brand span{color:var(--joran-gold-2)!important;}
    #menuLateral{padding:10px 10px 20px!important;}
    #menuLateral li{margin:3px 0!important;}
    #menuLateral .nav-link{
      color:rgba(255,255,255,.78)!important;
      border:1px solid transparent!important;
      border-radius:11px!important;
      padding:11px 13px!important;
      font-weight:600!important;
    }
    #menuLateral .nav-link i{width:22px;text-align:center;color:rgba(224,180,76,.88)!important;}
    #menuLateral .nav-link:hover{
      color:#fff!important;background:rgba(255,255,255,.08)!important;
      border-color:rgba(224,180,76,.16)!important;transform:translateX(2px);
    }
    #menuLateral .nav-link.active{
      color:#fff!important;
      background:linear-gradient(90deg,rgba(201,148,46,.22),rgba(255,255,255,.08))!important;
      border-color:rgba(224,180,76,.32)!important;
      box-shadow:inset 3px 0 0 var(--joran-gold-2),0 5px 16px rgba(0,0,0,.12)!important;
    }
    #menuLateral .nav-link.active i{color:var(--joran-gold-2)!important;}

    /* Área principal */
    #view-app{background:var(--joran-bg)!important;}
    #content-container{color:var(--joran-text);}
    .page-header,.content-header{margin-bottom:20px;}

    /* Tarjetas */
    .card-table,.card,.panel,.dashboard-card{
      background:var(--joran-card)!important;
      border:1px solid var(--joran-border)!important;
      border-radius:16px!important;
      box-shadow:var(--joran-shadow)!important;
    }
    .card-table:hover,.card:hover,.panel:hover,.dashboard-card:hover{box-shadow:var(--joran-shadow-hover)!important;}
    .card-table-header{
      padding:17px 19px!important;
      border-bottom:1px solid var(--joran-border)!important;
      background:linear-gradient(180deg,#fff,#fbfcfd)!important;
    }
    .card-table-header h3,.card h3,.panel h3{color:var(--joran-navy)!important;font-weight:800!important;}
    .subtitle{color:var(--joran-muted)!important;}

    /* Métricas */
    .metrics-row{gap:16px!important;margin-bottom:18px!important;}
    .metric-card,.metrics-card{
      border:1px solid var(--joran-border)!important;
      border-radius:15px!important;
      box-shadow:var(--joran-shadow)!important;
      background:#fff!important;
    }
    .metric-card:hover,.metrics-card:hover{transform:translateY(-2px);box-shadow:var(--joran-shadow-hover)!important;}

    /* Botones */
    .btn-main{
      background:linear-gradient(135deg,var(--joran-navy),var(--joran-navy-2))!important;
      color:#fff!important;border:1px solid var(--joran-navy)!important;
      border-radius:9px!important;font-weight:700!important;
      box-shadow:0 4px 12px rgba(11,42,74,.14)!important;
    }
    .btn-main:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 7px 17px rgba(11,42,74,.2)!important;}
    .btn-secondary{
      background:#fff!important;color:var(--joran-navy)!important;
      border:1px solid #CBD5E1!important;border-radius:9px!important;font-weight:700!important;
    }
    .btn-secondary:hover{background:#F8FAFC!important;border-color:var(--joran-gold)!important;color:var(--joran-navy)!important;}
    .btn-danger{border-radius:9px!important;font-weight:700!important;}

    /* Formularios */
    .field label{color:var(--joran-navy)!important;font-weight:700!important;margin-bottom:6px!important;}
    .form-control,input.form-control,select.form-control,textarea.form-control{
      border:1px solid #CBD5E1!important;border-radius:9px!important;
      background:#fff!important;color:var(--joran-text)!important;
      box-shadow:0 1px 2px rgba(15,23,42,.03)!important;
    }
    .form-control:focus,input.form-control:focus,select.form-control:focus,textarea.form-control:focus{
      border-color:var(--joran-gold)!important;
      box-shadow:0 0 0 3px rgba(201,148,46,.14)!important;outline:none!important;
    }

    /* Tablas */
    table{border-collapse:separate!important;border-spacing:0!important;}
    table thead th{
      background:#F8FAFC!important;color:var(--joran-navy)!important;
      font-size:.76rem!important;font-weight:800!important;text-transform:uppercase;
      letter-spacing:.03em;border-bottom:1px solid var(--joran-border)!important;
    }
    table tbody td{border-bottom:1px solid #EEF2F6!important;color:#334155;}
    table tbody tr:hover td{background:#FCFDFE!important;}

    /* Badges */
    .badge{border-radius:999px!important;font-weight:800!important;padding:5px 9px!important;}
    .badge-amber{background:#FFF7E6!important;color:#9A6700!important;border:1px solid #F3D38A!important;}
    .badge-orange{background:#FFF1E8!important;color:#B45309!important;border:1px solid #F6C59D!important;}
    .badge-green{background:#ECFDF3!important;color:#167A4A!important;border:1px solid #A7E3C2!important;}
    .badge-red{background:#FFF0F0!important;color:#B42318!important;border:1px solid #F2B8B5!important;}

    /* Modales */
    #modal-overlay{background:rgba(7,27,49,.58)!important;backdrop-filter:blur(3px);}
    #modal-box,.modal-box{
      background:#fff!important;border:1px solid var(--joran-border)!important;
      border-radius:18px!important;box-shadow:0 24px 70px rgba(7,27,49,.24)!important;
    }
    .modal-header{
      background:linear-gradient(135deg,var(--joran-navy),var(--joran-navy-2))!important;
      color:#fff!important;border-bottom:3px solid var(--joran-gold)!important;
      border-radius:18px 18px 0 0!important;padding:17px 20px!important;
    }
    .modal-header h3{color:#fff!important;font-weight:800!important;}
    .modal-close{color:#fff!important;opacity:.9;}

    /* Notificaciones / toast */
    #toast{border-left:4px solid var(--joran-gold)!important;border-radius:10px!important;box-shadow:0 12px 30px rgba(7,27,49,.18)!important;}

    /* Chips, pestañas y estados vacíos */
    .chip{border:1px solid var(--joran-border)!important;background:#F8FAFC!important;border-radius:999px!important;}
    .tab-btn{color:var(--joran-muted)!important;border-bottom:2px solid transparent!important;font-weight:700!important;}
    .tab-btn:hover{color:var(--joran-navy)!important;}
    .tab-btn.active{color:var(--joran-navy)!important;border-bottom-color:var(--joran-gold)!important;}
    .empty-state{color:var(--joran-muted)!important;padding:28px!important;}

    /* Enlaces */
    a{color:var(--joran-navy);}
    a:hover{color:var(--joran-gold);}

    /* Barra de actualización */
    #banner-actualizacion{border-left:4px solid var(--joran-gold)!important;background:#FFF9EC!important;color:#6B4F0A!important;border-radius:10px!important;}

    /* Responsive */
    @media(max-width:900px){
      #content-container{padding-left:14px!important;padding-right:14px!important;}
      .metrics-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    }
    @media(max-width:620px){
      .metrics-row{grid-template-columns:1fr!important;}
      .card-table,.card,.panel,.dashboard-card{border-radius:13px!important;}
      .card-table-header{padding:14px!important;}
      .btn-main,.btn-secondary,.btn-danger{min-height:42px;}
    }
  `;
  document.head.appendChild(style);
}

const DB = {
  clientes: [],
  trabajadores: [],
  seguimientos: [],
  usuarios: [],
  solicitudesInversion: [],
  pagos: [],
  alertas: [],
  notificaciones: [],
  solicitudesEdicion: [],
  solicitudesAsociacion: [],
  auditoria: [],
  capital: { total: 50000000, recuperado: 0 },
  categorias: ['Tienda de barrio', 'Panadería', 'Barbería', 'Papelería', 'Restaurante', 'Ferretería', 'Otro'],
  parametros: {
    moneda: 'COP', periodoSeguimiento: 'Semanal', metaCumplimientoMinimo: 80, nombreEmpresa: 'INVERSIONES JORAN S.A.S.',
    mesesMinimoFuncionamiento: 6, puntajeMinimoAprobacion: 70, montoMaximoInversion: 20000000,
    reglamentoTexto: 'Toda inversión debe destinarse exclusivamente al fin declarado por el cliente. El incumplimiento de compromisos o el hallazgo de información inconsistente puede derivar en la suspensión del desembolso o la liquidación anticipada del contrato.',
    politicaDatos: 'INVERSIONES JORAN S.A.S. recolecta datos personales y financieros de clientes únicamente para evaluar, aprobar y hacer seguimiento a sus inversiones. La información se almacena de forma segura, solo el personal autorizado según su rol puede consultarla o modificarla, y no se comparte con terceros sin autorización del titular, salvo requerimiento legal.'
  },
  permisos: { client: {}, worker: {}, admin: {} },
  nextId: { cliente: 1, trabajador: 1, seguimiento: 1, usuario: 1, solicitud: 1, solicitudInversion: 1, pago: 1, alerta: 1, notificacion: 1, solicitudAsociacion: 1 }
};

const SESSION_KEY = 'joran_sesion_v1';
const API_BASE = '';

let _guardadoPendiente = false;
let _guardadoEnCurso = false;
let _timerGuardadoRemoto = null;

function fechaHoyLocal() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function guardarSesionLocal() {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION)); } catch (e) {}
}
function cargarSesionLocal() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    Object.assign(SESSION, JSON.parse(raw));
    return true;
  } catch (e) { return false; }
}

const DB_CACHE_KEY = 'joran_cache_db_v1';
function guardarCacheDB() {
  try { localStorage.setItem(DB_CACHE_KEY, JSON.stringify(DB)); } catch (e) { console.warn('LocalStorage al límite.', e); }
}
function cargarCacheDB() {
  try {
    const raw = localStorage.getItem(DB_CACHE_KEY);
    if (!raw) return false;
    Object.assign(DB, JSON.parse(raw));
    return true;
  } catch (e) { return false; }
}

async function cargarEstadoRemoto() {
  try {
    const res = await fetch(API_BASE + '/api/estado');
    if (!res.ok) throw new Error('Respuesta no válida del servidor');
    const datos = await res.json();
    if (_guardadoPendiente || _guardadoEnCurso) return { ok: true, cambio: false };
    let cambio = false;
    if (datos && typeof datos === 'object' && Object.keys(datos).length) {
      const anterior = JSON.stringify(DB);
      Object.assign(DB, datos);
      cambio = JSON.stringify(DB) !== anterior;
    }
    guardarCacheDB();
    return { ok: true, cambio };
  } catch (e) { return { ok: false, cambio: false }; }
}

async function cargarEstadoRemotoConReintentos(intentos) {
  let resultado = { ok: false, cambio: false };
  for (let i = 0; i < intentos; i++) {
    resultado = await cargarEstadoRemoto();
    if (resultado.ok) return resultado;
    await new Promise(r => setTimeout(r, 1000));
  }
  return resultado;
}

function guardarEstado() {
  guardarSesionLocal();
  guardarCacheDB();
  _guardadoPendiente = true;
  clearTimeout(_timerGuardadoRemoto);
  _timerGuardadoRemoto = setTimeout(enviarEstadoRemoto, 700);
}

async function enviarEstadoRemoto() {
  if (_guardadoEnCurso) { _timerGuardadoRemoto = setTimeout(enviarEstadoRemoto, 700); return; }
  if (!_guardadoPendiente) return;
  _guardadoPendiente = false;
  _guardadoEnCurso = true;
  try {
    const res = await fetch(API_BASE + '/api/estado', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DB)
    });
    if (!res.ok) throw new Error('El servidor rechazó el guardado');
  } catch (e) {
    _guardadoPendiente = true;
  } finally {
    _guardadoEnCurso = false;
  }
}

async function actualizarDatosManual() {
  mostrarNotificacion('Buscando datos actualizados...');
  const { ok } = await cargarEstadoRemoto();
  if (ok) {
    ocultarBannerActualizacion();
    const activo = document.querySelector('.nav-link.active');
    if (activo) activo.click();
    mostrarNotificacion('Datos actualizados');
  } else {
    mostrarNotificacion('Modo local: datos cargados en este dispositivo');
  }
}

let VISTA_ACTUAL = null;
const VISTAS_SENSIBLES = ['w-inicio'];

function haySesionSegura() {
  const modalAbierto = el('modal-overlay').classList.contains('open');
  const vistaSensible = VISTAS_SENSIBLES.includes(VISTA_ACTUAL);
  return !modalAbierto && !vistaSensible;
}

function mostrarBannerActualizacion() {
  const banner = el('banner-actualizacion');
  if (banner) banner.style.display = 'flex';
}
function ocultarBannerActualizacion() {
  const banner = el('banner-actualizacion');
  if (banner) banner.style.display = 'none';
}

setInterval(async () => {
  if (_guardadoPendiente || _guardadoEnCurso) return;
  const { ok, cambio } = await cargarEstadoRemoto();
  if (!ok || !cambio) return;
  if (haySesionSegura()) {
    const activo = document.querySelector('.nav-link.active');
    if (activo) activo.click();
  } else {
    mostrarBannerActualizacion();
  }
}, 8000);

/* ---------------- Utilidades ---------------- */
function infoSemanaISO(fechaStr) {
  const d = new Date((fechaStr || '') + 'T00:00:00');
  if (isNaN(d)) return null;
  const objetivo = new Date(d.valueOf());
  const diaNr = (d.getDay() + 6) % 7;
  objetivo.setDate(objetivo.getDate() - diaNr + 3);
  const primerJueves = new Date(objetivo.getFullYear(), 0, 4);
  const diff = objetivo - primerJueves;
  const semana = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  return { anio: objetivo.getFullYear(), semana };
}
function esMismaSemanaISO(fechaStr, referencia) {
  const info = infoSemanaISO(fechaStr);
  return !!(info && referencia && info.anio === referencia.anio && info.semana === referencia.semana);
}
function semanaActualLabel() {
  const info = infoSemanaISO(fechaHoyLocal());
  return info ? `Semana ${info.semana} · ${info.anio}` : '';
}

const copFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
function formatCOP(n) { return copFormatter.format(Number(n) || 0); }

function fechaLarga(f) {
  if (!f) return '-';
  const d = new Date(f + 'T00:00:00');
  if (isNaN(d)) return f;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function estadoInfo(estado) {
  const map = {
    normal: { label: 'Normal', cls: 'badge-green', dot: 'var(--success-green)', emoji: '🟢' },
    atencion: { label: 'Atención', cls: 'badge-amber', dot: 'var(--warning-amber)', emoji: '🟡' },
    riesgo: { label: 'Riesgo', cls: 'badge-orange', dot: 'var(--risk-orange)', emoji: '🟠' },
    critico: { label: 'Crítico', cls: 'badge-red', dot: 'var(--danger-red)', emoji: '🔴' }
  };
  return map[estado] || map.normal;
}
function badgeEstado(estado) {
  const info = estadoInfo(estado);
  return `<span class="badge ${info.cls}"><span class="status-dot" style="background:${info.dot}"></span>${info.label}</span>`;
}

function getCliente(id) { return DB.clientes.find(c => c.id === Number(id)); }
function getTrabajador(id) { return DB.trabajadores.find(t => t.id === Number(id)); }
function nombreTrabajador(id) { const t = getTrabajador(id); return escapeHTML(t ? t.nombre : 'Trabajador eliminado'); }
function nombreNegocio(id) { const c = getCliente(id); return escapeHTML(c ? c.negocio.nombre : 'Negocio eliminado'); }
function seguimientosDeCliente(id) { return DB.seguimientos.filter(s => s.clienteId === Number(id)).sort((a, b) => b.fecha.localeCompare(a.fecha)); }
function seguimientosDeTrabajador(id) { return DB.seguimientos.filter(s => s.trabajadorId === Number(id)).sort((a, b) => b.fecha.localeCompare(a.fecha)); }
function ultimoSeguimiento(clienteId) { const list = seguimientosDeCliente(clienteId); return list.length ? list[0] : null; }
function escapeHTML(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function el(id) { return document.getElementById(id); }

function toggleMenuMobile(abrir) {
  const sidebar = el('app-sidebar');
  const backdrop = el('sidebar-backdrop');
  if (abrir === undefined) {
    sidebar.classList.toggle('mobile-active');
    backdrop.classList.toggle('active');
  } else {
    sidebar.classList.toggle('mobile-active', !!abrir);
    backdrop.classList.toggle('active', !!abrir);
  }
}

function registrarAuditoria(accion, detalle) {
  if (!DB.auditoria) DB.auditoria = [];
  const ahora = new Date();
  DB.auditoria.unshift({
    fecha: fechaHoyLocal(),
    hora: ahora.toTimeString().slice(0, 5),
    usuario: SESSION.usuario || 'Sistema',
    rol: SESSION.rol || '-',
    accion,
    detalle: detalle || ''
  });
  if (DB.auditoria.length > 300) DB.auditoria.length = 300;
}

function asegurarProcesoCliente(c) {
  if (!c.proceso) c.proceso = {};
  if (!c.proceso.requisitos) c.proceso.requisitos = { antiguedad: false, documentacion: false, evidenciaVentas: false, estadosFinancieros: false, referencias: false, visitaTrabajador: false, evaluacionRiesgo: false };
  if (!c.proceso.etapas) c.proceso.etapas = { contrato: false, desembolso: false, seguimientoSemanal: false, reporte: false, liquidacion: false, revisionMensual: false };
  return c.proceso;
}
function mesesDesde(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr + 'T00:00:00');
  if (isNaN(d)) return null;
  const hoy = new Date();
  return Math.max(0, (hoy.getFullYear() - d.getFullYear()) * 12 + (hoy.getMonth() - d.getMonth()));
}

function mostrarNotificacion(msg, esError) {
  const toast = el('toast');
  el('toast-msg').innerText = msg;
  toast.classList.toggle('toast-error', !!esError);
  toast.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.style.display = 'none', 3200);
}

function openModal(titleHtml, bodyHtml) {
  el('modal-box').innerHTML = `
    <div class="modal-header">
      <h3>${titleHtml}</h3>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    ${bodyHtml}`;
  el('modal-overlay').classList.add('open');
}
function closeModal() { el('modal-overlay').classList.remove('open'); guardarEstado(); }
function handleModalOverlayClick(e) { if (e.target === el('modal-overlay')) closeModal(); }
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

let _accionConfirmarPendiente = null;
function confirmarAccion(mensaje, callback) {
  _accionConfirmarPendiente = callback;
  openModal('Confirmar acción', `
    <p style="font-size:.88rem;color:#334155;margin-bottom:20px;">${escapeHTML(mensaje)}</p>
    <div style="display:flex;justify-content:flex-end;gap:10px;">
      <button class="btn-secondary" onclick="_accionConfirmarPendiente=null; closeModal();">Cancelar</button>
      <button class="btn-danger" onclick="ejecutarAccionConfirmada()">Sí, continuar</button>
    </div>
  `);
}
function ejecutarAccionConfirmada() {
  const cb = _accionConfirmarPendiente;
  _accionConfirmarPendiente = null;
  closeModal();
  if (cb) cb();
}

function switchTab(groupId, tabId, btn) {
  document.querySelectorAll(`[data-tabgroup="${groupId}"]`).forEach(elx => elx.classList.remove('active'));
  const target = el(tabId);
  if (target) target.classList.add('active');
  if (btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

function crearGraficoSeguro(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return null;
  if (CHARTS[canvasId]) {
    CHARTS[canvasId].destroy();
  }
  CHARTS[canvasId] = new Chart(ctx, config);
  return CHARTS[canvasId];
}

/* ---------------- LOGIN ---------------- */
function hayAdminRegistrado() {
  return DB.usuarios.some(u => u.rol === 'admin');
}

function handleRolChange() {
  const rol = el('selectRol').value;
  const grupo = el('grupo-entidad');
  const label = el('label-entidad');
  const select = el('selectEntidad');
  const inputUsuario = el('inputUsuario');
  ocultarErrorLogin();

  const candidatos = DB.usuarios.filter(u => u.rol === rol && u.activo);

  if (rol === 'admin' && !hayAdminRegistrado()) {
    grupo.style.display = 'none';
    inputUsuario.value = 'Administrador';
    return;
  }

  grupo.style.display = 'block';
  label.innerText = rol === 'client' ? 'Seleccione su usuario (negocio)' : rol === 'worker' ? 'Seleccione su usuario' : 'Seleccione su usuario administrador';
  select.innerHTML = candidatos.length
    ? candidatos.map(u => `<option value="${u.id}">${escapeHTML(u.nombre)}${u.entidadNombre && u.entidadNombre !== '-' ? ' — ' + escapeHTML(u.entidadNombre) : ''}</option>`).join('')
    : `<option value="">No hay usuarios activos con este rol</option>`;
  select.onchange = () => {
    const u = DB.usuarios.find(x => x.id === Number(select.value));
    inputUsuario.value = u ? u.nombre : '';
  };
  const primero = DB.usuarios.find(x => x.id === Number(select.value));
  inputUsuario.value = primero ? primero.nombre : (candidatos[0] ? candidatos[0].nombre : '');
}

function togglePassword() {
  const pass = el('inputPassword');
  const eye = el('password-eye');
  const isHidden = pass.type === 'password';
  pass.type = isHidden ? 'text' : 'password';
  eye.classList.toggle('fa-eye', !isHidden);
  eye.classList.toggle('fa-eye-slash', isHidden);
}

function mostrarErrorLogin(msg) {
  const box = el('login-error');
  box.innerText = msg;
  box.classList.add('show');
}
function ocultarErrorLogin() {
  el('login-error').classList.remove('show');
}

async function realizarLogin(e) {
  e.preventDefault();
  ocultarErrorLogin();
  const rol = el('selectRol').value;
  const password = el('inputPassword').value;
  const btn = el('btn-login');

  if (!rol) { mostrarErrorLogin('Seleccione un rol para continuar.'); return; }
  if (!password) { mostrarErrorLogin('Ingrese su contraseña.'); return; }

  btn.disabled = true;
  await cargarEstadoRemoto();
  btn.disabled = false;

  const modoBootstrap = rol === 'admin' && !hayAdminRegistrado();

  if (!modoBootstrap) {
    const entidadId = el('selectEntidad').value ? Number(el('selectEntidad').value) : null;
    if (!entidadId) { mostrarErrorLogin('Seleccione su usuario en la lista.'); return; }
    const usuario = DB.usuarios.find(u => u.id === entidadId && u.rol === rol);
    if (!usuario || !usuario.activo) { mostrarErrorLogin('Este usuario no existe o está desactivado. Contacte al administrador.'); return; }
    if (usuario.password !== password) { mostrarErrorLogin('Contraseña incorrecta.'); return; }

    SESSION.rol = rol;
    SESSION.usuario = usuario.nombre;
    SESSION.usuarioId = usuario.id;
    SESSION.clienteId = rol === 'client' ? usuario.entidadId : null;
    SESSION.trabajadorId = rol === 'worker' ? usuario.entidadId : null;
    if (rol === 'client' && !getCliente(SESSION.clienteId)) { mostrarErrorLogin('Este usuario ya no tiene un negocio asociado.'); return; }
    if (rol === 'worker' && !getTrabajador(SESSION.trabajadorId)) { mostrarErrorLogin('Este usuario ya no tiene un perfil de trabajador asociado.'); return; }
  } else {
    SESSION.rol = 'admin';
    SESSION.usuario = 'Administrador';
    SESSION.usuarioId = null;
    SESSION.clienteId = null;
    SESSION.trabajadorId = null;
  }
  SESSION.vista = null;

  el('view-login').style.display = 'none';
  el('view-app').style.display = 'grid';
  el('header-user-name').innerText = SESSION.usuario;
  el('header-avatar-initials').innerText = SESSION.usuario.substring(0, 2).toUpperCase();

  if (rol === 'client') initClienteUI();
  else if (rol === 'worker') initTrabajadorUI();
  else if (rol === 'admin') initAdminUI();

  guardarSesionLocal();
  el('inputPassword').value = '';
  registrarAuditoria('Inicio de sesión', `Rol: ${nombreRol(rol)}${modoBootstrap ? ' (modo inicial)' : ''}`);
  guardarEstado();
  mostrarNotificacion(modoBootstrap ? 'Sesión iniciada. Recuerda crear tu propia cuenta en Configuración → Usuarios.' : 'Sesión iniciada con éxito');
}

function cerrarSesion() {
  if (SESSION.rol) registrarAuditoria('Cierre de sesión', `Rol: ${nombreRol(SESSION.rol)}`);
  el('view-app').style.display = 'none';
  el('view-login').style.display = 'flex';
  el('content-container').innerHTML = '';
  el('form-login').reset();
  el('grupo-entidad').style.display = 'none';
  ocultarErrorLogin();
  SESSION.rol = null; SESSION.usuario = null; SESSION.usuarioId = null; SESSION.clienteId = null; SESSION.trabajadorId = null; SESSION.vista = null;
  guardarEstado();
  mostrarNotificacion('Sesión finalizada');
}

function setMenu(items) {
  const menu = el('menuLateral');
  menu.innerHTML = items.map((it, i) =>
    `<li><a class="nav-link${i === 0 ? ' active' : ''}" data-id="${it.id}" onclick="navegar('${it.id}', this)"><i class="fa-solid ${it.icon}"></i> ${it.label}</a></li>`
  ).join('');
}

let CURRENT_ROLE_ROUTES = {};
function navegar(id, elx) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (elx) elx.classList.add('active');
  const route = CURRENT_ROLE_ROUTES[id];
  if (!route) { mostrarNotificacion('Módulo en construcción'); return; }
  VISTA_ACTUAL = id;
  SESSION.vista = id;
  el('titulo-pagina').innerText = route.titulo;
  el('content-container').innerHTML = route.render();
  if (route.after) route.after();
  ocultarBannerActualizacion();
  toggleMenuMobile(false);
  guardarSesionLocal();
}

function navegarInicial(defaultId) {
  const destino = (SESSION.vista && CURRENT_ROLE_ROUTES[SESSION.vista]) ? SESSION.vista : defaultId;
  const linkDestino = document.querySelector(`#menuLateral .nav-link[data-id="${destino}"]`);
  navegar(destino, linkDestino);
}

function mostrarCargaInicial(mostrar) {
  const overlay = el('loading-overlay');
  if (overlay) overlay.style.display = mostrar ? 'flex' : 'none';
}

async function iniciarApp() {
  cargarSesionLocal();
  mostrarCargaInicial(true);
  cargarCacheDB();
  const { ok } = await cargarEstadoRemotoConReintentos(2);
  asegurarDatosNuevos();
  mostrarCargaInicial(false);

  const sesionValida = SESSION.rol && (
    (SESSION.rol === 'client' && getCliente(SESSION.clienteId)) ||
    (SESSION.rol === 'worker' && getTrabajador(SESSION.trabajadorId)) ||
    (SESSION.rol === 'admin' && (SESSION.usuarioId === null ? !hayAdminRegistrado() : DB.usuarios.some(u => u.id === SESSION.usuarioId && u.activo)))
  );

  if (sesionValida) {
    el('view-login').style.display = 'none';
    el('view-app').style.display = 'grid';
    el('header-user-name').innerText = SESSION.usuario || '';
    el('header-avatar-initials').innerText = (SESSION.usuario || 'US').substring(0, 2).toUpperCase();
    if (SESSION.rol === 'client') initClienteUI();
    else if (SESSION.rol === 'worker') initTrabajadorUI();
    else if (SESSION.rol === 'admin') initAdminUI();
    if (!ok) mostrarNotificacion('Mostrando última información local guardada.');
  } else {
    SESSION.rol = null; SESSION.usuario = null; SESSION.usuarioId = null; SESSION.clienteId = null; SESSION.trabajadorId = null;
  }
  setInterval(guardarSesionLocal, 2000);
  window.addEventListener('beforeunload', guardarSesionLocal);
}
document.addEventListener('DOMContentLoaded', () => { aplicarTemaJoran(); iniciarApp(); });

/* =========================================================
   CLIENTE
   ========================================================= */
function initClienteUI() {
  el('header-user-role').innerText = 'Cliente JORAN';
  const c = getCliente(SESSION.clienteId);
  if (!c) {
    el('menuLateral').innerHTML = '';
    el('titulo-pagina').innerText = 'Portal del Cliente';
    el('content-container').innerHTML = `<div class="card-table"><div class="empty-state">No se encontró información de tu negocio. Contacta a tu asesor.</div></div>`;
    return;
  }
  setMenu([
    { id: 'c-inicio', label: 'Inicio', icon: 'fa-house' },
    { id: 'c-negocio', label: 'Mi Negocio', icon: 'fa-store' },
    { id: 'c-inversion', label: 'Mi Inversión', icon: 'fa-hand-holding-dollar' },
    { id: 'c-finanzas', label: 'Mis Finanzas', icon: 'fa-wallet' },
    { id: 'c-metas', label: 'Mis Metas', icon: 'fa-bullseye' },
    { id: 'c-seguimientos', label: 'Seguimientos', icon: 'fa-list-check' },
    { id: 'c-perfil', label: 'Mi Perfil', icon: 'fa-user' },
    { id: 'c-notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
    { id: 'c-asociacion', label: 'Quiero asociarme', icon: 'fa-handshake' }
  ]);
  CURRENT_ROLE_ROUTES = {
    'c-inicio': { titulo: `Portal del Cliente - ${c.negocio.nombre}`, render: () => renderClienteInicio(c) },
    'c-negocio': { titulo: 'Mi Negocio', render: () => renderClienteNegocio(c) },
    'c-inversion': { titulo: 'Mi Inversión', render: () => renderClienteInversion(c) },
    'c-finanzas': { titulo: 'Mis Finanzas', render: () => renderClienteFinanzas(c) },
    'c-metas': { titulo: 'Mis Metas', render: () => renderClienteMetas(c) },
    'c-seguimientos': { titulo: 'Historial de Seguimientos', render: () => renderClienteSeguimientos(c) },
    'c-perfil': { titulo: 'Mi Perfil', render: () => renderClientePerfil(c) },
    'c-notificaciones': { titulo: 'Mis Notificaciones', render: () => renderNotificacionesSesion() },
    'c-asociacion': { titulo: 'Quiero asociarme', render: () => renderClienteAsociacion(c) }
  };
  navegarInicial('c-inicio');
}

function renderClienteInicio(c) {
  const r = c.resultados;
  return `
  <div style="background:linear-gradient(135deg,var(--navy-deep),var(--navy));color:#fff;padding:24px;border-radius:12px;margin-bottom:24px;border-left:5px solid var(--gold);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
    <div>
      <h3 style="font-size:1.2rem;margin-bottom:6px;">¡Bienvenido, ${escapeHTML(c.nombre.split(' ')[0])}!</h3>
      <p style="font-size:.86rem;color:#c7d2e3;">Este es el estado actual de ${escapeHTML(c.negocio.nombre)} y el seguimiento de JORAN.</p>
    </div>
    <div>${badgeEstado(c.estado)}</div>
  </div>
  <div class="metrics-row">
    ${metricCard('fa-chart-line', 'var(--success-bg)', 'var(--success-green)', 'Ventas del Mes', formatCOP(r.ventas))}
    ${metricCard('fa-receipt', 'var(--danger-bg)', 'var(--danger-red)', 'Gastos', formatCOP(r.gastos))}
    ${metricCard('fa-wallet', 'var(--success-bg)', 'var(--success-green)', 'Utilidad', formatCOP(r.utilidad))}
    ${metricCard('fa-boxes-stacked', '#eef1f5', '#475569', 'Inventario', formatCOP(r.inventario))}
  </div>
  <div class="metrics-row">
    ${metricCard('fa-money-bill-transfer', 'var(--warning-bg)', 'var(--warning-amber)', 'Deudas', formatCOP(r.deudas))}
    ${metricCard('fa-bullseye', '#e6ecf7', 'var(--navy)', 'Meta Mensual', formatCOP(r.metas), r.metas ? (Math.min(999, (r.ventas / r.metas) * 100)).toFixed(1) + '% cumplido' : null, 'var(--navy)')}
    ${metricCard('fa-hand-holding-dollar', '#f6ecd0', 'var(--warning-amber)', 'Capital Recibido', formatCOP(c.inversion.recibido), c.inversion.tipo || null, 'var(--text-muted)')}
    ${metricCard('fa-list-check', '#eef1f5', '#475569', 'Últ. Seguimiento', fechaLarga((ultimoSeguimiento(c.id) || {}).fecha), ultimoSeguimiento(c.id) ? 'Estado: ' + estadoInfo((ultimoSeguimiento(c.id) || { estado: 'normal' }).estado).label : null, 'var(--text-muted)')}
  </div>`;
}

function metricCard(icon, bg, color, label, value, sub, subcolor) {
  return `<div class="metric-card"><div><p>${label}</p><h2>${value}</h2>${sub ? `<small style="color:${subcolor||'var(--text-muted)'};font-size:.74rem;">${escapeHTML(sub)}</small>` : ''}</div><div class="metric-icon" style="background:${bg};color:${color};"><i class="fa-solid ${icon}"></i></div></div>`;
}

function renderClienteNegocio(c) {
  const n = c.negocio;
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Datos del Cliente</h3></div>
    <div class="form-grid-3">
      ${field('Nombre completo', c.nombre)}
      ${field('Documento', c.documento)}
      ${field('Teléfono', c.telefono)}
    </div>
    <div class="form-grid-2">
      ${field('Correo', c.correo)}
      ${field('Dirección', c.direccion)}
    </div>
  </div>
  <div class="card-table">
    <div class="card-table-header">
      <h3>Datos del Negocio</h3>
      <button class="btn-secondary" onclick="abrirModalSolicitarEdicion(${c.id})"><i class="fa-solid fa-pen"></i> Solicitar edición</button>
    </div>
    <div class="form-grid-3">
      ${field('Nombre del negocio', n.nombre)}
      ${field('Tipo de negocio', n.tipo)}
      ${field('Ciudad', n.ciudad)}
    </div>
    <div class="form-grid-3">
      ${field('Dirección', n.direccion)}
      ${field('Fecha de inicio', fechaLarga(n.fechaInicio))}
      ${field('Número de empleados', n.empleados)}
    </div>
    <div class="field"><label>Descripción</label><p style="font-size:.88rem;color:#334155;">${escapeHTML(n.descripcion)}</p></div>
  </div>
  ${renderSolicitudesCliente(c.id)}`;
}

const SOLICITUD_MAX_CHARS = 500;
function abrirModalSolicitarEdicion(clienteId) {
  openModal('Solicitar Edición de Datos del Negocio', `
    <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:12px;">Describe el cambio que deseas solicitar a la administración de JORAN.</p>
    <div class="field" style="margin-bottom:6px;">
      <label>Detalle de la solicitud</label>
      <textarea class="form-control" rows="4" id="se-mensaje" maxlength="${SOLICITUD_MAX_CHARS}" oninput="el('se-contador').innerText = this.value.length + '/${SOLICITUD_MAX_CHARS}'" placeholder="Ej: Actualizar dirección del negocio, corregir número de empleados..."></textarea>
      <div style="text-align:right;font-size:.7rem;color:var(--text-muted);margin-top:3px;" id="se-contador">0/${SOLICITUD_MAX_CHARS}</div>
    </div>
    <button class="btn-main" onclick="enviarSolicitudEdicion(${clienteId})"><i class="fa-solid fa-paper-plane"></i> Enviar Solicitud</button>
  `);
}

function enviarSolicitudEdicion(clienteId) {
  const mensaje = el('se-mensaje').value.trim();
  if (!mensaje) { mostrarNotificacion('Describe el cambio que deseas solicitar', true); return; }
  if (mensaje.length > SOLICITUD_MAX_CHARS) { mostrarNotificacion(`Máximo ${SOLICITUD_MAX_CHARS} caracteres`, true); return; }
  const hayPendiente = DB.solicitudesEdicion.some(s => s.clienteId === clienteId && s.estado === 'Pendiente');
  if (hayPendiente) { mostrarNotificacion('Ya tienes una solicitud pendiente de respuesta.', true); return; }
  const c = getCliente(clienteId);
  DB.solicitudesEdicion.push({
    id: DB.nextId.solicitud++,
    clienteId,
    clienteNombre: c ? c.nombre : 'Cliente',
    negocioNombre: c ? c.negocio.nombre : '-',
    mensaje,
    fecha: fechaHoyLocal(),
    estado: 'Pendiente',
    respuesta: '',
    fechaRespuesta: null
  });
  crearNotificacion('admin', null, 'Solicitud de edición', `${c.negocio.nombre} solicitó actualizar sus datos.`, 'solicitud');
  closeModal();
  guardarEstado();
  mostrarNotificacion('Solicitud enviada al Administrador');
  navegar('c-negocio');
}

function renderSolicitudesCliente(clienteId) {
  const list = DB.solicitudesEdicion.filter(s => s.clienteId === clienteId).sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (!list.length) return '';
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Mis Solicitudes de Edición</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Solicitud</th><th>Estado</th><th>Respuesta</th></tr></thead>
      <tbody>
        ${list.map(s => `<tr>
          <td>${fechaLarga(s.fecha)}</td>
          <td>${escapeHTML(s.mensaje)}</td>
          <td>${s.estado === 'Pendiente' ? '<span class="badge badge-amber">Pendiente</span>' : '<span class="badge badge-green">Atendida</span>'}</td>
          <td>${s.respuesta ? escapeHTML(s.respuesta) : '<span style="color:var(--text-muted);">Sin respuesta aún</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;
}

function field(label, value, esHTML) {
  const vacio = value === undefined || value === null || value === '';
  const seguro = vacio ? '-' : (esHTML ? value : escapeHTML(value));
  return `<div class="field"><label>${label}</label><p style="font-size:.88rem;color:#334155;font-weight:600;">${seguro}</p></div>`;
}

function renderClienteInversion(c) {
  const i = c.inversion;
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Información de Inversión JORAN</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-main" onclick="abrirModalSolicitarInversionCliente(${c.id})"><i class="fa-solid fa-hand-holding-dollar"></i> ${c.inversion.aprobado ? 'Solicitar otra inversión' : 'Solicitar inversión'}</button>
        <button class="btn-secondary" onclick="verContratoInversion(${c.id})"><i class="fa-solid fa-file-contract"></i> Ver Contrato de Inversión</button>
      </div>
    </div>
    <div class="form-grid-3">
      ${field('Capital solicitado', formatCOP(i.solicitado))}
      ${field('Capital aprobado', formatCOP(i.aprobado))}
      ${field('Capital recibido', formatCOP(i.recibido))}
    </div>
    <div class="form-grid-3">
      ${field('Fecha de inversión', fechaLarga(i.fecha))}
      ${field('Tipo de inversión', i.tipo)}
      ${field('Participación de JORAN', i.participacion + '%')}
    </div>
    <div class="form-grid-2">
      ${field('Estado de la inversión', i.estado)}
      ${field('Rentabilidad acumulada', i.rentabilidad + '%')}
    </div>
    <div class="field"><label>Destino de la inversión</label><p style="font-size:.88rem;color:#334155;">${escapeHTML(i.destino)}</p></div>
  </div>
  <div class="card-table">
    <div class="card-table-header"><h3>Estado de Solicitudes de Inversión</h3></div>
    ${renderEstadoSolicitudesCliente(c.id)}
  </div>
  ${renderNotificacionesSesion()}`;
}

/* =========================================================
   CONTRATO DE INVERSIÓN - Vista formateada (pestaña nueva)
   ========================================================= */
function lineaOGuion(v) {
  const vacio = v === undefined || v === null || v === '';
  return vacio ? '<span class="linea-vacia"></span>' : escapeHTML(v);
}

function seccionContrato(numero, titulo, contenidoHtml) {
  return `
  <div class="cn-seccion">
    <div class="cn-seccion-titulo"><span class="cn-numero">${numero}</span> ${escapeHTML(titulo)}</div>
    <div class="cn-seccion-cuerpo">${contenidoHtml}</div>
  </div>`;
}

const FIRMA_REPRESENTANTE_JORAN = 'data:image/png;base64,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';
const REPRESENTANTE_JORAN = {
  nombre: 'José Coronado',
  documento: '1042851914',
  cargo: 'Representante Legal'
};

function generarContratoHTML(c) {
  const i = c.inversion;
  const p = DB.parametros;
  const hoy = fechaLarga(fechaHoyLocal());

  const col1 = [
    seccionContrato(1, 'Identificación de las Partes', `
      <div class="cn-partes">
        <div class="cn-parte">
          <b>INVERSIONES JORAN</b>
          <p>Nombre: ${lineaOGuion(p.nombreEmpresa)}</p>
          <p>Representante: <b>${lineaOGuion(REPRESENTANTE_JORAN.nombre)}</b></p>
          <p>C.C. N.°: <b>${lineaOGuion(REPRESENTANTE_JORAN.documento)}</b></p>
        </div>
        <div class="cn-parte">
          <b>EL PROPIETARIO</b>
          <p>Nombre: ${lineaOGuion(c.nombre)}</p>
          <p>C.C. N.°: ${lineaOGuion(c.documento)}</p>
          <p>Dirección: ${lineaOGuion(c.direccion)}</p>
          <p>Teléfono: ${lineaOGuion(c.telefono)}</p>
        </div>
      </div>`),
    seccionContrato(2, 'Objeto del Contrato', `
      <p>JORAN se compromete a realizar una inversión en el negocio descrito en este contrato, con el fin de fortalecer su operación y crecimiento. A cambio, el propietario otorgará a JORAN una participación en las utilidades, según lo establecido en este documento.</p>`),
    seccionContrato(3, 'Información del Negocio', `
      <table class="cn-tabla">
        <tr><td>Nombre del negocio:</td><td>${lineaOGuion(c.negocio.nombre)}</td></tr>
        <tr><td>Actividad económica:</td><td>${lineaOGuion(c.negocio.tipo)}</td></tr>
        <tr><td>Dirección:</td><td>${lineaOGuion(c.negocio.direccion)}</td></tr>
        <tr><td>Teléfono:</td><td>${lineaOGuion(c.telefono)}</td></tr>
        <tr><td>Antigüedad del negocio:</td><td>${c.negocio.fechaInicio ? fechaLarga(c.negocio.fechaInicio) : '<span class="linea-vacia"></span>'}</td></tr>
        <tr><td>Monto de la inversión por parte de JORAN:</td><td>${formatCOP(i.aprobado)}</td></tr>
      </table>`),
    seccionContrato(4, 'Monto y Destino del Capital', `
      <p>El capital aportado por JORAN será de: <b>${formatCOP(i.aprobado)}</b>.</p>
      <p>El cual será destinado a: ${lineaOGuion(i.destino)}</p>
      <p>El desembolso se realizará el día: ${i.fecha ? fechaLarga(i.fecha) : '<span class="linea-vacia"></span>'}.</p>`),
    seccionContrato(5, 'Participación en las Utilidades', `
      <p>JORAN recibirá el <b>${i.participacion || 0}%</b> (${numeroALetraPorciento(i.participacion)}) de las utilidades netas generadas por el negocio, siempre y cuando este sea el modelo comercial acordado entre las partes.</p>
      <p>La utilidad neta se calculará restando de los ingresos todos los costos, gastos, impuestos y demás egresos del negocio.</p>`),
    seccionContrato(6, 'Seguimiento Semanal', `
      <p>JORAN realizará un seguimiento semanal del negocio a través del trabajador asignado, quien registrará la información en la plataforma de gestión. El propietario se compromete a facilitar el acceso a la información y a permitir las visitas de seguimiento.</p>`)
  ].join('');

  const col2 = [
    seccionContrato(7, 'Obligaciones del Propietario', `
      <ul>
        <li>Administrar el negocio de forma responsable y eficiente.</li>
        <li>Permitir el seguimiento semanal por parte del trabajador de JORAN.</li>
        <li>Entregar la información financiera y operativa solicitada.</li>
        <li>Facilitar el acceso a la documentación del negocio.</li>
        <li>Informar oportunamente cualquier novedad, problema o riesgo.</li>
      </ul>`),
    seccionContrato(8, 'Obligaciones de JORAN', `
      <ul>
        <li>Realizar el desembolso del capital acordado.</li>
        <li>Hacer seguimiento semanal al negocio.</li>
        <li>Brindar acompañamiento y asesoría para el fortalecimiento del negocio.</li>
        <li>Registrar toda la información en la plataforma de gestión.</li>
        <li>Mantener la confidencialidad de la información.</li>
      </ul>`),
    seccionContrato(9, 'Manejo de Pérdidas y Riesgos', `
      <p>Si el negocio genera pérdidas, JORAN no estará obligado a recibir utilidades hasta que se recuperen las pérdidas o se acuerde una nueva estrategia. En caso de pérdidas continuas o incumplimiento, las partes podrán revisar el contrato y definir la terminación del acuerdo o la reestructuración de la inversión.</p>`),
    seccionContrato(10, 'Vigencia y Terminación', `
      <p>El presente contrato tendrá una duración de <span class="linea-vacia corta"></span> meses, comenzando el día ${i.fecha ? fechaLarga(i.fecha) : '<span class="linea-vacia"></span>'}. Podrá terminarse por mutuo acuerdo, incumplimiento de alguna de las partes o por las causales establecidas en este contrato.</p>`),
    seccionContrato(11, 'Confidencialidad y Protección de Datos', `
      <p>Las partes se comprometen a mantener la información del negocio, de los datos personales y de la operación de la inversión en estricta confidencialidad, y a utilizarla únicamente para los fines de este contrato, de acuerdo con la normativa vigente en protección de datos.</p>`),
    seccionContrato(12, 'Solución de Controversias', `
      <p>En caso de diferencias, las partes buscarán una solución de mutuo acuerdo. Si no es posible, se someterán a un mecanismo de conciliación o, en su defecto, a la jurisdicción ordinaria colombiana.</p>`),
    seccionContrato(13, 'Aceptación y Firmas', `
      <p>Las partes declaran haber leído, entendido y aceptado el contenido de este contrato, y lo firman en señal de conformidad.</p>
      <p>Fecha de firma: <span class="linea-vacia corta"></span></p>`)
  ].join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato de Inversión — ${escapeHTML(c.negocio.nombre)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root{--navy-deep:#071427;--navy:#0d2340;--navy-mid:#123055;--gold:#c9a227;--gold-light:#e0c05a;--text-main:#1c2733;--text-muted:#64748b;--border-color:#dbe2ea;}
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;}
  body{background:#e9edf3;color:var(--text-main);padding:26px 14px 60px;}
  .cn-toolbar{position:sticky;top:0;max-width:900px;margin:0 auto 16px;display:flex;justify-content:flex-end;gap:10px;z-index:10;}
  .cn-toolbar button{background:var(--navy);color:var(--gold-light);border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;font-size:.85rem;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);}
  .cn-toolbar button:hover{background:var(--navy-mid);}
  .cn-toolbar button.secundario{background:#fff;color:var(--navy);border:1px solid var(--border-color);}
  .cn-hoja{max-width:900px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 20px 50px rgba(7,20,39,.18);position:relative;}
  .cn-esquina{position:absolute;top:0;width:120px;height:120px;background:var(--navy-deep);}
  .cn-esquina::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent 48%,var(--gold) 49%,var(--gold) 51%,transparent 52%);}
  .cn-esquina.izq{left:0;clip-path:polygon(0 0,100% 0,0 100%);}
  .cn-esquina.der{right:0;clip-path:polygon(100% 0,100% 100%,0 0);}
  .cn-membrete{padding:34px 30px 20px;text-align:center;position:relative;}
  .cn-logo{width:64px;height:64px;border-radius:50%;margin:0 auto 10px;background:linear-gradient(160deg,var(--navy-mid),var(--navy-deep));border:2px solid var(--gold);color:var(--gold);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem;}
  .cn-membrete h1{color:var(--navy);font-size:1.05rem;letter-spacing:2px;font-weight:800;}
  .cn-membrete .cn-sub{color:var(--text-muted);font-size:.72rem;letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
  .cn-titulo-banner{background:linear-gradient(120deg,var(--navy-deep),var(--navy));color:#fff;text-align:center;padding:16px 20px;margin:0 24px 22px;border-radius:10px;border-bottom:4px solid var(--gold);}
  .cn-titulo-banner h2{font-size:1.35rem;letter-spacing:1px;font-weight:800;}
  .cn-titulo-banner span{font-size:.78rem;color:var(--gold-light);letter-spacing:2px;text-transform:uppercase;}
  .cn-intro{padding:0 30px 20px;font-size:.86rem;line-height:1.6;color:#334155;}
  .cn-cuerpo{display:grid;grid-template-columns:1fr 1fr;gap:0 22px;padding:0 24px 10px;}
  .cn-seccion{margin-bottom:16px;}
  .cn-seccion-titulo{background:var(--navy);color:#fff;font-size:.78rem;font-weight:800;letter-spacing:.3px;padding:8px 12px;border-radius:6px;display:flex;align-items:center;gap:8px;text-transform:uppercase;}
  .cn-numero{background:var(--gold);color:var(--navy-deep);width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;flex-shrink:0;}
  .cn-seccion-cuerpo{font-size:.8rem;line-height:1.55;color:#334155;padding:9px 4px 0;}
  .cn-seccion-cuerpo p{margin-bottom:6px;}
  .cn-seccion-cuerpo ul{padding-left:18px;}
  .cn-seccion-cuerpo li{margin-bottom:4px;}
  .cn-tabla{width:100%;border-collapse:collapse;font-size:.8rem;}
  .cn-tabla td{padding:4px 6px;border-bottom:1px solid var(--border-color);}
  .cn-tabla td:first-child{color:var(--text-muted);font-weight:600;width:58%;}
  .cn-partes{display:flex;flex-direction:column;gap:10px;}
  .cn-parte b{color:var(--navy);display:block;margin-bottom:3px;font-size:.78rem;}
  .cn-parte p{font-size:.8rem;margin-bottom:2px;}
  .linea-vacia{display:inline-block;min-width:140px;border-bottom:1px solid #94a3b8;}
  .linea-vacia.corta{min-width:70px;}
  .cn-firmas{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:10px 24px 30px;}
  .cn-firma-box{background:#f8fafc;border:1px solid var(--border-color);border-radius:10px;padding:16px;}
  .cn-firma-box h4{color:var(--navy);font-size:.78rem;text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px;border-bottom:2px solid var(--gold);padding-bottom:6px;display:inline-block;}
  .cn-firma-box p{font-size:.78rem;margin-bottom:16px;color:#334155;}
  .cn-firma-imagen{display:block;width:150px;height:62px;object-fit:contain;object-position:left bottom;margin:-2px 0 2px 0;}
  .cn-firma-datos{line-height:1.65;}
  .cn-firma-linea{border-top:1px solid #334155;margin-top:26px;padding-top:5px;font-size:.72rem;color:var(--text-muted);text-align:center;}
  .cn-pie{text-align:center;font-size:.68rem;color:var(--text-muted);padding:0 24px 26px;}
  @media(max-width:720px){.cn-cuerpo{grid-template-columns:1fr;}.cn-firmas{grid-template-columns:1fr;}}
  @media print{
    body{background:#fff;padding:0;}
    .cn-toolbar{display:none;}
    .cn-hoja{box-shadow:none;border-radius:0;max-width:100%;}
    .cn-cuerpo{grid-template-columns:1fr 1fr;}
  }
</style>
</head>
<body>
  <div class="cn-toolbar">
    <button class="secundario" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar</button>
    <button onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir / Guardar como PDF</button>
  </div>
  <div class="cn-hoja">
    <div class="cn-esquina izq"></div>
    <div class="cn-esquina der"></div>
    <div class="cn-membrete">
      <div class="cn-logo">JR</div>
      <h1>JORAN INVERSIONES</h1>
      <div class="cn-sub">Plataforma de gestión PyMEs</div>
    </div>
    <div class="cn-titulo-banner">
      <h2>CONTRATO DE INVERSIÓN</h2>
      <span>Inversiones Joran</span>
    </div>
    <div class="cn-intro">
      Entre los suscritos, por una parte, <b>INVERSIONES JORAN</b>, en adelante "<b>JORAN</b>", y por la otra, el/la señor(a)
      <b>${lineaOGuion(c.nombre)}</b>, identificado(a) con cédula de ciudadanía N.° <b>${lineaOGuion(c.documento)}</b>,
      en adelante "<b>EL PROPIETARIO</b>", acuerdan celebrar el presente Contrato de Inversión, bajo las siguientes condiciones:
    </div>
    <div class="cn-cuerpo">
      <div>${col1}</div>
      <div>${col2}</div>
    </div>
    <div class="cn-firmas">
      <div class="cn-firma-box">
        <h4>Por Inversiones Joran</h4>
        <img class="cn-firma-imagen" src="${FIRMA_REPRESENTANTE_JORAN}" alt="Firma de José Coronado">
        <p class="cn-firma-datos">Nombre: <b>${lineaOGuion(REPRESENTANTE_JORAN.nombre)}</b><br>C.C. N.°: <b>${lineaOGuion(REPRESENTANTE_JORAN.documento)}</b><br>Cargo: <b>${lineaOGuion(REPRESENTANTE_JORAN.cargo)}</b></p>
        <div class="cn-firma-linea">Firma del representante legal</div>
      </div>
      <div class="cn-firma-box">
        <h4>El Propietario</h4>
        <p>Nombre: ${lineaOGuion(c.nombre)}<br><br>C.C. N.°: ${lineaOGuion(c.documento)}<br><br>Dirección: ${lineaOGuion(c.direccion)}</p>
        <div class="cn-firma-linea">Firma</div>
      </div>
    </div>
    <div class="cn-pie">Documento generado por la plataforma de INVERSIONES JORAN el ${hoy}. Este documento es una vista previa del contrato y debe ser revisado antes de su firma.</div>
  </div>
</body>
</html>`;
}

function numeroALetraPorciento(n) {
  const num = Number(n) || 0;
  const unidades = ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte'];
  if (num >= 0 && num <= 20) return `${unidades[num]} por ciento`;
  return `${num} por ciento`;
}

function verContratoInversion(clienteId) {
  const c = getCliente(clienteId);
  if (!c) { mostrarNotificacion('No se encontró información del cliente', true); return; }
  const html = generarContratoHTML(c);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, '_blank');
  if (!ventana) {
    mostrarNotificacion('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para ver el contrato.', true);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function renderClienteFinanzas(c) {
  const r = c.resultados;
  const hist = seguimientosDeCliente(c.id);
  const pagos = DB.pagos.filter(x => x.clienteId === c.id);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Resultados Actuales del Negocio</h3></div>
    <div class="metrics-row">
      ${metricCard('fa-chart-line', 'var(--success-bg)', 'var(--success-green)', 'Ventas', formatCOP(r.ventas))}
      ${metricCard('fa-receipt', 'var(--danger-bg)', 'var(--danger-red)', 'Gastos', formatCOP(r.gastos))}
      ${metricCard('fa-wallet', 'var(--success-bg)', 'var(--success-green)', 'Utilidad', formatCOP(r.utilidad))}
      ${metricCard('fa-boxes-stacked', '#eef1f5', '#475569', 'Inventario', formatCOP(r.inventario))}
      ${metricCard('fa-money-bill-transfer', 'var(--warning-bg)', 'var(--warning-amber)', 'Deudas', formatCOP(r.deudas))}
      ${metricCard('fa-rotate-left', 'var(--success-bg)', 'var(--success-green)', 'Pagos Realizados', formatCOP(pagos.reduce((a,x)=>a+x.monto,0)))}
    </div>
  </div>
  <div class="card-table">
    <div class="card-table-header"><h3>Historial Financiero</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Semana</th><th>Fecha</th><th>Ventas</th><th>Gastos</th><th>Utilidad</th><th>Estado</th></tr></thead>
      <tbody>
        ${hist.length ? hist.map(s => `<tr><td>${escapeHTML(s.semana)}</td><td>${fechaLarga(s.fecha)}</td><td>${formatCOP(s.ventas)}</td><td>${formatCOP(s.gastos)}</td><td>${formatCOP(s.utilidad)}</td><td>${badgeEstado(s.estado)}</td></tr>`).join('') : `<tr><td colspan="6" class="empty-state">Aún no hay seguimientos registrados.</td></tr>`}
      </tbody>
    </table></div>
  </div>
  <div class="card-table">
    <div class="card-table-header"><h3>Historial de Pagos</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th></tr></thead>
      <tbody>
        ${pagos.length ? pagos.map(x => `<tr><td>${fechaLarga(x.fecha)}</td><td>${escapeHTML(x.concepto)}</td><td>${formatCOP(x.monto)}</td><td><span class="badge badge-green">${escapeHTML(x.estado)}</span></td></tr>`).join('') : '<tr><td colspan="4" class="empty-state">No hay pagos registrados.</td></tr>'}
      </tbody>
    </table></div>
  </div>
  ${renderNotificacionesSesion()}`;
}

function renderClienteMetas(c) {
  const r = c.resultados;
  const pct = r.metas ? Math.min(100, (r.ventas / r.metas) * 100) : 0;
  const hist = seguimientosDeCliente(c.id);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Cumplimiento de Meta de Ventas</h3></div>
    <p style="margin-bottom:10px;font-size:.9rem;">Meta de ventas mensual: <b>${formatCOP(r.metas)}</b> (Progreso: ${pct.toFixed(1)}%)</p>
    <div class="progress-bar-track"><div class="progress-bar-fill" style="background:${pct >= 80 ? 'var(--success-green)' : pct >= 50 ? 'var(--warning-amber)' : 'var(--danger-red)'};width:${pct}%;"></div></div>
  </div>
  <div class="card-table">
    <div class="card-table-header"><h3>Cumplimiento por Seguimiento Semanal</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Semana</th><th>Fecha</th><th>Cumplimiento de metas</th><th>Uso de la inversión</th></tr></thead>
      <tbody>
        ${hist.length ? hist.map(s => `<tr><td>${escapeHTML(s.semana)}</td><td>${fechaLarga(s.fecha)}</td><td>${escapeHTML(s.cumplimientoMetas)}</td><td>${escapeHTML(s.usoInversion)}</td></tr>`).join('') : `<tr><td colspan="4" class="empty-state">Sin registros aún.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function renderClienteSeguimientos(c) {
  const hist = seguimientosDeCliente(c.id);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Historial de Seguimientos</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Semana</th><th>Fecha</th><th>Asesor</th><th>Estado</th><th>Ventas</th><th>Utilidad</th><th>Acción</th></tr></thead>
      <tbody>
        ${hist.length ? hist.map(s => `<tr><td>${escapeHTML(s.semana)}</td><td>${fechaLarga(s.fecha)}</td><td>${nombreTrabajador(s.trabajadorId)}</td><td>${badgeEstado(s.estado)}</td><td>${formatCOP(s.ventas)}</td><td>${formatCOP(s.utilidad)}</td><td><button class="btn-secondary" onclick="verSeguimientoDetalle(${s.id})">Ver</button></td></tr>`).join('') : `<tr><td colspan="7" class="empty-state">Aún no tienes seguimientos registrados.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function renderClientePerfil(c) {
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Editar Mi Perfil</h3></div>
