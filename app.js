/* =========================================================
   INVERSIONES JORAN - Lógica de la plataforma
   ========================================================= */

let SESSION = { rol: null, usuario: null, usuarioId: null, clienteId: null, trabajadorId: null, vista: null };
const CHARTS = {};

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
  nextId: { cliente: 1, trabajador: 1, seguimiento: 1, usuario: 1, solicitud: 1, solicitudInversion: 1, pago: 1, alerta: 1, notificacion: 1 }
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
document.addEventListener('DOMContentLoaded', iniciarApp);

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
    { id: 'c-notificaciones', label: 'Notificaciones', icon: 'fa-bell' }
  ]);
  CURRENT_ROLE_ROUTES = {
    'c-inicio': { titulo: `Portal del Cliente - ${c.negocio.nombre}`, render: () => renderClienteInicio(c) },
    'c-negocio': { titulo: 'Mi Negocio', render: () => renderClienteNegocio(c) },
    'c-inversion': { titulo: 'Mi Inversión', render: () => renderClienteInversion(c) },
    'c-finanzas': { titulo: 'Mis Finanzas', render: () => renderClienteFinanzas(c) },
    'c-metas': { titulo: 'Mis Metas', render: () => renderClienteMetas(c) },
    'c-seguimientos': { titulo: 'Historial de Seguimientos', render: () => renderClienteSeguimientos(c) },
    'c-perfil': { titulo: 'Mi Perfil', render: () => renderClientePerfil(c) },
    'c-notificaciones': { titulo: 'Mis Notificaciones', render: () => renderNotificacionesSesion() }
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
          <p>Representante: <span class="linea-vacia"></span></p>
          <p>C.C. N.°: <span class="linea-vacia"></span></p>
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
        <p>Nombre: <span class="linea-vacia"></span><br><br>C.C. N.°: <span class="linea-vacia"></span><br><br>Cargo: <span class="linea-vacia"></span></p>
        <div class="cn-firma-linea">Firma</div>
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
    <div class="form-grid-3">
      <div class="field"><label>Nombre completo</label><input class="form-control" value="${escapeHTML(c.nombre)}" id="perfil-nombre" disabled></div>
      <div class="field"><label>Teléfono</label><input class="form-control" value="${escapeHTML(c.telefono)}" id="perfil-telefono"></div>
      <div class="field"><label>Correo</label><input class="form-control" type="email" value="${escapeHTML(c.correo)}" id="perfil-correo"></div>
    </div>
    <div class="field" style="margin-bottom:16px;"><label>Dirección</label><input class="form-control" value="${escapeHTML(c.direccion)}" id="perfil-direccion"></div>
    <button class="btn-main" onclick="guardarPerfilCliente(${c.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</button>
  </div>`;
}
function guardarPerfilCliente(id) {
  const c = getCliente(id);
  c.telefono = el('perfil-telefono').value.trim();
  c.correo = el('perfil-correo').value.trim();
  c.direccion = el('perfil-direccion').value.trim();
  registrarAuditoria('Perfil de cliente actualizado', c.negocio.nombre);
  guardarEstado();
  mostrarNotificacion('Perfil actualizado correctamente');
}

/* =========================================================
   TRABAJADOR
   ========================================================= */
function initTrabajadorUI() {
  el('header-user-role').innerText = 'Trabajador JORAN';
  const t = getTrabajador(SESSION.trabajadorId);
  if (!t) {
    el('menuLateral').innerHTML = '';
    el('titulo-pagina').innerText = 'Panel de Trabajador';
    el('content-container').innerHTML = `<div class="card-table"><div class="empty-state">No se encontró tu perfil de trabajador. Contacta al administrador.</div></div>`;
    return;
  }
  setMenu([
    { id: 'w-inicio', label: 'Nuevo Seguimiento', icon: 'fa-house' },
    { id: 'w-negocios', label: 'Mis Negocios', icon: 'fa-store' },
    { id: 'w-seguimientos', label: 'Seguimientos Realizados', icon: 'fa-list-check' },
    { id: 'w-pendientes', label: 'Seguimientos Pendientes', icon: 'fa-clock' },
    { id: 'w-perfil', label: 'Mi Perfil', icon: 'fa-user' },
    { id: 'w-notificaciones', label: 'Notificaciones', icon: 'fa-bell' }
  ]);
  CURRENT_ROLE_ROUTES = {
    'w-inicio': { titulo: 'Nuevo Seguimiento Semanal en Campo', render: () => renderTrabajadorInicio(t) },
    'w-negocios': { titulo: 'Negocios Asignados a mi Cargo', render: () => renderTrabajadorNegocios(t) },
    'w-seguimientos': { titulo: 'Seguimientos Realizados', render: () => renderTrabajadorSeguimientos(t) },
    'w-pendientes': { titulo: 'Seguimientos Pendientes', render: () => renderTrabajadorPendientes(t) },
    'w-perfil': { titulo: 'Mi Perfil', render: () => renderTrabajadorPerfil(t) },
    'w-notificaciones': { titulo: 'Mis Notificaciones', render: () => renderNotificacionesSesion() }
  };
  navegarInicial('w-inicio');
}

function renderTrabajadorInicio(t) {
  const negocios = t.negocios.map(id => getCliente(id)).filter(Boolean);
  const hoy = fechaHoyLocal();
  resetEvidenciasTemp();

  if (!negocios.length) {
    return `<div class="card-table"><div class="empty-state">No tienes negocios asignados. Contacta al administrador para que te asigne uno.</div></div>`;
  }

  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Datos del Cliente y Seguimiento Semanal</h3>
      <button class="btn-main" onclick="guardarSeguimientoTrabajador(${t.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Seguimiento</button>
    </div>

    <div class="form-box">
      <h4>Datos del Cliente</h4>
      <div class="form-grid-3">
        <div class="field"><label>Negocio</label>
          <select class="form-control" id="seg-negocio" onchange="actualizarTelefonoClienteSeg()">
            ${negocios.map(c => `<option value="${c.id}">${escapeHTML(c.negocio.nombre)} — ${escapeHTML(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Fecha</label><input type="date" class="form-control" id="seg-fecha" value="${hoy}" max="${hoy}"></div>
        <div class="field"><label>Semana</label><input type="text" class="form-control" id="seg-semana" value="${semanaActualLabel()}" placeholder="Ej: Semana 19"></div>
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Tipo de seguimiento</label>
          <select class="form-control" id="seg-tipo"><option>Presencial</option><option>Telefónico</option></select>
        </div>
        <div class="field"><label>Teléfono del cliente</label><input type="text" class="form-control" id="seg-tel-cliente" readonly value="${escapeHTML((negocios[0] || {}).telefono || '')}"></div>
      </div>
      <div class="form-grid-2">
        <div class="field"><label style="display:flex;align-items:center;gap:6px;font-weight:700;"><input type="checkbox" id="seg-visita" checked style="width:auto;"> Visita realizada</label></div>
        <div class="field"><label>Próxima visita</label><input type="date" class="form-control" id="seg-proxima" value="${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}"></div>
      </div>
    </div>

    <div class="form-box">
      <h4>Seguimiento Semanal — Información del Negocio</h4>
      <div class="form-grid-4">
        <div class="field"><label>Ventas de la semana</label><input type="number" min="0" class="form-control" id="seg-ventas" placeholder="0" oninput="sugerirAlertaNegocio()"></div>
        <div class="field"><label>Gastos de la semana</label><input type="number" min="0" class="form-control" id="seg-gastos" placeholder="0"></div>
        <div class="field"><label>Utilidad estimada</label><input type="number" class="form-control" id="seg-utilidad" placeholder="0"></div>
        <div class="field"><label>Inventario aproximado</label><input type="number" min="0" class="form-control" id="seg-inventario" placeholder="0"></div>
      </div>
      <div class="form-grid-3">
        <div class="field"><label>Flujo de caja</label><input type="number" class="form-control" id="seg-flujo" placeholder="0"></div>
        <div class="field"><label>Clientes atendidos</label><input type="number" min="0" class="form-control" id="seg-clientes" placeholder="0"></div>
        <div class="field"><label>Nuevos clientes</label><input type="number" min="0" class="form-control" id="seg-nuevosclientes" placeholder="0"></div>
      </div>
    </div>

    <div class="form-box">
      <h4>Evaluación</h4>
      <div class="form-grid-3">
        <div class="field"><label>Cumplimiento de metas</label><select class="form-control" id="seg-cumplimiento"><option>Parcial</option><option>Total</option><option>No cumplida</option></select></div>
        <div class="field"><label>Uso de la inversión</label><select class="form-control" id="seg-usoinversion"><option>Adecuado</option><option>En revisión</option><option>Inadecuado</option></select></div>
        <div class="field"><label>Estado del negocio (alerta) <span class="req">*</span></label>
          <select class="form-control" id="seg-estado" onchange="el('seg-sugerencia').style.display='none';">
            <option value="normal">🟢 Normal — funcionando correctamente</option>
            <option value="atencion">🟡 Atención — ventas cayeron 10–20%</option>
            <option value="riesgo">🟠 Riesgo — liquidez, inventario o pagos</option>
            <option value="critico">🔴 Crítico — pérdidas, cierre o incumplimiento</option>
          </select>
          <div id="seg-sugerencia" style="display:none;font-size:.72rem;color:var(--navy);margin-top:5px;background:#eef1f5;padding:5px 8px;border-radius:6px;"></div>
        </div>
      </div>
      <div class="form-grid-2" style="margin-bottom:12px;">
        <div class="field"><label>Problemas encontrados</label><textarea class="form-control" rows="2" id="seg-problemas"></textarea></div>
        <div class="field"><label>Necesidades</label><textarea class="form-control" rows="2" id="seg-necesidades"></textarea></div>
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Recomendaciones</label><textarea class="form-control" rows="2" id="seg-recomendaciones"></textarea></div>
        <div class="field"><label>Compromisos</label><textarea class="form-control" rows="2" id="seg-compromisos"></textarea></div>
      </div>
    </div>

    <div class="form-box">
      <h4>Evidencias</h4>
      <div class="form-grid-3">
        <div>
          <input type="file" id="input-fotos" accept="image/*" multiple style="display:none" onchange="handleFileSelect(this,'fotos')">
          <div class="file-drop" onclick="document.getElementById('input-fotos').click()"><i class="fa-solid fa-camera" style="font-size:1.3rem;margin-bottom:6px;display:block;"></i>Adjuntar Fotos</div>
          <div id="preview-fotos" class="chip-list" style="margin-top:8px;"></div>
        </div>
        <div>
          <input type="file" id="input-documentos" multiple style="display:none" onchange="handleFileSelect(this,'documentos')">
          <div class="file-drop" onclick="document.getElementById('input-documentos').click()"><i class="fa-solid fa-file" style="font-size:1.3rem;margin-bottom:6px;display:block;"></i>Adjuntar Documentos</div>
          <div id="preview-documentos" class="chip-list" style="margin-top:8px;"></div>
        </div>
        <div>
          <input type="file" id="input-facturas" multiple style="display:none" onchange="handleFileSelect(this,'facturas')">
          <div class="file-drop" onclick="document.getElementById('input-facturas').click()"><i class="fa-solid fa-receipt" style="font-size:1.3rem;margin-bottom:6px;display:block;"></i>Adjuntar Facturas</div>
          <div id="preview-facturas" class="chip-list" style="margin-top:8px;"></div>
        </div>
      </div>
      <div class="field" style="margin-top:12px;"><label>Observaciones</label><textarea class="form-control" rows="2" id="seg-observaciones"></textarea></div>
    </div>
  </div>`;
}

function actualizarTelefonoClienteSeg() {
  const sel = el('seg-negocio');
  const tel = el('seg-tel-cliente');
  if (!sel || !tel) return;
  const c = getCliente(Number(sel.value));
  tel.value = c ? (c.telefono || '') : '';
  sugerirAlertaNegocio();
}

function sugerirAlertaNegocio() {
  const selNeg = el('seg-negocio');
  const inputVentas = el('seg-ventas');
  const box = el('seg-sugerencia');
  if (!selNeg || !inputVentas || !box) return;
  const clienteId = Number(selNeg.value);
  const ventasActuales = Number(inputVentas.value);
  if (!ventasActuales) { box.style.display = 'none'; return; }
  const anterior = ultimoSeguimiento(clienteId);
  if (!anterior || !anterior.ventas) { box.style.display = 'none'; return; }
  const variacion = ((ventasActuales - anterior.ventas) / anterior.ventas) * 100;
  let sugerido = null;
  if (variacion <= -50) sugerido = 'critico';
  else if (variacion <= -20) sugerido = 'riesgo';
  else if (variacion <= -10) sugerido = 'atencion';
  else sugerido = 'normal';
  const info = estadoInfo(sugerido);
  box.style.display = 'block';
  box.innerHTML = `<i class="fa-solid fa-lightbulb"></i> Variación: ${variacion.toFixed(1)}%. Sugerencia: ${info.emoji} ${info.label}. <button type="button" class="btn-secondary" style="padding:2px 8px;font-size:.7rem;margin-left:4px;" onclick="el('seg-estado').value='${sugerido}';">Usar</button>`;
}

/* ---------------- Evidencias ---------------- */
let EVID_TEMP = { fotos: [], documentos: [], facturas: [] };
function resetEvidenciasTemp() { EVID_TEMP = { fotos: [], documentos: [], facturas: [] }; }

function comprimirImagen(file, maxAncho = 1280, calidad = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxAncho) {
          height = Math.round(height * (maxAncho / width));
          width = maxAncho;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function handleFileSelect(inputEl, tipo) {
  const files = Array.from(inputEl.files || []);
  if (!files.length) return;
  const lecturas = files.map(file => {
    if (file.type.startsWith('image/')) {
      return comprimirImagen(file).then(dataUrl => ({ name: file.name, dataUrl, isImage: true }));
    }
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: reader.result, isImage: false });
      reader.readAsDataURL(file);
    });
  });
  Promise.all(lecturas).then(items => {
    EVID_TEMP[tipo] = EVID_TEMP[tipo].concat(items.filter(it => it.dataUrl));
    renderEvidenciaPreview(tipo);
    inputEl.value = '';
  });
}

function renderEvidenciaPreview(tipo) {
  const cont = el('preview-' + tipo);
  if (!cont) return;
  cont.innerHTML = EVID_TEMP[tipo].map((item, i) => {
    if (item.isImage) {
      return `<span class="chip" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px 4px 4px;">
        <img src="${item.dataUrl}" style="width:28px;height:28px;object-fit:cover;border-radius:5px;">
        ${escapeHTML(item.name.length > 14 ? item.name.slice(0, 12) + '…' : item.name)}
        <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--danger-red);" onclick="removeEvidenciaItem('${tipo}',${i})"></i>
      </span>`;
    }
    return `<span class="chip"><i class="fa-solid fa-paperclip"></i> ${escapeHTML(item.name.length > 18 ? item.name.slice(0, 16) + '…' : item.name)}
      <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--danger-red);margin-left:4px;" onclick="removeEvidenciaItem('${tipo}',${i})"></i></span>`;
  }).join('') || '<span style="font-size:.75rem;color:var(--text-muted);">Sin archivos adjuntos</span>';
}

function removeEvidenciaItem(tipo, idx) {
  EVID_TEMP[tipo].splice(idx, 1);
  renderEvidenciaPreview(tipo);
}

