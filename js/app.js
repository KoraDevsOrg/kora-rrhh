import { HRStore } from "./store.js";

class HRApp {
  constructor() {
    this.model = new HRStore();
    this.container = document.getElementById("appContent");
    this.drawer = document.getElementById("sideDrawer");
    this.backdrop = document.getElementById("drawerBackdrop");
    this.headerTitle = document.getElementById("headerTitle");

    this.bindGlobalEvents();
    this.renderHome();
  }

  toggleDrawer(open) {
    this.drawer.classList.toggle("open", open);
    this.backdrop.classList.toggle("active", open);
  }

  bindGlobalEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const act = btn.dataset.action;

      if (act === "open-drawer") this.toggleDrawer(true);
      if (act === "close-drawer") this.toggleDrawer(false);
      if (act === "nav-home") { this.toggleDrawer(false); this.renderHome(); }
      
      if (act === "hub-emps") this.renderEmployees();
      if (act === "hub-turnos") this.renderTurnos();
      if (act === "hub-novs") this.renderNovedades();
      if (act === "hub-nomina") this.renderNomina();
      if (act === "hub-config") this.renderConfig();

      if (act === "new-emp") this.renderEmpForm(null);
      if (act === "edit-emp") this.renderEmpForm(btn.dataset.id);
      if (act === "close-shift") { this.model.cerrarTurno(btn.dataset.id); this.renderTurnos(); }
      if (act === "mark-paid") { this.model.marcarPagado(btn.dataset.id); this.renderNomina(); }