function guardarSeguimientoTrabajador(trabajadorId) {
  if (!el('seg-negocio').value) { mostrarNotificacion('Seleccione el negocio', true); return; }
  if (!el('seg-fecha').value) { mostrarNotificacion('Indique la fecha', true); return; }
  if (!el('seg-semana').value.trim()) { mostrarNotificacion('Indique la semana', true); return; }
  const nuevo = {
    id: DB.nextId.seguimiento++,
    clienteId: Number(el('seg-negocio').value),
    trabajadorId: trabajadorId,
    fecha: el('seg-fecha').value,
    semana: el('seg-semana').value.trim(),
    tipo: el('seg-tipo').value,
    visitaRealizada: el('seg-visita').checked,
    proximaVisita: el('seg-proxima').value || null,
    ventas: Number(el('seg-ventas').value) || 0,
    gastos: Number(el('seg-gastos').value) || 0,
    utilidad: Number(el('seg-utilidad').value) || 0,
    inventario: Number(el('seg-inventario').value) || 0,
    flujoCaja: Number(el('seg-flujo').value) || 0,
    clientesAtendidos: Number(el('seg-clientes').value) || 0,
    nuevosClientes: Number(el('seg-nuevosclientes').value) || 0,
    cumplimientoMetas: el('seg-cumplimiento').value,
    usoInversion: el('seg-usoinversion').value,
    estado: el('seg-estado').value,
    problemas: el('seg-problemas').value.trim(),
    necesidades: el('seg-necesidades').value.trim(),
    recomendaciones: el('seg-recomendaciones').value.trim(),
    compromisos: el('seg-compromisos').value.trim(),
    evidencias: {
      fotos: EVID_TEMP.fotos.slice(),
      documentos: EVID_TEMP.documentos.slice(),
      facturas: EVID_TEMP.facturas.slice(),
      observaciones: el('seg-observaciones').value.trim()
    }
  };

  DB.seguimientos.unshift(nuevo);
  const cliente = getCliente(nuevo.clienteId);
  if (cliente) {
    cliente.estado = nuevo.estado;
    cliente.resultados.ventas = nuevo.ventas;
    cliente.resultados.gastos = nuevo.gastos;
    cliente.resultados.utilidad = nuevo.utilidad;
    cliente.resultados.inventario = nuevo.inventario;
    asegurarProcesoCliente(cliente).etapas.seguimientoSemanal = true;
  }

  if (nuevo.estado === 'riesgo' || nuevo.estado === 'critico') {
    DB.alertas.unshift({
      id: DB.nextId.alerta++,
      clienteId: nuevo.clienteId,
      trabajadorId: trabajadorId,
      nivel: nuevo.estado,
      motivo: `Alerta generada en seguimiento (${nuevo.semana}): ${nuevo.problemas || 'Sin detalle de problemas'}`,
      fecha: nuevo.fecha,
      estado: 'Abierta'
    });
    crearNotificacion('admin', null, `Alerta ${estadoInfo(nuevo.estado).label}`, `${cliente ? cliente.negocio.nombre : 'Negocio'} entró en ${estadoInfo(nuevo.estado).label}.`, 'alerta');
  }

  crearNotificacion('client', nuevo.clienteId, 'Nuevo seguimiento registrado', `Se registró el seguimiento de ${nuevo.semana}.`, 'seguimiento');
  registrarAuditoria('Seguimiento guardado', `${cliente ? cliente.negocio.nombre : '-'} — ${nuevo.semana}`);
  resetEvidenciasTemp();
  guardarEstado();
  mostrarNotificacion('Seguimiento guardado con éxito');
  navegar('w-seguimientos');
}

function renderTrabajadorNegocios(t) {
  const misNegocios = t.negocios.map(id => getCliente(id)).filter(Boolean);
  const refSemana = infoSemanaISO(fechaHoyLocal());
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Mis Negocios Asignados</h3>
      <span class="subtitle">La asignación de negocios la gestiona el Administrador.</span>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>Negocio</th><th>Cliente</th><th>Teléfono</th><th>Dirección</th><th>Estado</th><th>Último Seguimiento</th><th>Acción</th></tr></thead>
      <tbody>
        ${misNegocios.length ? misNegocios.map(c => {
          const u = ultimoSeguimiento(c.id);
          const alDia = u && esMismaSemanaISO(u.fecha, refSemana);
          return `<tr>
            <td><b>${escapeHTML(c.negocio.nombre)}</b></td>
            <td>${escapeHTML(c.nombre)}</td>
            <td>${escapeHTML(c.telefono)}</td>
            <td>${escapeHTML(c.negocio.direccion || '-')}, ${escapeHTML(c.negocio.ciudad || '')} <a href="${enlaceMapa(c)}" target="_blank" title="Abrir en Google Maps" style="color:var(--gold);margin-left:4px;"><i class="fa-solid fa-location-dot"></i></a></td>
            <td>${badgeEstado(c.estado)}</td>
            <td>${u ? fechaLarga(u.fecha) : 'Sin visitas'} ${alDia ? '<span class="badge badge-green" style="margin-left:4px;">Al día</span>' : '<span class="badge badge-amber" style="margin-left:4px;">Pendiente</span>'}</td>
            <td><button class="btn-secondary" onclick="abrirModalGenerarAlerta(${c.id}, ${t.id})"><i class="fa-solid fa-triangle-exclamation"></i> Alerta</button></td>
          </tr>`;
        }).join('') : `<tr><td colspan="7" class="empty-state">No tienes negocios asignados. Contacta al administrador para que te asigne uno.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function renderTrabajadorSeguimientos(t) {
  const mis = seguimientosDeTrabajador(t.id);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Seguimientos Realizados por Mí</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Semana</th><th>Fecha</th><th>Negocio</th><th>Visita</th><th>Ventas</th><th>Utilidad</th><th>Alerta</th><th>Acción</th></tr></thead>
      <tbody>
        ${mis.length ? mis.map(s => `<tr>
          <td>${escapeHTML(s.semana)}</td>
          <td>${fechaLarga(s.fecha)}</td>
          <td>${nombreNegocio(s.clienteId)}</td>
          <td>${s.visitaRealizada === false ? '<span class="badge badge-amber">No</span>' : '<span class="badge badge-green">Sí</span>'}</td>
          <td>${formatCOP(s.ventas)}</td>
          <td>${formatCOP(s.utilidad)}</td>
          <td>${badgeEstado(s.estado)}</td>
          <td><button class="btn-secondary" onclick="verSeguimientoDetalle(${s.id})">Ver detalle</button></td>
        </tr>`).join('') : `<tr><td colspan="8" class="empty-state">Aún no has registrado seguimientos.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function renderTrabajadorPendientes(t) {
  const refSemana = infoSemanaISO(fechaHoyLocal());
  const misNegocios = t.negocios.map(id => getCliente(id)).filter(Boolean);
  const pendientes = misNegocios.filter(c => !DB.seguimientos.some(s => s.clienteId === c.id && esMismaSemanaISO(s.fecha, refSemana)));
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Seguimientos Pendientes de la Semana Actual</h3><span class="subtitle">${semanaActualLabel()}</span></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Negocio</th><th>Cliente</th><th>Teléfono</th><th>Dirección</th><th>Último Seguimiento</th><th>Acción</th></tr></thead>
      <tbody>
        ${pendientes.length ? pendientes.map(c => {
          const u = ultimoSeguimiento(c.id);
          return `<tr>
            <td><b>${escapeHTML(c.negocio.nombre)}</b></td>
            <td>${escapeHTML(c.nombre)}</td>
            <td>${escapeHTML(c.telefono)}</td>
            <td>${escapeHTML(c.negocio.direccion || '-')}, ${escapeHTML(c.negocio.ciudad || '')}</td>
            <td>${u ? `${escapeHTML(u.semana)} (${fechaLarga(u.fecha)})` : 'Sin seguimientos'}</td>
            <td><button class="btn-main" onclick="irARegistrarSeguimiento(${c.id})"><i class="fa-solid fa-plus"></i> Registrar Visita</button></td>
          </tr>`;
        }).join('') : `<tr><td colspan="6" class="empty-state" style="color:var(--success-green);font-weight:600;"><i class="fa-solid fa-circle-check"></i> ¡Excelente! Todos tus negocios asignados están al día esta semana.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function irARegistrarSeguimiento(clienteId) {
  navegar('w-inicio');
  setTimeout(() => {
    const sel = el('seg-negocio');
    if (sel) { sel.value = String(clienteId); actualizarTelefonoClienteSeg(); }
  }, 60);
}

function renderTrabajadorPerfil(t) {
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Mi Perfil</h3></div>
    <div class="form-grid-2">
      <div class="field"><label>Nombre completo</label><input class="form-control" value="${escapeHTML(t.nombre)}" id="perf-t-nombre" disabled></div>
      <div class="field"><label>Teléfono</label><input class="form-control" value="${escapeHTML(t.telefono)}" id="perf-t-tel"></div>
    </div>
    <button class="btn-main" onclick="guardarPerfilTrabajador(${t.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</button>
  </div>`;
}
function guardarPerfilTrabajador(id) {
  const t = getTrabajador(id);
  t.telefono = el('perf-t-tel').value.trim();
  registrarAuditoria('Perfil de trabajador actualizado', t.nombre);
  guardarEstado();
  mostrarNotificacion('Perfil actualizado');
}

function verSeguimientoDetalle(id) {
  const s = DB.seguimientos.find(x => x.id === Number(id));
  if (!s) return;
  const ev = s.evidencias || { fotos: [], documentos: [], facturas: [], observaciones: '' };
  openModal(`Seguimiento: ${escapeHTML(s.semana)} — ${nombreNegocio(s.clienteId)}`, `
    <div class="form-grid-3">
      ${field('Fecha', fechaLarga(s.fecha))}
      ${field('Trabajador', nombreTrabajador(s.trabajadorId))}
      ${field('Tipo', s.tipo)}
    </div>
    <div class="form-grid-3">
      ${field('Visita realizada', s.visitaRealizada === false ? 'No' : 'Sí')}
      ${field('Próxima visita', fechaLarga(s.proximaVisita))}
      ${field('Estado (alerta)', badgeEstado(s.estado), true)}
    </div>
    <div class="form-box">
      <h4>Finanzas de la Semana</h4>
      <div class="form-grid-4">
        ${field('Ventas', formatCOP(s.ventas))}
        ${field('Gastos', formatCOP(s.gastos))}
        ${field('Utilidad', formatCOP(s.utilidad))}
        ${field('Inventario', formatCOP(s.inventario))}
      </div>
      <div class="form-grid-3">
        ${field('Flujo de caja', formatCOP(s.flujoCaja))}
        ${field('Clientes atendidos', s.clientesAtendidos)}
        ${field('Nuevos clientes', s.nuevosClientes)}
      </div>
    </div>
    <div class="form-box">
      <h4>Evaluación</h4>
      <div class="form-grid-2">
        ${field('Cumplimiento de metas', s.cumplimientoMetas)}
        ${field('Uso de inversión', s.usoInversion)}
      </div>
      ${field('Problemas', s.problemas)}
      ${field('Necesidades', s.necesidades)}
      ${field('Recomendaciones', s.recomendaciones)}
      ${field('Compromisos', s.compromisos)}
    </div>
    <div class="form-box" style="margin-bottom:0;">
      <h4>Evidencias y Adjuntos</h4>
      <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px;">Fotos (${(ev.fotos||[]).length}), Documentos (${(ev.documentos||[]).length}), Facturas (${(ev.facturas||[]).length})</p>
      ${(ev.fotos && ev.fotos.length) ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">${ev.fotos.map(f => `<a href="${f.dataUrl}" target="_blank"><img src="${f.dataUrl}" style="width:70px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;"></a>`).join('')}</div>` : ''}
      ${field('Observaciones generales', ev.observaciones)}
    </div>
  `);
}

/* =========================================================
   ADMINISTRADOR
   ========================================================= */
function initAdminUI() {
  el('header-user-role').innerText = 'Administrador JORAN';
  const menuCompleto = [
    { id: 'a-dashboard', label: 'Dashboard', icon: 'fa-gauge' },
    { id: 'a-clientes', label: 'Clientes', icon: 'fa-store' },
    { id: 'a-trabajadores', label: 'Trabajadores', icon: 'fa-user-tie' },
    { id: 'a-inversiones', label: 'Inversiones', icon: 'fa-hand-holding-dollar' },
    { id: 'a-solicitudes', label: 'Solicitudes', icon: 'fa-clipboard-check' },
    { id: 'a-pagos', label: 'Pagos y Cartera', icon: 'fa-wallet' },
    { id: 'a-alertas', label: 'Alertas', icon: 'fa-triangle-exclamation' },
    { id: 'a-seguimientos', label: 'Seguimientos', icon: 'fa-list-check' },
    { id: 'a-reportes', label: 'Reportes', icon: 'fa-chart-pie' },
    { id: 'a-configuracion', label: 'Configuración', icon: 'fa-gear' }
  ];
  setMenu(itemsMenuFiltrados('admin', menuCompleto));
  CURRENT_ROLE_ROUTES = {
    'a-dashboard': { titulo: 'Dashboard General', render: () => renderAdminDashboard(), after: () => afterAdminDashboard() },
    'a-clientes': { titulo: 'Directorio de Clientes PyMEs', render: () => renderAdminClientes() },
    'a-trabajadores': { titulo: 'Gestión de Trabajadores de Campo', render: () => renderAdminTrabajadores() },
    'a-inversiones': { titulo: 'Control de Inversiones Activas', render: () => renderAdminInversiones() },
    'a-solicitudes': { titulo: 'Solicitudes de Inversión', render: () => renderAdminSolicitudes() },
    'a-pagos': { titulo: 'Pagos y Cartera', render: () => renderAdminPagos() },
    'a-alertas': { titulo: 'Centro de Alertas de Negocios', render: () => renderAdminAlertas() },
    'a-seguimientos': { titulo: 'Seguimientos en Campo', render: () => renderAdminSeguimientos() },
    'a-reportes': { titulo: 'Reportes Analíticos', render: () => renderAdminReportes(), after: () => afterAdminReportes() },
    'a-configuracion': { titulo: 'Configuración del Sistema', render: () => renderAdminConfiguracion() }
  };
  navegarInicial('a-dashboard');
}

function adminStats() {
  const negociosActivos = DB.clientes.length;
  const negociosRiesgo = DB.clientes.filter(c => c.estado === 'riesgo' || c.estado === 'critico').length;
  const negociosCritico = DB.clientes.filter(c => c.estado === 'critico').length;
  const refSemana = infoSemanaISO(fechaHoyLocal());
  const seguimientosPendientes = DB.clientes.filter(c => !DB.seguimientos.some(s => s.clienteId === c.id && esMismaSemanaISO(s.fecha, refSemana))).length;
  const trabajadoresActivos = DB.trabajadores.length;
  return { negociosActivos, negociosRiesgo, negociosCritico, seguimientosPendientes, trabajadoresActivos };
}

function adminCapitalStats() {
  asegurarDatosNuevos();
  const invertido = DB.clientes.reduce((a, c) => a + (Number(c.inversion?.recibido) || Number(c.inversion?.aprobado) || 0), 0);
  const recuperado = DB.pagos.filter(p => p.tipo === 'recuperacion').reduce((a, p) => a + (Number(p.monto) || 0), 0);
  const gan = DB.clientes.reduce((a, c) => a + (Number(c.resultados?.utilidad) || 0) * (Number(c.inversion?.participacion) || 0) / 100, 0);
  const disp = Math.max(0, (Number(DB.capital.total) || 0) - invertido + recuperado);
  return { invertido, recuperado, gan, disp };
}

function renderAdminDashboard() {
  const st = adminStats();
  const cap = adminCapitalStats();
  const ultSeg = DB.seguimientos.slice(0, 8);
  const solicitudesEdicion = DB.solicitudesEdicion.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));

  return `
  <div class="metrics-row">
    ${metricCard('fa-coins', '#e6ecf7', 'var(--navy)', 'Fondo Total Capital', formatCOP(DB.capital.total))}
    ${metricCard('fa-wallet', 'var(--success-bg)', 'var(--success-green)', 'Capital Invertido', formatCOP(cap.invertido))}
    ${metricCard('fa-piggy-bank', 'var(--warning-bg)', 'var(--warning-amber)', 'Capital Disponible', formatCOP(cap.disp))}
    ${metricCard('fa-rotate-left', 'var(--success-bg)', 'var(--success-green)', 'Capital Recuperado', formatCOP(cap.recuperado))}
  </div>

  <div class="metrics-row">
    ${metricCard('fa-store', '#e6ecf7', 'var(--navy)', 'Negocios Activos', st.negociosActivos)}
    ${metricCard('fa-triangle-exclamation', 'var(--risk-orange-bg)', 'var(--risk-orange)', 'En Riesgo / Crítico', st.negociosRiesgo, st.negociosCritico ? `${st.negociosCritico} críticos` : null, 'var(--danger-red)')}
    ${metricCard('fa-clock', 'var(--warning-bg)', 'var(--warning-amber)', 'Seg. Pendientes', st.seguimientosPendientes, semanaActualLabel(), 'var(--text-muted)')}
    ${metricCard('fa-chart-line', 'var(--success-bg)', 'var(--success-green)', 'Ganancias Est. JORAN', formatCOP(cap.gan))}
  </div>

  <div style="display:grid;grid-template-columns:1fr 300px;gap:20px;margin-bottom:24px;">
    <div class="card-table" style="margin-bottom:0;">
      <div class="card-table-header"><h3>Seguimientos Recientes</h3></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Fecha</th><th>Semana</th><th>Negocio</th><th>Asesor</th><th>Ventas</th><th>Utilidad</th><th>Alerta</th></tr></thead>
        <tbody>
          ${ultSeg.length ? ultSeg.map(s => `<tr>
            <td>${fechaLarga(s.fecha)}</td>
            <td>${escapeHTML(s.semana)}</td>
            <td><b>${nombreNegocio(s.clienteId)}</b></td>
            <td>${nombreTrabajador(s.trabajadorId)}</td>
            <td>${formatCOP(s.ventas)}</td>
            <td>${formatCOP(s.utilidad)}</td>
            <td>${badgeEstado(s.estado)}</td>
          </tr>`).join('') : `<tr><td colspan="7" class="empty-state">No hay seguimientos registrados.</td></tr>`}
        </tbody>
      </table></div>
    </div>

    <div class="card-table" style="margin-bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
      <h3 style="font-size:.9rem;color:var(--navy);font-weight:800;margin-bottom:12px;">Semáforo de Negocios</h3>
      <div style="width:190px;height:190px;"><canvas id="chart-estado-negocios"></canvas></div>
    </div>
  </div>

  <div class="card-table">
    <div class="card-table-header">
      <h3>Solicitudes de Edición de Datos de Negocio</h3>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="subtitle">${solicitudesEdicion.filter(s => s.estado === 'Pendiente').length} pendientes</span>
        ${solicitudesEdicion.length ? `
          <button class="btn-secondary" onclick="limpiarSolicitudesAtendidas()"><i class="fa-solid fa-broom"></i> Limpiar atendidas</button>
          <button class="btn-danger" onclick="vaciarTodasSolicitudesEdicion()"><i class="fa-solid fa-trash"></i> Vaciar todas</button>
        ` : ''}
      </div>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Negocio</th><th>Cliente</th><th>Solicitud</th><th>Estado</th><th>Respuesta</th><th>Acción</th></tr></thead>
      <tbody>
        ${solicitudesEdicion.length ? solicitudesEdicion.map(s => `<tr>
          <td>${fechaLarga(s.fecha)}</td>
          <td><b>${escapeHTML(s.negocioNombre)}</b></td>
          <td>${escapeHTML(s.clienteNombre)}</td>
          <td>${escapeHTML(s.mensaje)}</td>
          <td>${s.estado === 'Pendiente' ? '<span class="badge badge-amber">Pendiente</span>' : '<span class="badge badge-green">Atendida</span>'}</td>
          <td>${s.respuesta ? escapeHTML(s.respuesta) : '<span style="color:var(--text-muted);">-</span>'}</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn-main" onclick="abrirModalAtenderSolicitud(${s.id})">${s.estado === 'Pendiente' ? 'Responder' : 'Ver / Editar'}</button>
            <button class="btn-danger" onclick="eliminarSolicitudEdicion(${s.id})" title="Eliminar solicitud"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join('') : `<tr><td colspan="7" class="empty-state">No hay solicitudes de edición registradas.</td></tr>`}
      </tbody>
    </table></div>
  </div>

  ${renderNotificacionesSesion()}
  `;
}

function afterAdminDashboard() {
  if (!window.Chart || !el('chart-estado-negocios')) return;
  const conteo = { normal: 0, atencion: 0, riesgo: 0, critico: 0 };
  DB.clientes.forEach(c => { conteo[c.estado] = (conteo[c.estado] || 0) + 1; });

  crearGraficoSeguro('chart-estado-negocios', {
    type: 'doughnut',
    data: {
      labels: ['Normal', 'Atención', 'Riesgo', 'Crítico'],
      datasets: [{
        data: [conteo.normal, conteo.atencion, conteo.riesgo, conteo.critico],
        backgroundColor: ['#0f9d58', '#b8860b', '#c05621', '#c0392b'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
    }
  });
}

function abrirModalAtenderSolicitud(id) {
  const s = DB.solicitudesEdicion.find(x => x.id === id);
  if (!s) return;
  openModal(`Solicitud de Edición — ${escapeHTML(s.negocioNombre)}`, `
    <div class="form-grid-2">
      ${field('Negocio', s.negocioNombre)}
      ${field('Cliente', s.clienteNombre)}
    </div>
    <div class="field" style="margin-bottom:12px;">
      <label>Mensaje del cliente</label>
      <div style="background:#f8fafc;border:1px solid var(--border-color);border-radius:8px;padding:10px;font-size:.85rem;color:#334155;">${escapeHTML(s.mensaje)}</div>
    </div>
    <div class="field" style="margin-bottom:16px;">
      <label>Respuesta del Administrador <span class="req">*</span></label>
      <textarea class="form-control" rows="4" id="se-respuesta" placeholder="Escribe aquí la confirmación del cambio o la respuesta para el cliente...">${escapeHTML(s.respuesta || '')}</textarea>
    </div>
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <button class="btn-danger" onclick="eliminarSolicitudEdicion(${id})"><i class="fa-solid fa-trash"></i> Eliminar solicitud</button>
      <div style="display:flex;gap:10px;">
        <button class="btn-secondary" onclick="closeModal()">Cerrar</button>
        <button class="btn-main" onclick="guardarRespuestaSolicitud(${id})"><i class="fa-solid fa-paper-plane"></i> Guardar y Notificar al Cliente</button>
      </div>
    </div>
  `);
}

function guardarRespuestaSolicitud(id) {
  const s = DB.solicitudesEdicion.find(x => x.id === id);
  if (!s) return;
  const resp = el('se-respuesta').value.trim();
  if (!resp) { mostrarNotificacion('Escribe una respuesta para el cliente', true); return; }
  s.respuesta = resp;
  s.estado = 'Atendida';
  s.fechaRespuesta = fechaHoyLocal();
  crearNotificacion('client', s.clienteId, 'Solicitud de edición respondida', `El administrador respondió a tu solicitud: "${resp.slice(0, 60)}..."`, 'solicitud');
  registrarAuditoria('Solicitud de edición atendida', s.negocioNombre);
  guardarEstado();
  closeModal();
  mostrarNotificacion('Respuesta guardada y notificada al cliente');
  navegar('a-dashboard');
}

/* Clientes */
function renderAdminClientes() {
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Clientes Registrados</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input class="form-control" style="max-width:240px;padding:6px 12px;font-size:.82rem;" placeholder="Buscar cliente o negocio..." id="buscar-cliente" oninput="filtrarClientesAdmin()">
        <button class="btn-main" onclick="abrirModalRegistrarCliente()"><i class="fa-solid fa-plus"></i> Registrar Cliente</button>
      </div>
    </div>
    <div class="table-scroll" id="tabla-clientes-admin">${tablaClientesAdmin(DB.clientes)}</div>
  </div>`;
}

function tablaClientesAdmin(list) {
  return `<table>
    <thead><tr><th>Negocio</th><th>Cliente</th><th>Teléfono</th><th>Ciudad</th><th>Ventas Mes</th><th>Utilidad</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>
      ${list.length ? list.map(c => `<tr>
        <td><b>${escapeHTML(c.negocio.nombre)}</b><br><small style="color:var(--text-muted);">${escapeHTML(c.negocio.tipo)}</small></td>
        <td>${escapeHTML(c.nombre)}</td>
        <td>${escapeHTML(c.telefono)}</td>
        <td>${escapeHTML(c.negocio.ciudad)}</td>
        <td>${formatCOP(c.resultados.ventas)}</td>
        <td>${formatCOP(c.resultados.utilidad)}</td>
        <td>${badgeEstado(c.estado)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn-secondary" onclick="verClienteDetalle(${c.id})">Ficha</button>
          <button class="btn-danger" onclick="eliminarCliente(${c.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('') : `<tr><td colspan="8" class="empty-state">No se encontraron clientes.</td></tr>`}
    </tbody>
  </table>`;
}

function filtrarClientesAdmin() {
  const q = (el('buscar-cliente')?.value || '').toLowerCase().trim();
  const filtrados = DB.clientes.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.negocio.nombre.toLowerCase().includes(q) ||
    c.negocio.ciudad.toLowerCase().includes(q)
  );
  el('tabla-clientes-admin').innerHTML = tablaClientesAdmin(filtrados);
}

function abrirModalRegistrarCliente() {
  openModal('Registrar Nuevo Cliente', `
    <div class="form-box">
      <h4>Datos Personales</h4>
      <div class="form-grid-3">
        <div class="field"><label>Nombre completo <span class="req">*</span></label><input class="form-control" id="nc-nombre"></div>
        <div class="field"><label>Documento</label><input class="form-control" id="nc-documento"></div>
        <div class="field"><label>Teléfono <span class="req">*</span></label><input class="form-control" id="nc-telefono"></div>
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Correo</label><input type="email" class="form-control" id="nc-correo"></div>
        <div class="field"><label>Dirección</label><input class="form-control" id="nc-direccion"></div>
      </div>
      <div class="field"><label>Contraseña de acceso <span class="req">*</span></label>
        <input type="password" class="form-control" id="nc-password" placeholder="Mínimo 6 caracteres">
      </div>
    </div>
    <div class="form-box">
      <h4>Datos del Negocio</h4>
      <div class="form-grid-3">
        <div class="field"><label>Nombre del negocio <span class="req">*</span></label><input class="form-control" id="nc-neg-nombre"></div>
        <div class="field"><label>Tipo de negocio</label><select class="form-control" id="nc-neg-tipo">${DB.categorias.map(cat => `<option>${escapeHTML(cat)}</option>`).join('')}</select></div>
        <div class="field"><label>Ciudad <span class="req">*</span></label><input class="form-control" id="nc-neg-ciudad"></div>
      </div>
      <div class="form-grid-3">
        <div class="field"><label>Dirección del negocio</label><input class="form-control" id="nc-neg-dir"></div>
        <div class="field"><label>Fecha de inicio</label><input type="date" class="form-control" id="nc-neg-fecha" value="${fechaHoyLocal()}"></div>
        <div class="field"><label>Número de empleados</label><input type="number" min="1" class="form-control" id="nc-neg-emp" value="1"></div>
      </div>
      <div class="field"><label>Descripción del negocio</label><textarea class="form-control" rows="2" id="nc-neg-desc"></textarea></div>
    </div>
    <button class="btn-main" onclick="guardarNuevoCliente()"><i class="fa-solid fa-floppy-disk"></i> Guardar Cliente</button>
  `);
}

function guardarNuevoCliente() {
  const nombre = el('nc-nombre').value.trim();
  const telefono = el('nc-telefono').value.trim();
  const negNombre = el('nc-neg-nombre').value.trim();
  const ciudad = el('nc-neg-ciudad').value.trim();
  const password = el('nc-password').value;
  if (!nombre || !telefono || !negNombre || !ciudad) {
    mostrarNotificacion('Complete todos los campos obligatorios (*)', true);
    return;
  }
  if (!password || password.length < 6) {
    mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', true);
    return;
  }

  const id = DB.nextId.cliente++;
  DB.clientes.push({
    id, nombre, documento: el('nc-documento').value.trim(), telefono,
    correo: el('nc-correo').value.trim(), direccion: el('nc-direccion').value.trim(),
    negocio: {
      nombre: negNombre, tipo: el('nc-neg-tipo').value, direccion: el('nc-neg-dir').value.trim(),
      ciudad, fechaInicio: el('nc-neg-fecha').value || fechaHoyLocal(),
      descripcion: el('nc-neg-desc').value.trim(), empleados: Number(el('nc-neg-emp').value) || 1
    },
    inversion: { solicitado: 0, aprobado: 0, recibido: 0, fecha: '', tipo: '', participacion: 0, destino: '', estado: 'Pendiente', rentabilidad: 0 },
    resultados: { ventas: 0, gastos: 0, utilidad: 0, inventario: 0, deudas: 0, metas: 0 },
    estado: 'normal',
    proceso: {
      requisitos: { antiguedad:false,documentacion:false,evidenciaVentas:false,estadosFinancieros:false,referencias:false,visitaTrabajador:false,evaluacionRiesgo:false },
      etapas: { contrato:false,desembolso:false,seguimientoSemanal:false,reporte:false,liquidacion:false,revisionMensual:false }
    }
  });

  DB.usuarios.push({ id: DB.nextId.usuario++, nombre, rol: 'client', entidadId: id, entidadNombre: negNombre, password, activo: true });

  registrarAuditoria('Cliente y usuario creados', `${nombre} — ${negNombre}`);
  closeModal();
  guardarEstado();
  mostrarNotificacion('Cliente registrado con acceso creado correctamente');
  navegar('a-clientes');
}

function eliminarCliente(id) {
  const c = getCliente(id);
  if (!c) return;
  confirmarAccion(`¿Eliminar al cliente ${c.nombre} y su negocio ${c.negocio.nombre}?`, () => {
    DB.clientes = DB.clientes.filter(x => x.id !== id);
    DB.seguimientos = DB.seguimientos.filter(s => s.clienteId !== id);
    DB.usuarios = DB.usuarios.filter(u => !(u.rol === 'client' && u.entidadId === id));
    DB.trabajadores.forEach(t => { t.negocios = t.negocios.filter(nid => nid !== id); });
    registrarAuditoria('Cliente eliminado', c.negocio.nombre);
    guardarEstado();
    mostrarNotificacion('Cliente eliminado correctamente');
    navegar('a-clientes');
  });
}

const REQUISITOS_LABELS = {
  antiguedad: 'Meses mínimos de funcionamiento',
  documentacion: 'Documentación legal completa',
  evidenciaVentas: 'Evidencia histórica de ventas',
  estadosFinancieros: 'Estados financieros básicos',
  referencias: 'Referencias comerciales y personales',
  visitaTrabajador: 'Visita de verificación en campo realizada',
  evaluacionRiesgo: 'Evaluación de riesgo favorable'
};

const ETAPAS_LABELS = {
  contrato: 'Contrato firmado',
  desembolso: 'Desembolso / entrega de capital realizada',
  seguimientoSemanal: 'Seguimiento semanal activo',
  reporte: 'Reporte mensual generado',
  liquidacion: 'Liquidación periódica al día',
  revisionMensual: 'Revisión mensual completada'
};

function verClienteDetalle(id) {
  const c = getCliente(id);
  if (!c) return;
  const p = asegurarProcesoCliente(c);
  const n = c.negocio;
  const r = c.resultados;
  const inv = c.inversion;
  const hist = seguimientosDeCliente(c.id);
  const meses = mesesDesde(n.fechaInicio);
  const mesesMinimos = DB.parametros.mesesMinimoFuncionamiento;
  const antiguedadOk = meses !== null && meses >= mesesMinimos;

  const totalReq = Object.keys(REQUISITOS_LABELS).length;
  const cumplidos = Object.values(p.requisitos).filter(Boolean).length;
  const score = Math.round((cumplidos / totalReq) * 100);
  const puntajeMinimo = DB.parametros.puntajeMinimoAprobacion;
  const esAprobable = score >= puntajeMinimo;

  openModal(`${escapeHTML(n.nombre)} — Ficha Completa`, `
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('cficha','cficha-datos', this)">Datos Generales</button>
      <button class="tab-btn" onclick="switchTab('cficha','cficha-proceso', this)">Proceso de Inversión</button>
      <button class="tab-btn" onclick="switchTab('cficha','cficha-resultados', this)">Resultados Actuales</button>
      <button class="tab-btn" onclick="switchTab('cficha','cficha-historial', this)">Historial Visitas</button>
    </div>

    <div class="tab-content active" id="cficha-datos" data-tabgroup="cficha">
      <div class="form-box">
        <h4>Datos del Cliente</h4>
        <div class="form-grid-3">${field('Nombre', c.nombre)}${field('Documento', c.documento)}${field('Teléfono', c.telefono)}</div>
        <div class="form-grid-2">${field('Correo', c.correo)}${field('Dirección', c.direccion)}</div>
      </div>
      <div class="form-box" style="margin-bottom:0;">
        <h4>Datos del Negocio</h4>
        <div class="form-grid-3">${field('Nombre', n.nombre)}${field('Tipo', n.tipo)}${field('Ciudad', n.ciudad)}</div>
        <div class="form-grid-3">${field('Dirección', n.direccion)}${field('Fecha de inicio', fechaLarga(n.fechaInicio))}${field('Empleados', n.empleados)}</div>
        ${field('Descripción', n.descripcion)}
      </div>
    </div>

    <div class="tab-content" id="cficha-proceso" data-tabgroup="cficha">
      <div class="form-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h4>Requisitos Previos</h4>
          <span style="font-weight:800;color:${esAprobable ? 'var(--success-green)' : 'var(--danger-red)'};font-size:.85rem;">Puntaje: ${score}% (Mínimo: ${puntajeMinimo}%)</span>
        </div>
        <div class="progress-bar-track" style="margin-bottom:14px;"><div class="progress-bar-fill" style="background:${esAprobable ? 'var(--success-green)' : 'var(--warning-amber)'};width:${score}%;"></div></div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${Object.entries(REQUISITOS_LABELS).map(([k, lbl]) => `
            <label style="display:flex;align-items:center;gap:8px;font-size:.84rem;color:#334155;cursor:pointer;">
              <input type="checkbox" id="req-${k}-${c.id}" ${p.requisitos[k] ? 'checked' : ''} style="width:auto;"> ${lbl}
            </label>
          `).join('')}
        </div>
        <button class="btn-main" style="margin-top:12px;" onclick="guardarRequisitosProceso(${c.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Requisitos</button>
      </div>

      <div class="form-box" style="margin-bottom:0;">
        <h4>Etapas del Ciclo de Inversión</h4>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${Object.entries(ETAPAS_LABELS).map(([k, lbl]) => `
            <label style="display:flex;align-items:center;gap:8px;font-size:.84rem;color:#334155;cursor:pointer;">
              <input type="checkbox" id="etapa-${k}-${c.id}" ${p.etapas[k] ? 'checked' : ''} style="width:auto;"> ${lbl}
            </label>
          `).join('')}
        </div>
        <button class="btn-main" style="margin-top:12px;" onclick="guardarEtapasProceso(${c.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Etapas</button>
        <button class="btn-secondary" style="margin-top:12px;margin-left:8px;" onclick="verContratoInversion(${c.id})"><i class="fa-solid fa-file-contract"></i> Ver / Imprimir Contrato</button>
      </div>
    </div>

    <div class="tab-content" id="cficha-resultados" data-tabgroup="cficha">
      <div class="form-box" style="margin-bottom:0;">
        <h4>Editar Resultados Financieros</h4>
        <div class="form-grid-3">
          <div class="field"><label>Ventas</label><input type="number" class="form-control" id="res-ventas-${c.id}" value="${r.ventas}"></div>
          <div class="field"><label>Gastos</label><input type="number" class="form-control" id="res-gastos-${c.id}" value="${r.gastos}"></div>
          <div class="field"><label>Utilidad</label><input type="number" class="form-control" id="res-utilidad-${c.id}" value="${r.utilidad}"></div>
        </div>
        <div class="form-grid-3">
          <div class="field"><label>Inventario</label><input type="number" class="form-control" id="res-inventario-${c.id}" value="${r.inventario}"></div>
          <div class="field"><label>Deudas</label><input type="number" class="form-control" id="res-deudas-${c.id}" value="${r.deudas}"></div>
          <div class="field"><label>Meta Mensual</label><input type="number" class="form-control" id="res-metas-${c.id}" value="${r.metas}"></div>
        </div>
        <button class="btn-main" onclick="guardarResultadosCliente(${c.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Resultados</button>
      </div>
    </div>

    <div class="tab-content" id="cficha-historial" data-tabgroup="cficha">
      <div class="table-scroll"><table>
        <thead><tr><th>Semana</th><th>Fecha</th><th>Asesor</th><th>Ventas</th><th>Utilidad</th><th>Alerta</th><th></th></tr></thead>
        <tbody>
          ${hist.length ? hist.map(s => `<tr>
            <td>${escapeHTML(s.semana)}</td>
            <td>${fechaLarga(s.fecha)}</td>
            <td>${nombreTrabajador(s.trabajadorId)}</td>
            <td>${formatCOP(s.ventas)}</td>
            <td>${formatCOP(s.utilidad)}</td>
            <td>${badgeEstado(s.estado)}</td>
            <td><button class="btn-secondary" onclick="verSeguimientoDetalle(${s.id})">Ver</button></td>
          </tr>`).join('') : `<tr><td colspan="7" class="empty-state">No hay seguimientos registrados.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `);
}

function guardarRequisitosProceso(id) {
  const c = getCliente(id);
  if (!c) return;
  const p = asegurarProcesoCliente(c);
  Object.keys(REQUISITOS_LABELS).forEach(k => {
    const box = el(`req-${k}-${id}`);
    if (box) p.requisitos[k] = box.checked;
  });
  registrarAuditoria('Requisitos de inversión actualizados', c.negocio.nombre);
  guardarEstado();
  mostrarNotificacion('Requisitos actualizados');
}

function guardarEtapasProceso(id) {
  const c = getCliente(id);
  if (!c) return;
  const p = asegurarProcesoCliente(c);
  Object.keys(ETAPAS_LABELS).forEach(k => {
    const box = el(`etapa-${k}-${id}`);
    if (box) p.etapas[k] = box.checked;
  });
  registrarAuditoria('Etapas de inversión actualizadas', c.negocio.nombre);
  guardarEstado();
  mostrarNotificacion('Etapas actualizadas');
}

function guardarResultadosCliente(id) {
  const c = getCliente(id);
  if (!c) return;
  c.resultados.ventas = Number(el(`res-ventas-${id}`).value) || 0;
  c.resultados.gastos = Number(el(`res-gastos-${id}`).value) || 0;
  c.resultados.utilidad = Number(el(`res-utilidad-${id}`).value) || 0;
  c.resultados.inventario = Number(el(`res-inventario-${id}`).value) || 0;
  c.resultados.deudas = Number(el(`res-deudas-${id}`).value) || 0;
  c.resultados.metas = Number(el(`res-metas-${id}`).value) || 0;
  registrarAuditoria('Resultados de negocio editados', c.negocio.nombre);
  guardarEstado();
  mostrarNotificacion('Resultados actualizados');
}

/* Trabajadores */
function renderAdminTrabajadores() {
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Trabajadores de Campo</h3>
      <button class="btn-main" onclick="abrirModalRegistrarTrabajador()"><i class="fa-solid fa-user-plus"></i> Registrar Trabajador</button>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Negocios Asignados</th><th>Seguimientos Realizados</th><th>Acción</th></tr></thead>
      <tbody>
        ${DB.trabajadores.length ? DB.trabajadores.map(t => `<tr>
          <td><b>${escapeHTML(t.nombre)}</b></td>
          <td>${escapeHTML(t.telefono)}</td>
          <td>${t.negocios ? t.negocios.length : 0}</td>
          <td>${seguimientosDeTrabajador(t.id).length}</td>
          <td style="display:flex;gap:6px;"><button class="btn-secondary" onclick="verTrabajadorDetalle(${t.id})">Ver</button><button class="btn-danger" onclick="eliminarTrabajador(${t.id})"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('') : `<tr><td colspan="5" class="empty-state">No hay trabajadores registrados.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function abrirModalRegistrarTrabajador() {
  openModal('Registrar Nuevo Trabajador', `
    <div class="form-grid-2">
      <div class="field"><label>Nombre <span class="req">*</span></label><input class="form-control" id="nt-nombre"></div>
      <div class="field"><label>Teléfono <span class="req">*</span></label><input class="form-control" id="nt-telefono"></div>
    </div>
    <div class="field" style="margin:14px 0;">
      <label>Contraseña de acceso <span class="req">*</span></label>
      <input type="password" class="form-control" id="nt-password" placeholder="Mínimo 6 caracteres">
    </div>
    <div class="field" style="margin:14px 0;"><label>Negocios a asignar</label>
      <select class="form-control" id="nt-negocios" multiple size="5">
        ${DB.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.negocio.nombre)} — ${escapeHTML(c.nombre)}</option>`).join('')}
      </select>
    </div>
    <button class="btn-main" onclick="guardarNuevoTrabajador()"><i class="fa-solid fa-floppy-disk"></i> Registrar Trabajador</button>
  `);
}

function guardarNuevoTrabajador() {
  const nombre = el('nt-nombre').value.trim();
  const telefono = el('nt-telefono').value.trim();
  const password = el('nt-password').value;
  if (!nombre || !telefono) { mostrarNotificacion('Complete nombre y teléfono', true); return; }
  if (!password || password.length < 6) { mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', true); return; }

  const sel = Array.from(el('nt-negocios').selectedOptions).map(o => Number(o.value)).filter(v => !isNaN(v));
  const id = DB.nextId.trabajador++;
  DB.trabajadores.push({ id, nombre, telefono, negocios: sel });

  DB.usuarios.push({ id: DB.nextId.usuario++, nombre, rol: 'worker', entidadId: id, entidadNombre: nombre, password, activo: true });

  registrarAuditoria('Trabajador y usuario creados', nombre);
  closeModal();
  guardarEstado();
  mostrarNotificacion('Trabajador registrado con acceso creado correctamente');
  navegar('a-trabajadores');
}

function eliminarTrabajador(id) {
  const t = getTrabajador(id);
  if (!t) return;
  confirmarAccion(`¿Eliminar al trabajador ${t.nombre}?`, () => {
    DB.trabajadores = DB.trabajadores.filter(x => x.id !== id);
    DB.usuarios = DB.usuarios.filter(u => !(u.rol === 'worker' && u.entidadId === id));
    registrarAuditoria('Trabajador y su usuario eliminados', t.nombre);
    guardarEstado();
    mostrarNotificacion('Trabajador eliminado');
    navegar('a-trabajadores');
  });
}

function verTrabajadorDetalle(id) {
  const t = getTrabajador(id);
  if (!t) return;
  const negocios = t.negocios.map(nid => getCliente(nid)).filter(Boolean);
  const refSemana = infoSemanaISO(fechaHoyLocal());
  const pendientes = negocios.filter(c => !DB.seguimientos.some(s => s.clienteId === c.id && esMismaSemanaISO(s.fecha, refSemana)));
  openModal(`${escapeHTML(t.nombre)} — Asesor de Campo`, `
    <div class="form-grid-2">${field('Teléfono', t.telefono)}${field('Negocios asignados', negocios.length)}</div>
    <div class="form-box">
      <h4>Negocios Asignados</h4>
      <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px;">Solo el Administrador puede asignar o quitar negocios a este trabajador.</p>
      <select class="form-control" id="td-negocios" multiple size="8">
        ${DB.clientes.map(c => `<option value="${c.id}" ${t.negocios.includes(c.id) ? 'selected' : ''}>${escapeHTML(c.negocio.nombre)} — ${escapeHTML(c.nombre)}</option>`).join('')}
      </select>
      <button class="btn-main" style="margin-top:10px;" onclick="guardarAsignacionesTrabajador(${t.id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Asignaciones</button>
    </div>
    <div class="form-box" style="margin-bottom:0;">
      <h4>Seguimientos: Realizados (${seguimientosDeTrabajador(id).length}) / Pendientes (${pendientes.length})</h4>
      ${pendientes.length ? `<div class="chip-list">${pendientes.map(c => `<span class="chip" style="background:var(--warning-bg);color:var(--warning-amber);">${escapeHTML(c.negocio.nombre)}</span>`).join('')}</div>` : `<p style="font-size:.85rem;color:var(--success-green);">Todos los negocios están al día esta semana.</p>`}
    </div>
  `);
}

function guardarAsignacionesTrabajador(id) {
  const t = getTrabajador(id);
  if (!t) return;
  const sel = Array.from(el('td-negocios').selectedOptions).map(o => Number(o.value)).filter(v => !isNaN(v));
  t.negocios = sel;
  registrarAuditoria('Negocios asignados actualizados', t.nombre);
  guardarEstado();
  mostrarNotificacion('Asignaciones actualizadas');
  verTrabajadorDetalle(id);
}

/* Inversiones */
function renderAdminInversiones() {
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Inversiones Activas</h3>
      <button class="btn-main" onclick="abrirModalNuevaInversion()"><i class="fa-solid fa-plus"></i> Nueva Inversión</button>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>Cliente</th><th>Capital</th><th>Fecha</th><th>Tipo</th><th>Participación</th><th>Estado</th><th>Rentabilidad</th></tr></thead>
      <tbody>
        ${DB.clientes.length ? DB.clientes.map(c => `<tr>
          <td><b>${escapeHTML(c.negocio.nombre)}</b><br><small style="color:var(--text-muted);">${escapeHTML(c.nombre)}</small></td>
          <td>${formatCOP(c.inversion.aprobado)}</td>
          <td>${fechaLarga(c.inversion.fecha)}</td>
          <td>${escapeHTML(c.inversion.tipo)}</td>
          <td>${c.inversion.participacion}%</td>
          <td>${escapeHTML(c.inversion.estado)}</td>
          <td style="color:${c.inversion.rentabilidad >= 0 ? 'var(--success-green)' : 'var(--danger-red)'};font-weight:700;">${c.inversion.rentabilidad}%</td>
        </tr>`).join('') : `<tr><td colspan="7" class="empty-state">No hay inversiones registradas.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function abrirModalNuevaInversion() {
  if (!DB.clientes.length) { mostrarNotificacion('Registra al menos un cliente primero', true); return; }
  openModal('Registrar Nueva Inversión', `
    <div class="field" style="margin-bottom:14px;"><label>Cliente</label>
      <select class="form-control" id="ni-cliente">${DB.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.negocio.nombre)} — ${escapeHTML(c.nombre)}</option>`).join('')}</select>
    </div>
    <div class="form-grid-3">
      <div class="field"><label>Capital aprobado <span class="req">*</span></label><input type="number" min="0" class="form-control" id="ni-capital"></div>
      <div class="field"><label>Fecha</label><input type="date" class="form-control" id="ni-fecha" value="${fechaHoyLocal()}"></div>
      <div class="field"><label>Tipo</label><input class="form-control" id="ni-tipo" value="Capital de expansión"></div>
    </div>
    <div class="field" style="margin-bottom:14px;"><label>Participación JORAN (%)</label><input type="number" min="0" max="100" class="form-control" id="ni-participacion" value="10"></div>
    <button class="btn-main" onclick="guardarNuevaInversion()"><i class="fa-solid fa-floppy-disk"></i> Registrar Inversión</button>
  `);
}

function guardarNuevaInversion() {
  const capital = Number(el('ni-capital').value) || 0;
  if (capital <= 0) { mostrarNotificacion('Ingrese un capital mayor a cero', true); return; }
  const c = getCliente(Number(el('ni-cliente').value));
  if (c) {
    c.inversion.aprobado += capital;
    c.inversion.recibido = c.inversion.aprobado;
    c.inversion.fecha = el('ni-fecha').value || fechaHoyLocal();
    c.inversion.tipo = el('ni-tipo').value.trim() || c.inversion.tipo;
    c.inversion.participacion = Number(el('ni-participacion').value) || c.inversion.participacion;
    c.inversion.estado = 'Activa';
    registrarAuditoria('Inversión registrada', `${c.negocio.nombre} — ${formatCOP(capital)}`);
  }
  closeModal();
  guardarEstado();
  mostrarNotificacion('Inversión registrada correctamente');
  navegar('a-inversiones');
}

/* Solicitudes */
function renderAdminSolicitudes() {
  const l = DB.solicitudesInversion.slice().sort((a, b) => b.id - a.id);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Solicitudes de Inversión</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Cliente</th><th>Negocio</th><th>Monto</th><th>Destino</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${l.length ? l.map(s => `<tr>
          <td>${fechaLarga(s.fecha)}</td>
          <td>${escapeHTML(s.clienteNombre)}</td>
          <td>${escapeHTML(s.negocioNombre)}</td>
          <td>${formatCOP(s.montoSolicitado)}</td>
          <td>${escapeHTML(s.destino)}</td>
          <td>${nombreEstadoSolicitud(s.estado)}</td>
          <td>${['Pendiente', 'EnRevision'].includes(s.estado) ? `<button class="btn-main" onclick="abrirModalResolverSolicitud(${s.id})">Revisar</button>` : '-'}</td>
        </tr>`).join('') : '<tr><td colspan="7" class="empty-state">No hay solicitudes.</td></tr>'}
      </tbody>
    </table></div>
  </div>`;
}

function abrirModalResolverSolicitud(id) {
  const s = DB.solicitudesInversion.find(x => x.id === id);
  if (!s) return;
  openModal('Resolver Solicitud de Inversión', `
    <p style="margin-bottom:12px;"><b>${escapeHTML(s.negocioNombre)}</b> — ${formatCOP(s.montoSolicitado)}</p>
    <div class="field"><label>Decisión</label><select class="form-control" id="rs-estado"><option>Aprobada</option><option>Rechazada</option><option>EnRevision</option></select></div>
    <div class="field" style="margin-bottom:14px;"><label>Comentario</label><textarea class="form-control" id="rs-comentario" rows="3" placeholder="Mensaje para el cliente..."></textarea></div>
    <button class="btn-main" onclick="resolverSolicitud(${id})"><i class="fa-solid fa-check"></i> Guardar Decisión</button>
  `);
}

function resolverSolicitud(id) {
  const s = DB.solicitudesInversion.find(x => x.id === id);
  if (!s) return;
  const est = el('rs-estado').value, com = el('rs-comentario').value.trim(), c = getCliente(s.clienteId);
  s.estado = est; s.comentario = com; s.fechaRespuesta = fechaHoyLocal();
  if (c) {
    c.inversion.estado = est === 'Aprobada' ? 'Activa' : (est === 'Rechazada' ? 'Rechazada' : 'En revisión');
    if (est === 'Aprobada') {
      c.inversion.aprobado = s.montoSolicitado;
      c.inversion.recibido = s.montoSolicitado;
      c.inversion.fecha = fechaHoyLocal();
    }
  }
  crearNotificacion('client', s.clienteId, 'Actualización de solicitud', `Tu solicitud está ${est.toLowerCase()}. ${com}`, 'solicitud');
  registrarAuditoria('Solicitud resuelta', `${s.negocioNombre} — ${est}`);
  guardarEstado();
  closeModal();
  navegar('a-solicitudes');
}

/* Pagos */
function renderAdminPagos() {
  const l = DB.pagos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Pagos y Cartera</h3><button class="btn-main" onclick="abrirModalRegistrarPago()"><i class="fa-solid fa-plus"></i> Registrar pago</button></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Negocio</th><th>Concepto</th><th>Tipo</th><th>Monto</th><th>Estado</th></tr></thead>
      <tbody>
        ${l.length ? l.map(p => `<tr>
          <td>${fechaLarga(p.fecha)}</td>
          <td>${nombreNegocio(p.clienteId)}</td>
          <td>${escapeHTML(p.concepto)}</td>
          <td>${escapeHTML(p.tipo)}</td>
          <td>${formatCOP(p.monto)}</td>
          <td><span class="badge badge-green">${escapeHTML(p.estado)}</span></td>
        </tr>`).join('') : '<tr><td colspan="6" class="empty-state">No hay pagos registrados.</td></tr>'}
      </tbody>
    </table></div>
  </div>`;
}

function abrirModalRegistrarPago() {
  openModal('Registrar Pago', `
    <div class="field"><label>Negocio</label><select class="form-control" id="pg-cliente">${DB.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.negocio.nombre)}</option>`).join('')}</select></div>
    <div class="form-grid-2">
      <div class="field"><label>Monto (COP) *</label><input type="number" min="1" class="form-control" id="pg-monto"></div>
      <div class="field"><label>Fecha</label><input type="date" class="form-control" id="pg-fecha" value="${fechaHoyLocal()}"></div>
    </div>
    <div class="form-grid-2">
      <div class="field"><label>Tipo</label><select class="form-control" id="pg-tipo"><option value="recuperacion">Recuperación</option><option value="ganancia">Ganancia</option><option value="otro">Otro</option></select></div>
      <div class="field"><label>Estado</label><select class="form-control" id="pg-estado"><option>Confirmado</option><option>Pendiente</option></select></div>
    </div>
    <div class="field" style="margin-bottom:14px;"><label>Concepto</label><input class="form-control" id="pg-concepto" value="Abono a inversión"></div>
    <button class="btn-main" onclick="guardarPagoAdmin()"><i class="fa-solid fa-floppy-disk"></i> Guardar pago</button>
  `);
}

function guardarPagoAdmin() {
  const cid = Number(el('pg-cliente').value), m = Number(el('pg-monto').value) || 0;
  if (m <= 0) { mostrarNotificacion('Monto inválido', true); return; }
  const c = getCliente(cid);
  DB.pagos.unshift({ id: DB.nextId.pago++, clienteId: cid, monto: m, fecha: el('pg-fecha').value || fechaHoyLocal(), tipo: el('pg-tipo').value, estado: el('pg-estado').value, concepto: el('pg-concepto').value.trim() || 'Pago' });
  crearNotificacion('client', cid, 'Nuevo pago registrado', `Se registró pago de ${formatCOP(m)}.`, 'pago');
  registrarAuditoria('Pago registrado', `${c ? c.negocio.nombre : '-'} — ${formatCOP(m)}`);
  guardarEstado();
  closeModal();
  mostrarNotificacion('Pago registrado con éxito');
  navegar('a-pagos');
}

/* Alertas */
function renderAdminAlertas() {
  const l = DB.alertas.slice().sort((a, b) => b.id - a.id);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Centro de Alertas de Negocios</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Negocio</th><th>Asesor</th><th>Nivel</th><th>Motivo</th><th>Estado</th></tr></thead>
      <tbody>
        ${l.length ? l.map(a => `<tr>
          <td>${fechaLarga(a.fecha)}</td>
          <td>${nombreNegocio(a.clienteId)}</td>
          <td>${nombreTrabajador(a.trabajadorId)}</td>
          <td>${badgeEstado(a.nivel)}</td>
          <td>${escapeHTML(a.motivo)}</td>
          <td>${escapeHTML(a.estado)}</td>
        </tr>`).join('') : '<tr><td colspan="6" class="empty-state">No hay alertas activas.</td></tr>'}
      </tbody>
    </table></div>
  </div>`;
}

function abrirModalGenerarAlerta(clienteId, trabajadorId) {
  openModal('Generar Alerta de Riesgo', `
    <div class="field"><label>Nivel de Alerta</label>
      <select class="form-control" id="ga-nivel">
        <option value="atencion">🟡 Atención</option>
        <option value="riesgo">🟠 Riesgo</option>
        <option value="critico">🔴 Crítico</option>
      </select>
    </div>
    <div class="field" style="margin-bottom:14px;"><label>Motivo *</label><textarea class="form-control" rows="3" id="ga-motivo" placeholder="Describa la situación..."></textarea></div>
    <button class="btn-main" onclick="confirmarAlertaTrabajador(${clienteId},${trabajadorId})">Generar Alerta</button>
  `);
}

function confirmarAlertaTrabajador(c, t) {
  const m = el('ga-motivo').value.trim(), n = el('ga-nivel').value;
  if (!m) { mostrarNotificacion('Indica el motivo', true); return; }
  DB.alertas.unshift({ id: DB.nextId.alerta++, clienteId: c, trabajadorId: t, nivel: n, motivo: m, fecha: fechaHoyLocal(), estado: 'Abierta' });
  const cli = getCliente(c);
  if (cli) cli.estado = n;
  crearNotificacion('admin', null, `Alerta ${estadoInfo(n).label}`, `${cli ? cli.negocio.nombre : 'Negocio'}: ${m}`, 'alerta');
  registrarAuditoria('Alerta generada', m);
  guardarEstado();
  closeModal();
  mostrarNotificacion('Alerta enviada correctamente');
}

/* Seguimientos */
function renderAdminSeguimientos() {
  const all = [...DB.seguimientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Todos los Seguimientos</h3>
      <select class="form-control" style="max-width:200px;" id="filtro-estado-seg" onchange="filtrarSeguimientosAdmin()">
        <option value="">Todas las alertas</option>
        <option value="normal">🟢 Normal</option>
        <option value="atencion">🟡 Atención</option>
        <option value="riesgo">🟠 Riesgo</option>
        <option value="critico">🔴 Crítico</option>
      </select>
    </div>
    <div class="table-scroll" id="tabla-seguimientos-admin">${tablaSeguimientosAdmin(all)}</div>
  </div>`;
}

function tablaSeguimientosAdmin(list) {
  return `<table>
    <thead><tr><th>Fecha</th><th>Negocio</th><th>Asesor</th><th>Visita</th><th>Ventas</th><th>Gastos</th><th>Utilidad</th><th>Alerta</th><th>Próx. Visita</th><th>Evidencias</th><th></th></tr></thead>
    <tbody>
      ${list.length ? list.map(s => `<tr>
        <td>${fechaLarga(s.fecha)}</td>
        <td>${nombreNegocio(s.clienteId)}</td>
        <td>${nombreTrabajador(s.trabajadorId)}</td>
        <td>${s.visitaRealizada === false ? '<span class="badge badge-amber">No</span>' : '<span class="badge badge-green">Sí</span>'}</td>
        <td>${formatCOP(s.ventas)}</td>
        <td>${formatCOP(s.gastos)}</td>
        <td>${formatCOP(s.utilidad)}</td>
        <td>${badgeEstado(s.estado)}</td>
        <td>${s.proximaVisita ? fechaLarga(s.proximaVisita) : '-'}</td>
        <td>${(s.evidencias?.fotos || []).length + (s.evidencias?.documentos || []).length + (s.evidencias?.facturas || []).length} archivos</td>
        <td><button class="btn-secondary" onclick="verSeguimientoDetalle(${s.id})">Ver</button></td>
      </tr>`).join('') : `<tr><td colspan="11" class="empty-state">No hay seguimientos registrados.</td></tr>`}
    </tbody>
  </table>`;
}

function filtrarSeguimientosAdmin() {
  const val = el('filtro-estado-seg').value;
  const list = [...DB.seguimientos].filter(s => !val || s.estado === val).sort((a, b) => b.fecha.localeCompare(a.fecha));
  el('tabla-seguimientos-admin').innerHTML = tablaSeguimientosAdmin(list);
}

/* Reportes */
function renderAdminReportes() {
  if (!DB.clientes.length) {
    return `<div class="card-table"><div class="empty-state">No hay datos suficientes para generar reportes.</div></div>`;
  }
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Ventas por Negocio</h3></div>
    <canvas id="chart-ventas-negocio" height="90"></canvas>
  </div>
  <div class="card-table">
    <div class="card-table-header"><h3>Utilidad por Negocio</h3></div>
    <canvas id="chart-utilidad-negocio" height="90"></canvas>
  </div>
  <div class="card-table">
    <div class="card-table-header"><h3>Evolución Semanal (Utilidad Agregada)</h3></div>
    ${DB.seguimientos.length ? '<canvas id="chart-evolucion" height="90"></canvas>' : '<div class="empty-state">Sin seguimientos aún.</div>'}
  </div>`;
}

function afterAdminReportes() {
  if (!window.Chart || !DB.clientes.length) return;
  const labels = DB.clientes.map(c => c.negocio.nombre);
  const ventas = DB.clientes.map(c => c.resultados.ventas);
  const utilidades = DB.clientes.map(c => c.resultados.utilidad);

  crearGraficoSeguro('chart-ventas-negocio', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Ventas ($)', data: ventas, backgroundColor: '#0d2340' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  crearGraficoSeguro('chart-utilidad-negocio', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Utilidad ($)', data: utilidades, backgroundColor: '#0f9d58' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  if (DB.seguimientos.length) {
    const ordenados = [...DB.seguimientos].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const semanasMap = {};
    ordenados.forEach(s => { semanasMap[s.semana] = (semanasMap[s.semana] || 0) + s.utilidad; });
    crearGraficoSeguro('chart-evolucion', {
      type: 'line',
      data: { labels: Object.keys(semanasMap), datasets: [{ label: 'Utilidad total ($)', data: Object.values(semanasMap), borderColor: '#c9a227', backgroundColor: 'rgba(201,162,39,0.1)', fill: true, tension: 0.3 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }
}

/* ==========================================================================
   CONFIGURACIÓN - 8 PESTAÑAS Y CONTROL DE CONTRASEÑAS DEL ADMINISTRADOR
   ========================================================================== */
const CFG_MODULOS = [
  { grupo: 'client', id: 'c-inicio', label: 'Inicio' },
  { grupo: 'client', id: 'c-negocio', label: 'Mi Negocio' },
  { grupo: 'client', id: 'c-inversion', label: 'Mi Inversión' },
  { grupo: 'client', id: 'c-finanzas', label: 'Mis Finanzas' },
  { grupo: 'client', id: 'c-metas', label: 'Mis Metas' },
  { grupo: 'client', id: 'c-seguimientos', label: 'Seguimientos' },
  { grupo: 'client', id: 'c-perfil', label: 'Mi Perfil' },
  { grupo: 'client', id: 'c-notificaciones', label: 'Notificaciones' },
  { grupo: 'worker', id: 'w-inicio', label: 'Nuevo Seguimiento' },
  { grupo: 'worker', id: 'w-negocios', label: 'Mis Negocios' },
  { grupo: 'worker', id: 'w-seguimientos', label: 'Seguimientos Realizados' },
  { grupo: 'worker', id: 'w-pendientes', label: 'Seguimientos Pendientes' },
  { grupo: 'worker', id: 'w-perfil', label: 'Mi Perfil' },
  { grupo: 'worker', id: 'w-notificaciones', label: 'Notificaciones' },
  { grupo: 'admin', id: 'a-dashboard', label: 'Dashboard' },
  { grupo: 'admin', id: 'a-clientes', label: 'Clientes' },
  { grupo: 'admin', id: 'a-trabajadores', label: 'Trabajadores' },
  { grupo: 'admin', id: 'a-inversiones', label: 'Inversiones' },
  { grupo: 'admin', id: 'a-solicitudes', label: 'Solicitudes' },
  { grupo: 'admin', id: 'a-pagos', label: 'Pagos y Cartera' },
  { grupo: 'admin', id: 'a-alertas', label: 'Alertas' },
  { grupo: 'admin', id: 'a-seguimientos', label: 'Seguimientos' },
  { grupo: 'admin', id: 'a-reportes', label: 'Reportes' },
  { grupo: 'admin', id: 'a-configuracion', label: 'Configuración' }
];

function asegurarPermisosDefault() {
  if (!DB.permisos) DB.permisos = {};
  ['client', 'worker', 'admin'].forEach(rol => {
    if (!DB.permisos[rol]) DB.permisos[rol] = {};
    CFG_MODULOS.filter(m => m.grupo === rol).forEach(m => {
      if (DB.permisos[rol][m.id] === undefined) DB.permisos[rol][m.id] = true;
    });
  });
}

function itemsMenuFiltrados(rol, items) {
  asegurarPermisosDefault();
  return items.filter(it => it.id === 'a-configuracion' || it.id === 'a-dashboard' || DB.permisos[rol][it.id] !== false);
}

function renderAdminConfiguracion() {
  asegurarPermisosDefault();
  return `
  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('cfg','cfg-parametros', this)"><i class="fa-solid fa-sliders"></i> Parámetros</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-usuarios', this)"><i class="fa-solid fa-users-gear"></i> Usuarios</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-permisos', this)"><i class="fa-solid fa-lock"></i> Roles y Permisos</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-metas', this)"><i class="fa-solid fa-bullseye"></i> Metas</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-categorias', this)"><i class="fa-solid fa-tags"></i> Categorías</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-reglamento', this)"><i class="fa-solid fa-scale-balanced"></i> Reglamento de Inversión</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-auditoria', this)"><i class="fa-solid fa-clock-rotate-left"></i> Auditoría</button>
    <button class="tab-btn" onclick="switchTab('cfg','cfg-privacidad', this)"><i class="fa-solid fa-shield-halved"></i> Privacidad y Respaldo</button>
  </div>

  <div class="tab-content active" id="cfg-parametros" data-tabgroup="cfg">${renderCfgParametros()}</div>
  <div class="tab-content" id="cfg-usuarios" data-tabgroup="cfg">${renderCfgUsuarios()}</div>
  <div class="tab-content" id="cfg-permisos" data-tabgroup="cfg">${renderCfgPermisos()}</div>
  <div class="tab-content" id="cfg-metas" data-tabgroup="cfg">${renderCfgMetas()}</div>
  <div class="tab-content" id="cfg-categorias" data-tabgroup="cfg">${renderCfgCategorias()}</div>
  <div class="tab-content" id="cfg-reglamento" data-tabgroup="cfg">${renderCfgReglamento()}</div>
  <div class="tab-content" id="cfg-auditoria" data-tabgroup="cfg">${renderCfgAuditoria()}</div>
  <div class="tab-content" id="cfg-privacidad" data-tabgroup="cfg">${renderCfgPrivacidad()}</div>
  `;
}

function renderCfgParametros() {
  const p = DB.parametros;
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Parámetros Generales de la Plataforma</h3></div>
    <div class="form-grid-3">
      <div class="field"><label>Nombre de la Empresa</label><input class="form-control" value="${escapeHTML(p.nombreEmpresa)}" id="cfg-nombre"></div>
      <div class="field"><label>Moneda principal</label><input class="form-control" value="${escapeHTML(p.moneda)}" id="cfg-moneda"></div>
      <div class="field"><label>Periodo de seguimiento</label><input class="form-control" value="${escapeHTML(p.periodoSeguimiento)}" id="cfg-periodo"></div>
    </div>
    <div class="form-grid-2">
      <div class="field"><label>Meta mínima cumplimiento (%)</label><input type="number" min="0" max="100" class="form-control" value="${p.metaCumplimientoMinimo}" id="cfg-cumplimiento"></div>
      <div class="field"><label>Fondo de Capital Total de JORAN (COP)</label><input type="number" class="form-control" value="${DB.capital.total}" id="cfg-cap-total"></div>
    </div>
    <button class="btn-main" onclick="guardarConfiguracionAdmin()"><i class="fa-solid fa-floppy-disk"></i> Guardar Configuración</button>
  </div>`;
}

function guardarConfiguracionAdmin() {
  const nombre = el('cfg-nombre').value.trim();
  if (!nombre) { mostrarNotificacion('El nombre de la empresa no puede quedar vacío', true); return; }
  DB.parametros.nombreEmpresa = nombre;
  DB.parametros.moneda = el('cfg-moneda').value.trim() || DB.parametros.moneda;
  DB.parametros.periodoSeguimiento = el('cfg-periodo').value.trim() || DB.parametros.periodoSeguimiento;
  DB.parametros.metaCumplimientoMinimo = Number(el('cfg-cumplimiento').value) || 80;
  DB.capital.total = Number(el('cfg-cap-total').value) || DB.capital.total;
  registrarAuditoria('Parámetros generales actualizados', '');
  guardarEstado();
  mostrarNotificacion('Configuración guardada correctamente');
}

function nombreRol(rol) { return rol === 'client' ? 'Cliente' : rol === 'worker' ? 'Trabajador' : 'Administrador'; }

/* Protección de cuentas de administrador: siempre debe quedar al menos un
   administrador activo en la plataforma, y nadie puede desactivarse o
   eliminarse a sí mismo mientras está en sesión. */
function adminsActivos() {
  return DB.usuarios.filter(u => u.rol === 'admin' && u.activo);
}
function esUltimoAdminActivo(u) {
  return u.rol === 'admin' && u.activo && adminsActivos().length <= 1;
}
function esMiPropiaCuenta(u) {
  return SESSION.rol === 'admin' && u.id === SESSION.usuarioId;
}

/* GESTIÓN AVANZADA DE USUARIOS Y CONTRASEÑAS */
let _todasPasswordsVisibles = false;

function toggleVerPasswordUsuario(id, btn) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  const span = el(`user-pass-${id}`);
  if (!span) return;
  const isHidden = span.getAttribute('data-shown') !== 'true';
  if (isHidden) {
    span.innerText = u.password || '(sin clave)';
    span.setAttribute('data-shown', 'true');
    span.style.letterSpacing = 'normal';
    span.style.fontWeight = '700';
    span.style.color = 'var(--navy)';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    span.innerText = '••••••••';
    span.setAttribute('data-shown', 'false');
    span.style.letterSpacing = '2px';
    span.style.fontWeight = 'normal';
    span.style.color = 'inherit';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

function toggleTodasPasswords(btn) {
  _todasPasswordsVisibles = !_todasPasswordsVisibles;
  DB.usuarios.forEach(u => {
    const span = el(`user-pass-${u.id}`);
    const btnRow = el(`btn-eye-${u.id}`);
    if (span) {
      if (_todasPasswordsVisibles) {
        span.innerText = u.password || '(sin clave)';
        span.setAttribute('data-shown', 'true');
        span.style.letterSpacing = 'normal';
        span.style.fontWeight = '700';
        span.style.color = 'var(--navy)';
        if (btnRow) btnRow.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        span.innerText = '••••••••';
        span.setAttribute('data-shown', 'false');
        span.style.letterSpacing = '2px';
        span.style.fontWeight = 'normal';
        span.style.color = 'inherit';
        if (btnRow) btnRow.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    }
  });
  if (btn) {
    btn.innerHTML = _todasPasswordsVisibles
      ? '<i class="fa-solid fa-eye-slash"></i> Ocultar todas'
      : '<i class="fa-solid fa-eye"></i> Ver todas las contraseñas';
  }
}

function copiarAlPortapapeles(texto) {
  if (!texto) { mostrarNotificacion('No hay texto para copiar', true); return; }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto)
      .then(() => mostrarNotificacion('Contraseña copiada al portapapeles'))
      .catch(() => fallbackCopiar(texto));
  } else {
    fallbackCopiar(texto);
  }
}

function fallbackCopiar(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    mostrarNotificacion('Contraseña copiada al portapapeles');
  } catch (err) {
    mostrarNotificacion('No se pudo copiar automáticamente', true);
  }
  document.body.removeChild(ta);
}

function toggleInputVisibilidad(inputId, btn) {
  const input = el(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-eye', !isHidden);
      icon.classList.toggle('fa-eye-slash', isHidden);
    }
  }
}

function renderCfgUsuarios() {
  const adminActual = SESSION.usuarioId ? DB.usuarios.find(u => u.id === SESSION.usuarioId && u.rol === 'admin') : null;

  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Usuarios de la Plataforma</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-secondary" onclick="toggleTodasPasswords(this)"><i class="fa-solid fa-eye"></i> Ver todas las contraseñas</button>
        <button class="btn-main" onclick="abrirModalRegistrarUsuario()"><i class="fa-solid fa-user-plus"></i> Registrar Usuario</button>
      </div>
    </div>

    <!-- Panel de control de credenciales del Administrador -->
    <div class="form-box" style="margin-bottom:18px;background:linear-gradient(135deg,#f8fafc,#edf2f7);border-left:4px solid var(--gold);padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
        <div>
          <h4 style="margin-bottom:6px;display:flex;align-items:center;gap:8px;color:var(--navy);">
            <i class="fa-solid fa-shield-halved" style="color:var(--gold);"></i> 
            Mi Cuenta y Contraseña de Administrador
          </h4>
          <p style="font-size:.82rem;color:var(--text-muted);margin:0;">
            Usuario en sesión: <b>${escapeHTML(SESSION.usuario || 'Administrador')}</b>
            ${adminActual ? ` | Clave actual: <span id="mi-pass-banner-val" style="font-family:monospace;letter-spacing:2px;background:#e2e8f0;padding:2px 8px;border-radius:4px;">••••••••</span>
              <button type="button" class="btn-secondary" style="padding:2px 6px;font-size:.7rem;margin-left:4px;" onclick="toggleVerMiPasswordBanner(this)" title="Ver clave"><i class="fa-solid fa-eye"></i></button>
              <button type="button" class="btn-secondary" style="padding:2px 6px;font-size:.7rem;margin-left:2px;" onclick="copiarAlPortapapeles('${escapeHTML(adminActual.password)}')" title="Copiar"><i class="fa-solid fa-copy"></i></button>`
            : ' | <span class="badge badge-amber"><i class="fa-solid fa-circle-exclamation"></i> Modo Inicial (crea tu cuenta propia)</span>'}
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${!adminActual ? `
            <button class="btn-main" onclick="abrirModalCrearMiAdmin()"><i class="fa-solid fa-user-plus"></i> Crear mi contraseña propia</button>
          ` : `
            <button class="btn-main" onclick="abrirModalMiPassword()"><i class="fa-solid fa-key"></i> Cambiar mi contraseña</button>
            <button class="btn-secondary" onclick="abrirModalCrearMiAdmin()"><i class="fa-solid fa-user-shield"></i> Crear otro Admin</button>
          `}
        </div>
      </div>
    </div>

    <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px;">
      Directorio de credenciales activas. Como administrador, puedes visualizar las contraseñas de clientes, trabajadores u otros administradores, copiarlas o cambiarlas.
    </p>

    <div class="table-scroll"><table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Entidad Asociada</th>
          <th>Contraseña</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${DB.usuarios.length ? DB.usuarios.map(u => `
          <tr>
            <td><b>${escapeHTML(u.nombre)}</b></td>
            <td>${nombreRol(u.rol)}</td>
            <td>${escapeHTML(u.entidadNombre || '-')}</td>
            <td>
              <div style="display:inline-flex;align-items:center;gap:5px;">
                <span id="user-pass-${u.id}" data-shown="false" style="font-family:monospace;font-size:.85rem;background:#f1f5f9;padding:4px 8px;border-radius:4px;letter-spacing:2px;min-width:80px;display:inline-block;text-align:center;border:1px solid #cbd5e1;">••••••••</span>
                <button type="button" id="btn-eye-${u.id}" class="btn-secondary" style="padding:3px 7px;font-size:.72rem;" title="Mostrar / Ocultar" onclick="toggleVerPasswordUsuario(${u.id}, this)">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button type="button" class="btn-secondary" style="padding:3px 7px;font-size:.72rem;" title="Copiar contraseña" onclick="copiarAlPortapapeles('${escapeHTML(u.password)}')">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </td>
            <td>${u.activo ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-red">Inactivo</span>'}${esMiPropiaCuenta(u) ? ' <span class="badge badge-amber" title="Tu cuenta en sesión">Tú</span>' : ''}</td>
            <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              ${(() => {
                const protegido = u.rol === 'admin' && (esMiPropiaCuenta(u) || esUltimoAdminActivo(u));
                const motivo = esMiPropiaCuenta(u) ? 'No puedes desactivarte a ti mismo' : 'Debe quedar al menos un administrador activo';
                return `<button class="btn-secondary" ${protegido && u.activo ? `disabled title="${motivo}"` : ''} onclick="toggleUsuarioActivo(${u.id})">${u.activo ? 'Desactivar' : 'Activar'}</button>`;
              })()}
              <button class="btn-secondary" onclick="abrirModalCambiarPassword(${u.id})">Restablecer clave</button>
              ${(() => {
                const esUnicoAdmin = u.rol === 'admin' && DB.usuarios.filter(x => x.rol === 'admin').length <= 1;
                const protegido = u.rol === 'admin' && (esMiPropiaCuenta(u) || esUnicoAdmin);
                const motivo = esMiPropiaCuenta(u) ? 'No puedes eliminar tu propia cuenta' : 'Debe quedar al menos un administrador registrado';
                return `<button class="btn-danger" ${protegido ? `disabled title="${motivo}"` : ''} onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>`;
              })()}
            </td>
          </tr>
        `).join('') : `<tr><td colspan="6" class="empty-state">Aún no hay usuarios registrados.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function toggleVerMiPasswordBanner(btn) {
  const span = el('mi-pass-banner-val');
  if (!span) return;
  const admin = DB.usuarios.find(u => u.id === SESSION.usuarioId && u.rol === 'admin');
  if (!admin) return;
  const isHidden = span.getAttribute('data-shown') !== 'true';
  if (isHidden) {
    span.innerText = admin.password;
    span.setAttribute('data-shown', 'true');
    span.style.letterSpacing = 'normal';
    span.style.fontWeight = '700';
    span.style.color = 'var(--navy)';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    span.innerText = '••••••••';
    span.setAttribute('data-shown', 'false');
    span.style.letterSpacing = '2px';
    span.style.fontWeight = 'normal';
    span.style.color = 'inherit';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

function abrirModalCrearMiAdmin() {
  openModal('Crear Cuenta y Contraseña de Administrador', `
    <p style="font-size:.82rem;color:var(--text-muted);margin-bottom:14px;">
      Configura tu propio usuario administrador para ingresar con tu nombre y clave personalizada.
    </p>
    <div class="field" style="margin-bottom:12px;">
      <label>Nombre del Administrador <span class="req">*</span></label>
      <input class="form-control" id="crear-admin-nombre" value="${SESSION.usuario && SESSION.usuario !== 'Administrador' ? escapeHTML(SESSION.usuario) : ''}" placeholder="Ej: Jorge Ramos">
    </div>
    <div class="field" style="margin-bottom:12px;">
      <label>Tu Contraseña Propia <span class="req">*</span></label>
      <div style="position:relative;display:flex;align-items:center;">
        <input type="password" class="form-control" id="crear-admin-pass" placeholder="Mínimo 6 caracteres" style="padding-right:40px;">
        <button type="button" class="btn-secondary" style="position:absolute;right:6px;padding:4px 8px;font-size:.8rem;" onclick="toggleInputVisibilidad('crear-admin-pass', this)">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
    </div>
    <div class="field" style="margin-bottom:18px;">
      <label>Confirmar Contraseña <span class="req">*</span></label>
      <div style="position:relative;display:flex;align-items:center;">
        <input type="password" class="form-control" id="crear-admin-pass-confirm" placeholder="Repite la contraseña" style="padding-right:40px;">
        <button type="button" class="btn-secondary" style="position:absolute;right:6px;padding:4px 8px;font-size:.8rem;" onclick="toggleInputVisibilidad('crear-admin-pass-confirm', this)">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
    </div>
    <button class="btn-main" onclick="guardarMiAdminPropio()"><i class="fa-solid fa-floppy-disk"></i> Guardar y Vincular Mi Cuenta</button>
  `);
}

function guardarMiAdminPropio() {
  const nombre = el('crear-admin-nombre').value.trim();
  const pass = el('crear-admin-pass').value;
  const passConfirm = el('crear-admin-pass-confirm').value;

  if (!nombre) { mostrarNotificacion('Ingresa tu nombre de administrador', true); return; }
  if (!pass || pass.length < 6) { mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', true); return; }
  if (pass !== passConfirm) { mostrarNotificacion('Las contraseñas no coinciden', true); return; }

  const existente = DB.usuarios.find(u => u.rol === 'admin' && u.nombre.toLowerCase() === nombre.toLowerCase());
  if (existente && existente.id !== SESSION.usuarioId) {
    mostrarNotificacion('Ya existe un administrador con ese nombre', true);
    return;
  }

  let admin = SESSION.usuarioId ? DB.usuarios.find(u => u.id === SESSION.usuarioId && u.rol === 'admin') : null;

  if (admin) {
    admin.nombre = nombre;
    admin.password = pass;
    admin.activo = true;
  } else {
    admin = {
      id: DB.nextId.usuario++,
      nombre,
      rol: 'admin',
      entidadId: null,
      entidadNombre: '-',
      password: pass,
      activo: true
    };
    DB.usuarios.push(admin);
  }

  SESSION.usuarioId = admin.id;
  SESSION.usuario = admin.nombre;
  el('header-user-name').innerText = SESSION.usuario;
  el('header-avatar-initials').innerText = SESSION.usuario.substring(0, 2).toUpperCase();

  registrarAuditoria('Administrador configuró cuenta y contraseña propia', admin.nombre);
  guardarEstado();
  guardarSesionLocal();
  closeModal();
  mostrarNotificacion('¡Cuenta y contraseña de administrador guardadas con éxito!');
  navegar('a-configuracion');
  setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[1]; if (btn) btn.click(); }, 30);
}

function abrirModalMiPassword() {
  if (SESSION.rol !== 'admin') {
    mostrarNotificacion('Solo un administrador puede gestionar esta contraseña.', true);
    return;
  }
  if (!SESSION.usuarioId) {
    abrirModalCrearMiAdmin();
    return;
  }
  const u = DB.usuarios.find(x => x.id === SESSION.usuarioId && x.rol === 'admin');
  if (!u) {
    abrirModalCrearMiAdmin();
    return;
  }

  openModal('Cambiar mi Contraseña de Administrador', `
    <div style="background:#f1f5f9;border-radius:8px;padding:12px;margin-bottom:14px;border:1px solid #cbd5e1;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:.82rem;color:var(--text-muted);">Contraseña actual:</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <code id="modal-mi-pass-ver" style="font-size:.95rem;font-weight:700;color:var(--navy);letter-spacing:1px;">••••••••</code>
          <button type="button" class="btn-secondary" style="padding:2px 6px;font-size:.7rem;" onclick="
            const elC = el('modal-mi-pass-ver');
            if(elC.innerText==='••••••••'){ elC.innerText='${escapeHTML(u.password)}'; this.innerHTML='<i class=\\'fa-solid fa-eye-slash\\'></i>'; }
            else { elC.innerText='••••••••'; this.innerHTML='<i class=\\'fa-solid fa-eye\\'></i>'; }
          "><i class="fa-solid fa-eye"></i></button>
        </div>
      </div>
    </div>

    <div class="field" style="margin-bottom:12px;">
      <label>Nueva contraseña <span class="req">*</span></label>
      <div style="position:relative;display:flex;align-items:center;">
        <input type="password" class="form-control" id="mi-pass-nueva" placeholder="Mínimo 6 caracteres" style="padding-right:40px;">
        <button type="button" class="btn-secondary" style="position:absolute;right:6px;padding:4px 8px;font-size:.8rem;" onclick="toggleInputVisibilidad('mi-pass-nueva', this)">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
    </div>

    <div class="field" style="margin-bottom:16px;">
      <label>Confirmar nueva contraseña <span class="req">*</span></label>
      <div style="position:relative;display:flex;align-items:center;">
        <input type="password" class="form-control" id="mi-pass-confirmar" placeholder="Repite la nueva contraseña" style="padding-right:40px;">
        <button type="button" class="btn-secondary" style="position:absolute;right:6px;padding:4px 8px;font-size:.8rem;" onclick="toggleInputVisibilidad('mi-pass-confirmar', this)">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
    </div>

    <button class="btn-main" onclick="guardarMiPassword()"><i class="fa-solid fa-floppy-disk"></i> Guardar Nueva Contraseña</button>
  `);
}

function guardarMiPassword() {
  const u = DB.usuarios.find(x => x.id === SESSION.usuarioId && x.rol === 'admin');
  if (!u) {
    guardarMiAdminPropio();
    return;
  }
  const nueva = el('mi-pass-nueva').value;
  const confirmar = el('mi-pass-confirmar').value;

  if (!nueva || nueva.length < 6) { mostrarNotificacion('La nueva contraseña debe tener al menos 6 caracteres.', true); return; }
  if (nueva !== confirmar) { mostrarNotificacion('Las nuevas contraseñas no coinciden.', true); return; }

  u.password = nueva;
  registrarAuditoria('Administrador actualizó su contraseña', u.nombre);
  guardarEstado();
  closeModal();
  mostrarNotificacion('Tu contraseña se actualizó con éxito.');
  navegar('a-configuracion');
  setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[1]; if (btn) btn.click(); }, 30);
}

function abrirModalCambiarPassword(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  openModal(`Restablecer Clave — ${escapeHTML(u.nombre)}`, `
    <div style="background:#f1f5f9;border-radius:8px;padding:12px;margin-bottom:14px;border:1px solid #cbd5e1;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:.82rem;color:var(--text-muted);">Contraseña actual:</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <code style="font-size:1rem;font-weight:700;color:var(--navy);">${escapeHTML(u.password)}</code>
          <button type="button" class="btn-secondary" style="padding:2px 6px;font-size:.7rem;" onclick="copiarAlPortapapeles('${escapeHTML(u.password)}')"><i class="fa-solid fa-copy"></i> Copiar</button>
        </div>
      </div>
    </div>
    <div class="field" style="margin-bottom:14px;">
      <label>Nueva contraseña para este usuario <span class="req">*</span></label>
      <div style="position:relative;display:flex;align-items:center;">
        <input type="password" class="form-control" id="cp-password" placeholder="Mínimo 6 caracteres" style="padding-right:40px;">
        <button type="button" class="btn-secondary" style="position:absolute;right:6px;padding:4px 8px;font-size:.8rem;" onclick="toggleInputVisibilidad('cp-password', this)">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
    </div>
    <button class="btn-main" onclick="guardarCambioPassword(${id})"><i class="fa-solid fa-floppy-disk"></i> Guardar Nueva Contraseña</button>
  `);
}

function guardarCambioPassword(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  const password = el('cp-password').value;
  if (!password || password.length < 6) { mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', true); return; }
  u.password = password;
  registrarAuditoria('Contraseña restablecida por admin', `${u.nombre} (${nombreRol(u.rol)})`);
  guardarEstado();
  closeModal();
  mostrarNotificacion('Contraseña actualizada correctamente');
  navegar('a-configuracion');
  setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[1]; if (btn) btn.click(); }, 30);
}

function abrirModalRegistrarUsuario() {
  openModal('Registrar Nuevo Usuario', `
    <div class="form-grid-2">
      <div class="field"><label>Nombre <span class="req">*</span></label><input class="form-control" id="nu-nombre"></div>
      <div class="field"><label>Rol</label>
        <select class="form-control" id="nu-rol" onchange="handleRolUsuarioChange()">
          <option value="client">Cliente</option>
          <option value="worker">Trabajador</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="field" id="nu-grupo-entidad">
        <label>Negocio asociado</label>
        <select class="form-control" id="nu-entidad">${DB.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.negocio.nombre)} — ${escapeHTML(c.nombre)}</option>`).join('') || '<option value="">No hay clientes registrados</option>'}</select>
      </div>
      <div class="field">
        <label>Contraseña de acceso <span class="req">*</span></label>
        <div style="position:relative;display:flex;align-items:center;">
          <input type="password" class="form-control" id="nu-password" placeholder="Mínimo 6 caracteres" style="padding-right:40px;">
          <button type="button" class="btn-secondary" style="position:absolute;right:6px;padding:4px 8px;font-size:.8rem;" onclick="toggleInputVisibilidad('nu-password', this)">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
    <button class="btn-main" onclick="guardarNuevoUsuario()"><i class="fa-solid fa-floppy-disk"></i> Registrar Usuario</button>
  `);
}

function handleRolUsuarioChange() {
  const rol = el('nu-rol').value;
  const grupo = el('nu-grupo-entidad');
  const sel = el('nu-entidad');
  if (rol === 'client') {
    grupo.style.display = 'block';
    sel.innerHTML = DB.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.negocio.nombre)} — ${escapeHTML(c.nombre)}</option>`).join('') || '<option value="">No hay clientes registrados</option>';
  } else if (rol === 'worker') {
    grupo.style.display = 'block';
    sel.innerHTML = DB.trabajadores.map(t => `<option value="${t.id}">${escapeHTML(t.nombre)}</option>`).join('') || '<option value="">No hay trabajadores registrados</option>';
  } else {
    grupo.style.display = 'none';
  }
}

function guardarNuevoUsuario() {
  const rol = el('nu-rol').value;
  const nombre = el('nu-nombre').value.trim();
  const password = el('nu-password').value;
  if (!nombre) { mostrarNotificacion('Ingrese el nombre del usuario', true); return; }
  if (!password || password.length < 6) { mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', true); return; }

  let entidadId = null, entidadNombre = '-';
  if (rol === 'client') {
    entidadId = Number(el('nu-entidad').value) || null;
    const c = getCliente(entidadId);
    if (!c) { mostrarNotificacion('Seleccione un negocio válido para este cliente', true); return; }
    entidadNombre = c.negocio.nombre;
  }
  if (rol === 'worker') {
    entidadId = Number(el('nu-entidad').value) || null;
    const t = getTrabajador(entidadId);
    if (!t) { mostrarNotificacion('Seleccione un trabajador válido', true); return; }
    entidadNombre = t.nombre;
  }
  DB.usuarios.push({ id: DB.nextId.usuario++, nombre, rol, entidadId, entidadNombre, password, activo: true });
  registrarAuditoria('Usuario registrado', `${nombre} (${nombreRol(rol)})`);
  closeModal();
  mostrarNotificacion('Usuario registrado correctamente');
  navegar('a-configuracion');
  setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[1]; if (btn) btn.click(); }, 30);
}

function toggleUsuarioActivo(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;

  if (u.activo && u.rol === 'admin') {
    if (esMiPropiaCuenta(u)) {
      mostrarNotificacion('No puedes desactivar tu propia cuenta de administrador mientras tienes la sesión abierta.', true);
      return;
    }
    if (esUltimoAdminActivo(u)) {
      mostrarNotificacion('No es posible desactivar este administrador: debe quedar al menos uno activo en la plataforma.', true);
      return;
    }
  }

  u.activo = !u.activo;
  registrarAuditoria(u.activo ? 'Usuario activado' : 'Usuario desactivado', u.nombre);
  guardarEstado();
  navegar('a-configuracion');
  setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[1]; if (btn) btn.click(); }, 30);
}

function eliminarUsuario(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;

  if (u.rol === 'admin') {
    if (esMiPropiaCuenta(u)) {
      mostrarNotificacion('No puedes eliminar tu propia cuenta de administrador mientras tienes la sesión abierta.', true);
      return;
    }
    if (DB.usuarios.filter(x => x.rol === 'admin').length <= 1) {
      mostrarNotificacion('No es posible eliminar este administrador: debe quedar al menos uno registrado en la plataforma.', true);
      return;
    }
  }

  confirmarAccion(`¿Eliminar al usuario ${u.nombre}? Ya no podrá iniciar sesión.`, () => {
    DB.usuarios = DB.usuarios.filter(x => x.id !== id);
    registrarAuditoria('Usuario eliminado', u.nombre);
    guardarEstado();
    mostrarNotificacion('Usuario eliminado');
    navegar('a-configuracion');
    setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[1]; if (btn) btn.click(); }, 30);
  });
}

/* Permisos */
function renderCfgPermisos() {
  const grupos = [
    { rol: 'client', titulo: 'Cliente' },
    { rol: 'worker', titulo: 'Trabajador' },
    { rol: 'admin', titulo: 'Administrador' }
  ];
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Roles y Permisos</h3></div>
    <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:14px;">Define qué módulos del menú puede ver cada rol.</p>
    ${grupos.map(g => `
      <div class="form-box">
        <h4>${g.titulo}</h4>
        <div class="chip-list">
          ${CFG_MODULOS.filter(m => m.grupo === g.rol).map(m => {
            const bloqueado = g.rol === 'admin' && (m.id === 'a-dashboard' || m.id === 'a-configuracion');
            const checked = DB.permisos[g.rol][m.id] !== false;
            return `<label class="chip" style="cursor:${bloqueado ? 'not-allowed' : 'pointer'};display:inline-flex;align-items:center;gap:6px;opacity:${bloqueado ? '.6' : '1'};">
              <input type="checkbox" ${checked ? 'checked' : ''} ${bloqueado ? 'disabled' : ''} onchange="DB.permisos['${g.rol}']['${m.id}']=this.checked;">
              ${escapeHTML(m.label)}
            </label>`;
          }).join('')}
        </div>
      </div>`).join('')}
    <button class="btn-main" onclick="guardarPermisos()"><i class="fa-solid fa-floppy-disk"></i> Guardar Permisos</button>
  </div>`;
}

function guardarPermisos() {
  registrarAuditoria('Roles y permisos actualizados', '');
  guardarEstado();
  mostrarNotificacion('Permisos actualizados');
}

/* Metas */
function renderCfgMetas() {
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Metas de Ventas por Negocio</h3></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Negocio</th><th>Cliente</th><th>Ventas Actuales</th><th>Meta Mensual</th><th>Cumplimiento</th><th></th></tr></thead>
      <tbody>
        ${DB.clientes.length ? DB.clientes.map(c => {
          const pct = c.resultados.metas ? Math.min(999, (c.resultados.ventas / c.resultados.metas) * 100) : 0;
          return `<tr>
            <td><b>${escapeHTML(c.negocio.nombre)}</b></td>
            <td>${escapeHTML(c.nombre)}</td>
            <td>${formatCOP(c.resultados.ventas)}</td>
            <td><input type="number" min="0" class="form-control" style="max-width:150px;" id="meta-${c.id}" value="${c.resultados.metas}"></td>
            <td>${pct.toFixed(1)}%</td>
            <td><button class="btn-secondary" onclick="guardarMetaCliente(${c.id})">Guardar</button></td>
          </tr>`;
        }).join('') : `<tr><td colspan="6" class="empty-state">No hay clientes registrados.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

function guardarMetaCliente(id) {
  const c = getCliente(id);
  if (!c) return;
  c.resultados.metas = Number(el(`meta-${id}`).value) || 0;
  guardarEstado();
  mostrarNotificacion(`Meta de ${c.negocio.nombre} actualizada`);
}

/* Categorías */
function renderCfgCategorias() {
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Categorías de Negocio</h3></div>
    <div class="chip-list" style="margin-bottom:16px;">
      ${DB.categorias.map((cat, i) => `<span class="chip" style="display:inline-flex;align-items:center;gap:8px;">${escapeHTML(cat)}<i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--danger-red);" onclick="eliminarCategoria(${i})"></i></span>`).join('') || '<span style="font-size:.8rem;color:var(--text-muted);">Sin categorías.</span>'}
    </div>
    <div style="display:flex;gap:10px;max-width:420px;">
      <input class="form-control" id="nueva-categoria" placeholder="Nueva categoría...">
      <button class="btn-main" onclick="agregarCategoria()"><i class="fa-solid fa-plus"></i> Agregar</button>
    </div>
  </div>`;
}

function agregarCategoria() {
  const val = el('nueva-categoria').value.trim();
  if (!val) { mostrarNotificacion('Escribe la categoría', true); return; }
  if (DB.categorias.some(c => c.toLowerCase() === val.toLowerCase())) { mostrarNotificacion('Ya existe esa categoría', true); return; }
  DB.categorias.push(val);
  registrarAuditoria('Categoría agregada', val);
  guardarEstado();
  navegar('a-configuracion');
  setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[4]; if (btn) btn.click(); }, 30);
}

function eliminarCategoria(idx) {
  const nombre = DB.categorias[idx];
  confirmarAccion(`¿Eliminar la categoría "${nombre}"?`, () => {
    DB.categorias.splice(idx, 1);
    registrarAuditoria('Categoría eliminada', nombre);
    guardarEstado();
    navegar('a-configuracion');
    setTimeout(() => { const btn = document.querySelectorAll('#content-container .tab-btn')[4]; if (btn) btn.click(); }, 30);
  });
}

/* Reglamento */
function renderCfgReglamento() {
  const p = DB.parametros;
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Reglamento de Inversión</h3></div>
    <div class="form-box"><h4>Para Solicitar Inversión</h4>
      <div class="form-grid-3">
        <div class="field"><label>Meses mínimos funcionando</label><input type="number" min="0" class="form-control" id="rgl-meses" value="${p.mesesMinimoFuncionamiento}"></div>
      </div>
    </div>
    <div class="form-box"><h4>Para Aprobar</h4>
      <div class="form-grid-3">
        <div class="field"><label>Puntaje mínimo de aprobación (%)</label><input type="number" min="0" max="100" class="form-control" id="rgl-puntaje" value="${p.puntajeMinimoAprobacion}"></div>
        <div class="field"><label>Monto máximo de inversión</label><input type="number" min="0" class="form-control" id="rgl-monto" value="${p.montoMaximoInversion}"></div>
      </div>
    </div>
    <div class="form-box" style="margin-bottom:0;"><h4>Condiciones Generales</h4>
      <div class="field"><label>Notas y condiciones</label><textarea class="form-control" rows="3" id="rgl-texto">${escapeHTML(p.reglamentoTexto)}</textarea></div>
    </div>
    <button class="btn-main" onclick="guardarReglamento()" style="margin-top:14px;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reglamento</button>
  </div>`;
}

function guardarReglamento() {
  DB.parametros.mesesMinimoFuncionamiento = Number(el('rgl-meses').value) || 0;
  DB.parametros.puntajeMinimoAprobacion = Number(el('rgl-puntaje').value) || 0;
  DB.parametros.montoMaximoInversion = Number(el('rgl-monto').value) || 0;
  DB.parametros.reglamentoTexto = el('rgl-texto').value.trim();
  registrarAuditoria('Reglamento de inversión actualizado', '');
  guardarEstado();
  mostrarNotificacion('Reglamento actualizado correctamente');
}

/* Auditoría */
function renderCfgAuditoria() {
  const list = (DB.auditoria || []).slice(0, 150);
  return `
  <div class="card-table">
    <div class="card-table-header">
      <h3>Registro de Auditoría</h3>
      <span class="subtitle">Últimas ${list.length} acciones registradas.</span>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>Detalle</th></tr></thead>
      <tbody>
        ${list.length ? list.map(a => `<tr>
          <td>${fechaLarga(a.fecha)}</td>
          <td>${escapeHTML(a.hora)}</td>
          <td>${escapeHTML(a.usuario)}</td>
          <td>${['client', 'worker', 'admin'].includes(a.rol) ? nombreRol(a.rol) : '-'}</td>
          <td>${escapeHTML(a.accion)}</td>
          <td>${escapeHTML(a.detalle)}</td>
        </tr>`).join('') : `<tr><td colspan="6" class="empty-state">No hay acciones registradas.</td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

/* Privacidad y Respaldo */
function renderCfgPrivacidad() {
  const p = DB.parametros;
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Política de Tratamiento de Datos</h3></div>
    <div class="field" style="margin-bottom:14px;"><textarea class="form-control" rows="5" id="priv-politica">${escapeHTML(p.politicaDatos)}</textarea></div>
    <button class="btn-main" onclick="guardarPoliticaDatos()"><i class="fa-solid fa-floppy-disk"></i> Guardar Política</button>
  </div>
  <div class="card-table" style="margin-bottom:0;">
    <div class="card-table-header"><h3>Copias de Seguridad</h3></div>
    <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px;">Descarga un respaldo completo en formato JSON.</p>
    <button class="btn-main" onclick="descargarCopiaSeguridad()"><i class="fa-solid fa-download"></i> Descargar Respaldo JSON</button>
  </div>`;
}

function guardarPoliticaDatos() {
  DB.parametros.politicaDatos = el('priv-politica').value.trim();
  registrarAuditoria('Política de datos actualizada', '');
  guardarEstado();
  mostrarNotificacion('Política actualizada correctamente');
}

function descargarCopiaSeguridad() {
  const hoy = fechaHoyLocal();
  const contenido = JSON.stringify(DB, null, 2);
  const blob = new Blob([contenido], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Respaldo_JORAN_${hoy}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  registrarAuditoria('Copia de seguridad descargada', '');
  guardarEstado();
  mostrarNotificacion('Copia descargada correctamente');
}

function verPoliticaDatosLogin() {
  openModal('Política de Tratamiento de Datos', `<p style="font-size:.85rem;color:#334155;white-space:pre-wrap;">${escapeHTML(DB.parametros.politicaDatos)}</p>`);
}

/* =========================================================
   INICIALIZACIÓN DE DATOS NUEVOS Y NOTIFICACIONES
   ========================================================= */
function asegurarDatosNuevos() {
  DB.solicitudesInversion = Array.isArray(DB.solicitudesInversion) ? DB.solicitudesInversion : [];
  DB.pagos = Array.isArray(DB.pagos) ? DB.pagos : [];
  DB.alertas = Array.isArray(DB.alertas) ? DB.alertas : [];
  DB.notificaciones = Array.isArray(DB.notificaciones) ? DB.notificaciones : [];
  DB.solicitudesEdicion = Array.isArray(DB.solicitudesEdicion) ? DB.solicitudesEdicion : [];
  DB.capital = DB.capital || { total: 50000000, recuperado: 0 };
  DB.nextId = DB.nextId || {};
  ['solicitudInversion', 'pago', 'alerta', 'notificacion', 'solicitud'].forEach(k => { if (!DB.nextId[k]) DB.nextId[k] = 1; });
  DB.clientes.forEach(c => {
    c.resultados = c.resultados || { ventas: 0, gastos: 0, utilidad: 0, inventario: 0, deudas: 0, metas: 0 };
    c.inversion = c.inversion || { solicitado: 0, aprobado: 0, recibido: 0, fecha: '', tipo: '', participacion: 0, destino: '', estado: 'Pendiente', rentabilidad: 0 };
    if (!c.inversion.estado) c.inversion.estado = c.inversion.aprobado > 0 ? 'Activa' : 'Pendiente';
  });
  asegurarPermisosDefault();
}

function crearNotificacion(rol, entidadId, titulo, mensaje, tipo) {
  asegurarDatosNuevos();
  DB.notificaciones.unshift({ id: DB.nextId.notificacion++, rol, entidadId, titulo, mensaje, tipo: tipo || 'info', leida: false, fecha: fechaHoyLocal() });
}

function notificacionesDeSesion() {
  return DB.notificaciones.filter(n => n.rol === SESSION.rol && (n.entidadId == null || n.entidadId === (SESSION.rol === 'client' ? SESSION.clienteId : SESSION.trabajadorId))).sort((a, b) => b.id - a.id);
}

function renderNotificacionesSesion() {
  const l = notificacionesDeSesion().slice(0, 20);
  return `
  <div class="card-table">
    <div class="card-table-header"><h3>Notificaciones</h3><span class="subtitle">${l.filter(x => !x.leida).length} sin leer</span></div>
    ${l.length ? l.map(n => `<div class="risk-list-item"><div><b>${escapeHTML(n.titulo)}</b><p style="color:var(--text-muted);margin-top:4px;">${escapeHTML(n.mensaje)}</p></div><small>${fechaLarga(n.fecha)}</small></div>`).join('') : '<div class="empty-state">No tienes notificaciones.</div>'}
  </div>`;
}

function abrirModalCrearCuenta() {
  openModal('Crear cuenta de cliente', `
    <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px;">Tu cuenta queda vinculada a una solicitud de inversión que JORAN revisará.</p>
    <div class="form-grid-2"><div class="field"><label>Nombre completo *</label><input class="form-control" id="cc-nombre"></div><div class="field"><label>Documento</label><input class="form-control" id="cc-documento"></div></div>
    <div class="form-grid-2"><div class="field"><label>Teléfono *</label><input class="form-control" id="cc-telefono"></div><div class="field"><label>Correo *</label><input type="email" class="form-control" id="cc-correo"></div></div>
    <div class="form-grid-2"><div class="field"><label>Negocio *</label><input class="form-control" id="cc-negocio"></div><div class="field"><label>Tipo</label><select class="form-control" id="cc-tipo">${DB.categorias.map(x => `<option>${escapeHTML(x)}</option>`).join('')}</select></div></div>
    <div class="form-grid-2"><div class="field"><label>Ciudad</label><input class="form-control" id="cc-ciudad"></div><div class="field"><label>Dirección</label><input class="form-control" id="cc-direccion"></div></div>
    <div class="form-grid-2"><div class="field"><label>Monto solicitado *</label><input type="number" min="1" class="form-control" id="cc-monto"></div><div class="field"><label>Destino *</label><input class="form-control" id="cc-destino"></div></div>
    <div class="field" style="margin-bottom:14px;"><label>Contraseña (mínimo 6 caracteres) *</label><input type="password" minlength="6" class="form-control" id="cc-password"></div>
    <button class="btn-main" onclick="crearCuentaCliente()"><i class="fa-solid fa-user-plus"></i> Crear cuenta y solicitar inversión</button>`);
}

function crearCuentaCliente() {
  asegurarDatosNuevos();
  const nombre = el('cc-nombre').value.trim(), tel = el('cc-telefono').value.trim(), correo = el('cc-correo').value.trim(), neg = el('cc-negocio').value.trim(), monto = Number(el('cc-monto').value) || 0, dest = el('cc-destino').value.trim(), pass = el('cc-password').value;
  if (!nombre || !tel || !neg || monto <= 0 || !dest || pass.length < 6) {
    mostrarNotificacion('Completa los campos obligatorios y usa una contraseña de mínimo 6 caracteres', true);
    return;
  }
  if (DB.usuarios.some(u => u.rol === 'client' && u.nombre.toLowerCase() === nombre.toLowerCase())) {
    mostrarNotificacion('Ya existe una cuenta cliente con ese nombre', true);
    return;
  }
  const id = DB.nextId.cliente++;
  DB.clientes.push({
    id, nombre, documento: el('cc-documento').value.trim(), telefono: tel, correo, direccion: '',
    negocio: { nombre: neg, tipo: el('cc-tipo').value, direccion: el('cc-direccion').value.trim(), ciudad: el('cc-ciudad').value.trim(), fechaInicio: fechaHoyLocal(), descripcion: '', empleados: 1 },
    inversion: { solicitado: monto, aprobado: 0, recibido: 0, fecha: '', tipo: 'Solicitud inicial', participacion: 0, destino: dest, estado: 'Pendiente', rentabilidad: 0 },
    resultados: { ventas: 0, gastos: 0, utilidad: 0, inventario: 0, deudas: 0, metas: 0 }, estado: 'normal',
    proceso: { requisitos: { antiguedad: false, documentacion: false, evidenciaVentas: false, estadosFinancieros: false, referencias: false, visitaTrabajador: false, evaluacionRiesgo: false }, etapas: { contrato: false, desembolso: false, seguimientoSemanal: false, reporte: false, liquidacion: false, revisionMensual: false } }
  });
  DB.usuarios.push({ id: DB.nextId.usuario++, nombre, rol: 'client', password: pass, activo: true, entidadId: id, entidadNombre: neg });
  DB.solicitudesInversion.unshift({ id: DB.nextId.solicitudInversion++, clienteId: id, clienteNombre: nombre, negocioNombre: neg, montoSolicitado: monto, destino: dest, tipo: 'Solicitud inicial', estado: 'Pendiente', comentario: '', fecha: fechaHoyLocal() });
  crearNotificacion('admin', null, 'Nueva solicitud de inversión', `${neg} solicitó ${formatCOP(monto)}.`, 'solicitud');
  registrarAuditoria('Cuenta cliente creada', `${nombre} — ${neg}`);
  guardarEstado();
  closeModal();
  mostrarNotificacion('Cuenta creada con éxito. Ya puedes ingresar.');
}

function nombreEstadoSolicitud(s) {
  const m = { Pendiente: 'badge-amber', EnRevision: 'badge-amber', Aprobada: 'badge-green', Rechazada: 'badge-red' };
  return `<span class="badge ${m[s] || 'badge-amber'}">${escapeHTML(s)}</span>`;
}

function renderEstadoSolicitudesCliente(id) {
  const l = DB.solicitudesInversion.filter(s => s.clienteId === id).sort((a, b) => b.id - a.id);
  return `
  <div class="table-scroll"><table>
    <thead><tr><th>Fecha</th><th>Monto</th><th>Estado</th><th>Respuesta</th></tr></thead>
    <tbody>${l.length ? l.map(s => `<tr><td>${fechaLarga(s.fecha)}</td><td>${formatCOP(s.montoSolicitado)}</td><td>${nombreEstadoSolicitud(s.estado)}</td><td>${escapeHTML(s.comentario || '-')}</td></tr>`).join('') : '<tr><td colspan="4" class="empty-state">Sin solicitudes registradas.</td></tr>'}</tbody>
  </table></div>`;
}

function abrirModalSolicitarInversionCliente(id) {
  const pendiente = DB.solicitudesInversion.some(s => s.clienteId === id && ['Pendiente', 'EnRevision'].includes(s.estado));
  openModal('Solicitar Inversión', pendiente ? renderEstadoSolicitudesCliente(id) : `
    <div class="form-grid-2">
      <div class="field"><label>Monto (COP) *</label><input type="number" min="1" class="form-control" id="si-monto"></div>
      <div class="field"><label>Tipo</label><input class="form-control" id="si-tipo" value="Capital de expansión"></div>
    </div>
    <div class="field" style="margin-bottom:14px;"><label>Destino *</label><textarea class="form-control" id="si-destino" rows="3" placeholder="¿En qué se utilizará la inversión?"></textarea></div>
    <button class="btn-main" onclick="enviarSolicitudInversion(${id})"><i class="fa-solid fa-paper-plane"></i> Enviar solicitud</button>`);
}

function enviarSolicitudInversion(id) {
  const c = getCliente(id), m = Number(el('si-monto').value) || 0, d = el('si-destino').value.trim(), t = el('si-tipo').value.trim() || 'Capital de expansión';
  if (!c || m <= 0 || !d) { mostrarNotificacion('Indica monto y destino', true); return; }
  DB.solicitudesInversion.unshift({ id: DB.nextId.solicitudInversion++, clienteId: id, clienteNombre: c.nombre, negocioNombre: c.negocio.nombre, montoSolicitado: m, destino: d, tipo: t, estado: 'Pendiente', comentario: '', fecha: fechaHoyLocal() });
  c.inversion.solicitado = m; c.inversion.destino = d; c.inversion.tipo = t; c.inversion.estado = 'Pendiente';
  crearNotificacion('admin', null, 'Nueva solicitud de inversión', `${c.negocio.nombre} solicitó ${formatCOP(m)}.`, 'solicitud');
  guardarEstado();
  closeModal();
  mostrarNotificacion('Solicitud enviada');
  navegar('c-inversion');
}

function enlaceMapa(c) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.negocio.direccion || '') + ', ' + (c.negocio.ciudad || ''))}`;
}

/* =========================================================
   GESTIÓN Y VACIADO DE SOLICITUDES DE EDICIÓN
   ========================================================= */

// Eliminar una solicitud individual
function eliminarSolicitudEdicion(id) {
  const s = DB.solicitudesEdicion.find(x => x.id === id);
  if (!s) return;
  confirmarAccion(`¿Eliminar la solicitud de "${s.negocioNombre}"?`, () => {
    DB.solicitudesEdicion = DB.solicitudesEdicion.filter(x => x.id !== id);
    registrarAuditoria('Solicitud de edición eliminada', `${s.negocioNombre} — ${s.mensaje.slice(0, 30)}`);
    guardarEstado();
    mostrarNotificacion('Solicitud eliminada');
    navegar('a-dashboard');
  });
}

// Vaciar todas las solicitudes
function vaciarTodasSolicitudesEdicion() {
  if (!DB.solicitudesEdicion.length) return;
  confirmarAccion(`¿Estás seguro de vaciar las ${DB.solicitudesEdicion.length} solicitudes de edición registradas? Esta acción no se puede deshacer.`, () => {
    const total = DB.solicitudesEdicion.length;
    DB.solicitudesEdicion = [];
    registrarAuditoria('Vaciado de solicitudes de edición', `Se eliminaron ${total} solicitudes.`);
    guardarEstado();
    mostrarNotificacion('Todas las solicitudes fueron eliminadas');
    navegar('a-dashboard');
  });
}

// Limpiar únicamente las que ya fueron atendidas (conservando las pendientes)
function limpiarSolicitudesAtendidas() {
  const atendidas = DB.solicitudesEdicion.filter(s => s.estado === 'Atendida');
  if (!atendidas.length) {
    mostrarNotificacion('No hay solicitudes atendidas para eliminar', true);
    return;
  }
  confirmarAccion(`¿Eliminar las ${atendidas.length} solicitudes que ya fueron atendidas y dejar solo las pendientes?`, () => {
    DB.solicitudesEdicion = DB.solicitudesEdicion.filter(s => s.estado !== 'Atendida');
    registrarAuditoria('Limpieza de solicitudes atendidas', `Se eliminaron ${atendidas.length} solicitudes atendidas.`);
    guardarEstado();
    mostrarNotificacion('Solicitudes atendidas eliminadas correctamente');
    navegar('a-dashboard');
  });
}
asegurarDatosNuevos();