      if (act.startsWith("notice-")) {
        this.toggleDrawer(false);
        this.renderNotice(btn.textContent.trim());
      }
    });
  }

  renderNotice(name) {
    this.headerTitle.textContent = name;
    this.container.innerHTML = `
      <div class="card" style="text-align:center; padding:32px 16px;">
        <span style="font-size:2.5rem;">🔗</span>
        <h2 style="color:var(--accent-gold); margin:12px 0;">${name}</h2>
        <p style="color:var(--text-sub); font-size:0.85rem; line-height:1.5; margin-bottom:20px;">
          Este módulo está desacoplado del personal para mantener el sistema ligero y rápido[cite: 4]. Puedes abrirlo o instalarlo desde <strong>Kora Admin DB</strong> para compartir el catálogo común[cite: 4].
        </p>
        <button class="btn-primary" data-action="nav-home">Volver a Gestión Humana</button>
      </div>
    `;
  }

  renderHome() {
    this.headerTitle.textContent = "Kora RRHH";
    this.container.innerHTML = `
      <div class="hub-grid">
        <div class="hub-card" data-action="hub-emps">
          <div class="hub-icon-badge icon-purple">👥</div>
          <div class="hub-info">
            <div class="hub-title">Colaboradores & Hoja de Vida</div>
            <div class="hub-desc">Fichas de personal, estudios, hijos, contacto y cálculo $/minuto.</div>
          </div>
        </div>

        <div class="hub-card" data-action="hub-turnos">
          <div class="hub-icon-badge icon-orange">⏱️</div>
          <div class="hub-info">
            <div class="hub-title">Control de Asistencia & Extras</div>
            <div class="hub-desc">Entradas, salidas, horas extras y cálculo del tiempo laborado.</div>
          </div>
        </div>

        <div class="hub-card" data-action="hub-novs">
          <div class="hub-icon-badge icon-blue">📋</div>
          <div class="hub-info">
            <div class="hub-title">Novedades & Ausencias</div>
            <div class="hub-desc">Incapacidades médicas, vacaciones y permisos no remunerados.</div>
          </div>
        </div>

        <div class="hub-card" data-action="hub-nomina">
          <div class="hub-icon-badge icon-green">💰</div>
          <div class="hub-info">
            <div class="hub-title">Nómina, Salud, Pensión & Cesantías</div>
            <div class="hub-desc">Liquidación legal: devengados, deducciones de ley y prestaciones.</div>
          </div>
        </div>

        <div class="hub-card" data-action="hub-config">
          <div class="hub-icon-badge icon-gold">⚙️</div>
          <div class="hub-info">
            <div class="hub-title">Configuración Legal & Porcentajes</div>
            <div class="hub-desc">Ajuste de % para extras, recargos nocturnos, salud, pensión y cesantías.</div>
          </div>
        </div>
      </div>
    `;
  }

  renderEmployees() {
    this.headerTitle.textContent = "Equipo de Trabajo";
    const emps = this.model.getEmpleados();
    this.container.innerHTML = `
      <div class="card-header-bar" style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem; color:#fff; font-weight:800;">Colaboradores</h2>
        <button class="btn-icon" data-action="nav-home">←</button>
      </div>
      <button class="btn-primary" data-action="new-emp" style="margin-bottom:14px;">+ Registrar Colaborador</button>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${emps.length === 0 ? `<div class="card" style="text-align:center; color:var(--text-sub);">Sin colaboradores registrados.</div>` : ''}
        ${emps.map(e => `
          <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0;">
            <div>
              <strong style="color:#fff;">${e.nombre}</strong> <small style="color:var(--text-sub);">(CC: ${e.documento_id})</small>
              <div style="font-size:0.8rem; color:var(--text-sub); margin-top:2px;">
                ${e.rol_oficio} • <span style="color:var(--accent-gold);">$${Math.round(e.costo_minuto)}/min</span>
              </div>
              <small style="color:var(--text-sub);">${e.tipo_pago} ($${Math.round(e.salario_base).toLocaleString()})</small>
            </div>
            <button class="btn-secondary btn-sm" data-action="edit-emp" data-id="${e.id}">✏️ Editar</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderEmpForm(id = null) {
    const emp = id ? this.model.getEmpleadoById(id) : null;
    this.headerTitle.textContent = emp ? "Editar Colaborador" : "Nuevo Colaborador";
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header-bar" style="margin-bottom:14px;">
          <h2 class="card-title">${emp ? 'Editar Colaborador' : 'Ficha del Colaborador'}</h2>
          <button class="btn-icon" data-action="hub-emps">←</button>
        </div>
        <form id="fEmp">
          <input type="hidden" id="fId" value="${emp ? emp.id : ''}">
          <div class="form-group">
            <label>Nombre Completo:</label>
            <input type="text" id="fNombre" class="input-field" required value="${emp ? emp.nombre : ''}" placeholder="Ej: Pedro Martínez">
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Cédula / Documento:</label>
              <input type="text" id="fDoc" class="input-field" required value="${emp ? emp.documento_id : ''}">
            </div>
            <div class="form-group">
              <label>Rol / Oficio:</label>
              <input type="text" id="fRol" class="input-field" required value="${emp ? emp.rol_oficio : 'OPERARIO'}">
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Tipo de Pago:</label>
              <select id="fTipo" class="input-field">
                <option value="MENSUAL" ${emp && emp.tipo_pago === 'MENSUAL' ? 'selected' : ''}>Fijo Mensual</option>
                <option value="DIARIO" ${emp && emp.tipo_pago === 'DIARIO' ? 'selected' : ''}>Por Día</option>
              </select>
            </div>
            <div class="form-group">
              <label>Salario Base ($):</label>
              <input type="number" id="fSalario" class="input-field" required value="${emp ? emp.salario_base : 1300000}">
            </div>
          </div>
          <div class="calc-highlight-box">
            <div style="font-size:0.8rem; color:var(--text-sub);">Costo por Minuto Calculado:</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--accent-gold); margin-top:2px;">
              $<span id="outMin">90.27</span> <small style="font-size:0.8rem;">/ min</small>
            </div>
          </div>
          <div class="form-grid" style="margin-top:10px;">
            <div class="form-group">
              <label>Estudios:</label>
              <input type="text" id="fEstudios" class="input-field" value="${emp ? (emp.nivel_estudios || 'Bachiller') : 'Bachiller'}">
            </div>
            <div class="form-group">
              <label>Estado Civil:</label>
              <input type="text" id="fCivil" class="input-field" value="${emp ? (emp.estado_civil || 'Soltero/a') : 'Soltero/a'}">
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Número de Hijos:</label>
              <input type="number" id="fHijos" class="input-field" value="${emp ? emp.num_hijos : 0}">
            </div>
            <div class="form-group">
              <label>Teléfono:</label>
              <input type="text" id="fTel" class="input-field" value="${emp ? (emp.telefono || '') : ''}">
            </div>
          </div>
          <div class="habeas-data-box">
            🔒 <strong>Habeas Data:</strong> Información almacenada 100% en este dispositivo (LOCAL_SCOPE)[cite: 4]. No se comparte con terceros ni servicios en la nube[cite: 4].
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" data-action="hub-emps">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar Datos</button>
          </div>
        </form>
      </div>
    `;

    const inSal = document.getElementById("fSalario");
    const selTip = document.getElementById("fTipo");
    const outM = document.getElementById("outMin");

    const recalc = () => {
      const v = parseFloat(inSal.value) || 0;
      const min = selTip.value === "MENSUAL" ? (v / 14400) : (v / 480);
      outM.textContent = min.toFixed(2);
    };

    inSal.oninput = recalc;
    selTip.onchange = recalc;
    recalc();

    document.getElementById("fEmp").onsubmit = (e) => {
      e.preventDefault();
      this.model.saveEmpleado({
        id: document.getElementById("fId").value || null,
        nombre: document.getElementById("fNombre").value.trim(),
        documento_id: document.getElementById("fDoc").value.trim(),
        rol_oficio: document.getElementById("fRol").value.trim(),
        tipo_pago: selTip.value,
        salario_base: parseFloat(inSal.value) || 0,
        costo_minuto: parseFloat(outM.textContent) || 0,
        nivel_estudios: document.getElementById("fEstudios").value,
        estado_civil: document.getElementById("fCivil").value,
        num_hijos: parseInt(document.getElementById("fHijos").value, 10) || 0,
        telefono: document.getElementById("fTel").value.trim()
      });
      this.renderEmployees();
    };
  }

  renderTurnos() {
    this.headerTitle.textContent = "Control de Asistencia";
    const emps = this.model.getEmpleados();
    const turnos = this.model.getTurnos();

    this.container.innerHTML = `
      <div class="card-header-bar" style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem; color:#fff; font-weight:800;">Turnos & Extras</h2>
        <button class="btn-icon" data-action="nav-home">←</button>
      </div>
      <div class="card">
        <h3 style="font-size:0.95rem; color:var(--accent-gold); margin-bottom:10px;">Registrar Entrada</h3>
        <div style="display:flex; gap:8px;">
          <select id="selTrnEmp" class="input-field" style="flex:2;">
            ${emps.map(e => `<option value="${e.id}">${e.nombre} (${e.rol_oficio})</option>`).join('')}
          </select>
          <button id="btnTrnStart" class="btn-primary" style="flex:1; padding:10px;">▶ Entrada</button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Colaborador</th><th>Jornada</th><th>Extras</th><th>Acción</th></tr>
          </thead>
          <tbody>
            ${turnos.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:var(--text-sub); padding:16px;">Sin turnos activos.</td></tr>` : ''}
            ${turnos.map(t => {
              const emp = emps.find(x => x.id === t.empleado_id) || { nombre: "Colaborador" };
              const inStr = new Date(t.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const outStr = t.fecha_fin ? new Date(t.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
              return `
                <tr>
                  <td><strong>${emp.nombre}</strong></td>
                  <td>${inStr} -${outStr}</td>
                  <td>${t.minutos_extra} min</td>
                  <td>
                    ${!t.fecha_fin ? `<button class="btn-primary btn-sm" data-action="close-shift" data-id="${t.id}" style="background:#ef4444; color:#fff;">■ Salida</button>` : '<span style="color:var(--text-sub);">Cerrado</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("btnTrnStart").onclick = () => {
      const id = document.getElementById("selTrnEmp").value;
      if (id) { this.model.iniciarTurno(id); this.renderTurnos(); }
    };
  }

  renderNovedades() {
    this.headerTitle.textContent = "Novedades Laborales";
    const emps = this.model.getEmpleados();
    const novs = this.model.getNovedades();

    this.container.innerHTML = `
      <div class="card-header-bar" style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem; color:#fff; font-weight:800;">Novedades</h2>
        <button class="btn-icon" data-action="nav-home">←</button>
      </div>
      <div class="card">
        <form id="fNov">
          <div class="form-group">
            <label>Colaborador:</label>
            <select id="nEmp" class="input-field">
              ${emps.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Tipo Novedad:</label>
              <select id="nTipo" class="input-field">
                <option value="INCAPACIDAD">Incapacidad (66% Pago)</option>
                <option value="VACACIONES">Vacaciones (100% Pago)</option>
                <option value="PERMISO_NO_REMUNERADO">Permiso No Remunerado (Descuento 100%)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Días:</label>
              <input type="number" id="nDias" class="input-field" value="1" min="1" required>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Fecha Inicio:</label>
              <input type="date" id="nIni" class="input-field" required>
            </div>
            <div class="form-group">
              <label>Fecha Fin:</label>
              <input type="date" id="nFin" class="input-field" required>
            </div>
          </div>
          <button type="submit" class="btn-primary" style="margin-top:8px;">Registrar Novedad</button>
        </form>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Colaborador</th><th>Tipo</th><th>Días</th><th>Pago %</th></tr>
          </thead>
          <tbody>
            ${novs.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:var(--text-sub); padding:16px;">Sin novedades reportadas.</td></tr>` : ''}
            ${novs.map(n => {
              const emp = emps.find(x => x.id === n.empleado_id) || { nombre: "Colaborador" };
              return `
                <tr>
                  <td><strong>${emp.nombre}</strong></td>
                  <td>${n.tipo}</td>
                  <td>${n.dias}</td>
                  <td>${n.porcentaje_pago}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("fNov").onsubmit = (e) => {
      e.preventDefault();
      const tipo = document.getElementById("nTipo").value;
      let pct = 100;
      if (tipo === "INCAPACIDAD") pct = 66.6;
      if (tipo === "PERMISO_NO_REMUNERADO") pct = 0;

      this.model.saveNovedad({
        empleado_id: document.getElementById("nEmp").value,
        tipo: tipo,
        dias: parseInt(document.getElementById("nDias").value, 10) || 1,
        fecha_inicio: new Date(document.getElementById("nIni").value).getTime(),
        fecha_fin: new Date(document.getElementById("nFin").value).getTime(),
        porcentaje_pago: pct
      });
      this.renderNovedades();
    };
  }

  renderNomina() {
    this.headerTitle.textContent = "Nómina & Seguridad Social";
    const emps = this.model.getEmpleados();
    const pagos = this.model.getPagosNomina();

    this.container.innerHTML = `
      <div class="card-header-bar" style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem; color:#fff; font-weight:800;">Liquidación de Nómina</h2>
        <button class="btn-icon" data-action="nav-home">←</button>
      </div>
      <div class="card">
        <div class="form-group">
          <label>Colaborador:</label>
          <select id="lEmp" class="input-field">
            ${emps.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Desde:</label>
            <input type="date" id="lIni" class="input-field">
          </div>
          <div class="form-group">
            <label>Hasta:</label>
            <input type="date" id="lFin" class="input-field">
          </div>
        </div>
        <button id="btnLiquidar" class="btn-primary" style="margin-top:8px;">
          Liquidar (Salud 4%, Pensión 4%, Cesantías y Novedades)
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Periodo</th><th>Empleado</th><th>Devengado</th><th>Deducciones</th><th>Neto</th><th>Prestaciones</th><th>Estado</th></tr>
          </thead>
          <tbody>
            ${pagos.length === 0 ? `<tr><td colspan="7" style="text-align:center; color:var(--text-sub); padding:16px;">Sin pagos generados.</td></tr>` : ''}
            ${pagos.map(p => {
              const emp = emps.find(x => x.id === p.empleado_id) || { nombre: "Colaborador" };
              return `
                <tr>
                  <td><small>${p.periodo_str}</small></td>
                  <td><strong>${emp.nombre}</strong></td>
                  <td>$${p.devengado.toLocaleString()}</td>                   <td style="color:#fca5a5;">-$${p.deducciones.toLocaleString()}</td>
                  <td><strong style="color:var(--accent-green);">$${p.neto.toLocaleString()}</strong></td>                   <td><small>$${p.prestaciones.toLocaleString()}</small></td>
                  <td>
                    ${p.pagado ? '<span class="badge badge-active">PAGADO</span>' : `<button class="btn-primary btn-sm" data-action="mark-paid" data-id="${p.id}">Pagar</button>`}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("btnLiquidar").onclick = () => {
      const empId = document.getElementById("lEmp").value;
      const fIni = new Date(document.getElementById("lIni").value).getTime();
      const fFin = new Date(document.getElementById("lFin").value).getTime();
      if (!fIni || !fFin) { alert("Selecciona el rango de fechas."); return; }
      this.model.liquidar(empId, fIni, fFin);
      this.renderNomina();
    };
  }

  renderConfig() {
    this.headerTitle.textContent = "Parámetros de Ley";
    const c = this.model.getConfig();

    this.container.innerHTML = `
      <div class="card-header-bar" style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem; color:#fff; font-weight:800;">Parámetros de Ley</h2>
        <button class="btn-icon" data-action="nav-home">←</button>
      </div>
      <div class="card">
        <form id="fConf">
          <h3 style="color:var(--accent-gold); font-size:0.9rem; margin-bottom:10px;">Recargos & Extras (%)</h3>
          <div class="form-grid">
            <div class="form-group"><label>Recargo Nocturno (%):</label><input type="number" id="cRecNoc" class="input-field" value="${c.recargo_nocturno_pct}"></div>
            <div class="form-group"><label>Extra Diurna (%):</label><input type="number" id="cExtDia" class="input-field" value="${c.recargo_extra_diurna_pct}"></div>
          </div>
          <div class="form-grid">
            <div class="form-group"><label>Extra Nocturna (%):</label><input type="number" id="cExtNoc" class="input-field" value="${c.recargo_extra_nocturna_pct}"></div>
            <div class="form-group"><label>Dominical / Festivo (%):</label><input type="number" id="cFest" class="input-field" value="${c.recargo_festivo_pct}"></div>
          </div>
          <hr style="border:0; border-top:1px solid var(--border); margin:14px 0;">
          <h3 style="color:var(--accent-gold); font-size:0.9rem; margin-bottom:10px;">Seguridad Social (Deducción Trabajador)</h3>
          <div class="form-grid">
            <div class="form-group"><label>Salud (%):</label><input type="number" id="cSalud" class="input-field" value="${c.descuento_salud_pct}"></div>
            <div class="form-group"><label>Pensión (%):</label><input type="number" id="cPens" class="input-field" value="${c.descuento_pension_pct}"></div>
          </div>
          <div class="form-group"><label>Auxilio Transporte Mensual ($):</label><input type="number" id="cAux" class="input-field" value="${c.auxilio_transporte_mensual}"></div>
          <hr style="border:0; border-top:1px solid var(--border); margin:14px 0;">
          <h3 style="color:var(--accent-gold); font-size:0.9rem; margin-bottom:10px;">Prestaciones Sociales (Provisión Empresa)</h3>
          <div class="form-grid">
            <div class="form-group"><label>Cesantías (%):</label><input type="number" id="cCes" class="input-field" value="${c.provision_cesantias_pct}"></div>
            <div class="form-group"><label>Intereses Cesantías (%):</label><input type="number" id="cIntCes" class="input-field" value="${c.provision_intereses_cesantias_pct}"></div>
          </div>
          <div class="form-grid">
            <div class="form-group"><label>Prima (%):</label><input type="number" id="cPrim" class="input-field" value="${c.provision_prima_pct}"></div>
            <div class="form-group"><label>Vacaciones (%):</label><input type="number" id="cVac" class="input-field" value="${c.provision_vacaciones_pct}"></div>
          </div>
          <button type="submit" class="btn-primary" style="margin-top:12px;">Guardar Parámetros Legales</button>
        </form>
      </div>
    `;

    document.getElementById("fConf").onsubmit = (e) => {
      e.preventDefault();
      this.model.saveConfig({
        hora_inicio_nocturna: "21:00",
        hora_fin_nocturna: "06:00",
        recargo_nocturno_pct: parseFloat(document.getElementById("cRecNoc").value) || 35,
        recargo_extra_diurna_pct: parseFloat(document.getElementById("cExtDia").value) || 25,
        recargo_extra_nocturna_pct: parseFloat(document.getElementById("cExtNoc").value) || 75,
        recargo_festivo_pct: parseFloat(document.getElementById("cFest").value) || 75,
        recargo_extra_festivo_diurna_pct: 100,
        recargo_extra_festivo_nocturna_pct: 150,
        descuento_salud_pct: parseFloat(document.getElementById("cSalud").value) || 4,
        descuento_pension_pct: parseFloat(document.getElementById("cPens").value) || 4,
        provision_cesantias_pct: parseFloat(document.getElementById("cCes").value) || 8.33,
        provision_intereses_cesantias_pct: parseFloat(document.getElementById("cIntCes").value) || 1.0,
        provision_prima_pct: parseFloat(document.getElementById("cPrim").value) || 8.33,
        provision_vacaciones_pct: parseFloat(document.getElementById("cVac").value) || 4.17,
        auxilio_transporte_mensual: parseFloat(document.getElementById("cAux").value) || 162000
      });
      alert("Parámetros legales actualizados.");
      this.renderHome();
    };
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new HRApp();
});
