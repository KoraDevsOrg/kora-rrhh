import { HRStore } from "./store.js";

class HRController {
  constructor() {
    this.store = new HRStore();
    this.mainEl = document.getElementById("appContent");
    
    // Asignación segura del Drawer
    this.initDrawer();
    // Renderizado garantizado del Hub
    this.renderHome();
  }

  initDrawer() {
    const drawer = document.getElementById("sideDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const btnOpen = document.getElementById("btnOpenDrawer");
    const btnClose = document.getElementById("btnCloseDrawer");

    const toggle = (open) => {
      if (drawer) drawer.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("active", open);
    };

    if (btnOpen) btnOpen.onclick = () => toggle(true);
    if (btnClose) btnClose.onclick = () => toggle(false);
    if (backdrop) backdrop.onclick = () => toggle(false);

    document.querySelectorAll(".drawer-item").forEach(btn => {
      btn.onclick = () => {
        toggle(false);
        const action = btn.dataset.action;
        if (action === "home") this.renderHome();
        else this.showExternalModuleNotice(btn.textContent.trim());
      };
    });
  }

  showExternalModuleNotice(modName) {
    this.mainEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px 16px;">
        <span style="font-size: 2.5rem;">🔗</span>
        <h2 style="color: var(--accent-gold); margin: 12px 0; font-size: 1.25rem;">${modName}</h2>
        <p style="color: var(--text-sub); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px;">
          Este módulo está desacoplado para mantener el ecosistema ligero[cite: 5]. Puedes abrirlo o instalarlo desde <strong>Kora Admin DB</strong> para compartir el catálogo común[cite: 4, 5].
        </p>
        <button id="btnReturnHomeNotice" class="btn-primary" style="width: 100%;">Volver a Gestión Humana</button>
      </div>
    `;
    const btn = document.getElementById("btnReturnHomeNotice");
    if (btn) btn.onclick = () => this.renderHome();
  }

  mountTemplate(tmplId) {
    this.mainEl.innerHTML = "";
    const tmpl = document.getElementById(tmplId);
    if (tmpl) this.mainEl.appendChild(tmpl.content.cloneNode(true));
  }

  // --- 1. PANTALLA PRINCIPAL ---
  renderHome() {
    this.mountTemplate("tmpl-home-view");
    document.getElementById("headerTitle").textContent = "Kora RRHH";

    const btnEmps = document.getElementById("btnActionEmployees");
    const btnTurnos = document.getElementById("btnActionTurnos");
    const btnNovs = document.getElementById("btnActionNovedades");
    const btnNom = document.getElementById("btnActionNomina");
    const btnConf = document.getElementById("btnActionConfig");

    if (btnEmps) btnEmps.onclick = () => this.renderEmployeesList();
    if (btnTurnos) btnTurnos.onclick = () => this.renderTurnos();
    if (btnNovs) btnNovs.onclick = () => this.renderNovedades();
    if (btnNom) btnNom.onclick = () => this.renderNomina();
    if (btnConf) btnConf.onclick = () => this.renderConfig();
  }

  // --- 2. LISTA DE COLABORADORES ---
  renderEmployeesList() {
    this.mountTemplate("tmpl-employees-view");
    document.getElementById("headerTitle").textContent = "Equipo de Trabajo";

    const btnBack = document.getElementById("btnBackHomeEmp");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const btnNew = document.getElementById("btnGoNewEmpFromList");
    if (btnNew) btnNew.onclick = () => this.renderEmpForm(null);

    const container = document.getElementById("employeesListContainer");
    const empleados = this.store.getEmpleados(true);

    if (empleados.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; color:var(--text-sub); padding:30px;">No hay colaboradores registrados.</div>`;
      return;
    }

    container.innerHTML = empleados.map(e => `
      <div class="emp-item-card">
        <div>
          <strong style="color:#fff; font-size:1rem;">${e.nombre}</strong> <small style="color:var(--text-sub);">(CC: ${e.documento_id})</small>
          <div style="font-size:0.8rem; color:var(--text-sub); margin-top:2px;">
            ${e.rol_oficio} • <span style="color:var(--accent-gold);">$${Math.round(e.costo_minuto)}/min</span>
          </div>
          <small style="color:var(--text-sub);">
            ${e.tipo_pago} ($${Math.round(e.salario_base).toLocaleString()}) • Hijos: ${e.num_hijos}
          </small>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary btn-sm btn-edit-emp" data-id="${e.id}">✏️</button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-edit-emp").forEach(btn => {
      btn.onclick = () => this.renderEmpForm(btn.dataset.id);
    });
  }

  // --- 3. FORMULARIO COLABORADOR ---
  renderEmpForm(empId = null) {
    this.mountTemplate("tmpl-emp-form-view");
    document.getElementById("headerTitle").textContent = empId ? "Editar Colaborador" : "Nuevo Colaborador";

    const emp = empId ? this.store.getEmpleadoById(empId) : null;
    const form = document.getElementById("empForm");
    const idInput = document.getElementById("empId");
    const nombreInput = document.getElementById("empNombre");
    const docInput = document.getElementById("empDoc");
    const rolInput = document.getElementById("empRol");
    const tipoPagoSelect = document.getElementById("empTipoPago");
    const salarioInput = document.getElementById("empSalarioBase");
    const outCostoMinuto = document.getElementById("outCostoMinuto");

    const estudios = document.getElementById("empEstudios");
    const estadoCivil = document.getElementById("empEstadoCivil");
    const hijos = document.getElementById("empHijos");
    const tel = document.getElementById("empTelefono");
    const emergNombre = document.getElementById("empEmergenciaNombre");
    const emergTel = document.getElementById("empEmergenciaTel");

    const updateCostoMinuto = () => {
      const val = parseFloat(salarioInput.value) || 0;
      const tipo = tipoPagoSelect.value;
      let costoMin = (tipo === "MENSUAL") ? (val / 14400) : (val / 480);
      outCostoMinuto.textContent = costoMin.toFixed(2);
    };

    salarioInput.oninput = updateCostoMinuto;
    tipoPagoSelect.onchange = updateCostoMinuto;

    if (emp) {
      document.getElementById("empFormTitle").textContent = "Editar Colaborador";
      idInput.value = emp.id;
      nombreInput.value = emp.nombre;
      docInput.value = emp.documento_id;
      rolInput.value = emp.rol_oficio;
      tipoPagoSelect.value = emp.tipo_pago;
      salarioInput.value = emp.salario_base;
      estudios.value = emp.nivel_estudios || "Bachiller";
      estadoCivil.value = emp.estado_civil || "Soltero/a";
      hijos.value = emp.num_hijos || 0;
      tel.value = emp.telefono || "";
      emergNombre.value = emp.contacto_emergencia_nombre || "";
      emergTel.value = emp.contacto_emergencia_tel || "";
      updateCostoMinuto();
    } else {
      updateCostoMinuto();
    }

    const btnBack = document.getElementById("btnBackEmpForm");
    const btnCancel = document.getElementById("btnCancelEmp");
    if (btnBack) btnBack.onclick = () => this.renderEmployeesList();
    if (btnCancel) btnCancel.onclick = () => this.renderEmployeesList();

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.store.saveEmpleado({
          id: idInput.value || null,
          nombre: nombreInput.value.trim(),
          documento_id: docInput.value.trim(),
          rol_oficio: rolInput.value.trim(),
          tipo_pago: tipoPagoSelect.value,
          salario_base: parseFloat(salarioInput.value) || 0,
          costo_minuto: parseFloat(outCostoMinuto.textContent) || 0,
          nivel_estudios: estudios.value,
          estado_civil: estadoCivil.value,
          num_hijos: parseInt(hijos.value, 10) || 0,
          telefono: tel.value.trim(),
          contacto_emergencia_nombre: emergNombre.value.trim(),
          contacto_emergencia_tel: emergTel.value.trim()
        });
        this.renderEmployeesList();
      };
    }
  }

  // --- 4. TURNOS & HORAS EXTRAS ---
  renderTurnos() {
    this.mountTemplate("tmpl-turnos-view");
    document.getElementById("headerTitle").textContent = "Turnos & Asistencia";

    const btnBack = document.getElementById("btnBackHomeTurnos");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const selEmp = document.getElementById("selEmpTurno");
    const emps = this.store.getEmpleados(true);
    selEmp.innerHTML = emps.map(e => `<option value="${e.id}">${e.nombre} (${e.rol_oficio})</option>`).join("");

    const btnStart = document.getElementById("btnStartTurno");
    if (btnStart) {
      btnStart.onclick = () => {
        if (!selEmp.value) return;
        this.store.registrarInicioTurno(selEmp.value);
        this.renderTurnosTable();
      };
    }

    this.renderTurnosTable();
  }

  renderTurnosTable() {
    const tbody = document.getElementById("turnosTbody");
    const turnos = this.store.getTurnos();
    const emps = this.store.getEmpleados(false);

    if (turnos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-sub); padding:20px;">Sin turnos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = turnos.map(t => {
      const emp = emps.find(e => String(e.id) === String(t.empleado_id)) || { nombre: "Colaborador" };
      const isOpen = !t.fecha_fin;
      const horaIn = new Date(t.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const horaFin = t.fecha_fin ? new Date(t.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

      return `
        <tr>
          <td><strong>${emp.nombre}</strong></td>
          <td>${horaIn} - ${horaFin}</td>
          <td><span class="badge ${t.minutos_extra_diurna > 0 ? 'badge-progress' : ''}">${t.minutos_extra_diurna} min</span></td>
          <td><strong>$ ${Math.round(t.costo_total_jornada).toLocaleString()}</strong></td>
          <td>
            ${isOpen ? `<button class="btn-primary btn-sm btn-close-shift" data-id="${t.id}">■ Salida</button>` : '<span style="color:var(--text-sub); font-size:0.75rem;">Cerrado</span>'}
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-close-shift").forEach(btn => {
      btn.onclick = () => {
        this.store.registrarFinTurno(btn.dataset.id);
        this.renderTurnosTable();
      };
    });
  }

  // --- 5. NOVEDADES & AUSENCIAS ---
  renderNovedades() {
    this.mountTemplate("tmpl-novedades-view");
    document.getElementById("headerTitle").textContent = "Novedades Laborales";

    const btnBack = document.getElementById("btnBackHomeNovs");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const selEmp = document.getElementById("novEmpleadoId");
    const emps = this.store.getEmpleados(true);
    selEmp.innerHTML = emps.map(e => `<option value="${e.id}">${e.nombre} (${e.documento_id})</option>`).join("");

    const form = document.getElementById("novForm");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const tipo = document.getElementById("novTipo").value;
        const dias = parseInt(document.getElementById("novDias").value, 10) || 1;
        const fIni = new Date(document.getElementById("novFechaInicio").value).getTime();
        const fFin = new Date(document.getElementById("novFechaFin").value).getTime();

        let pct = 100;
        if (tipo === "INCAPACIDAD_ENFERMEDAD_GENERAL") pct = 66.6;
        if (tipo === "PERMISO_NO_REMUNERADO") pct = 0;

        this.store.saveNovedad({
          empleado_id: selEmp.value,
          tipo_novedad: tipo,
          dias_duracion: dias,
          fecha_inicio: fIni,
          fecha_fin: fFin,
          porcentaje_pago: pct,
          motivo: document.getElementById("novMotivo").value.trim()
        });

        alert("Novedad registrada y aplicada para liquidación.");
        this.renderNovedades();
      };
    }

    const tbody = document.getElementById("novedadesTbody");
    const novedades = this.store.getNovedades();
    tbody.innerHTML = novedades.map(n => {
      const emp = emps.find(e => String(e.id) === String(n.empleado_id)) || { nombre: "Colaborador" };
      return `
        <tr>
          <td><strong>${emp.nombre}</strong></td>
          <td><span class="badge badge-progress">${n.tipo_novedad}</span></td>
          <td>${n.dias_duracion} días</td>
          <td>${n.porcentaje_pago}%</td>
        </tr>
      `;
    }).join("");
  }

  // --- 6. LIQUIDACIÓN DE NÓMINA ---
  renderNomina() {
    this.mountTemplate("tmpl-nomina-view");
    document.getElementById("headerTitle").textContent = "Nómina Legal";

    const btnBack = document.getElementById("btnBackHomeNom");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const selEmp = document.getElementById("nomEmpleadoId");
    const emps = this.store.getEmpleados(true);
    selEmp.innerHTML = emps.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");

    const btnLiquidar = document.getElementById("btnLiquidarNomina");
    if (btnLiquidar) {
      btnLiquidar.onclick = () => {
        const empId = selEmp.value;
        const fIni = new Date(document.getElementById("nomFechaInicio").value).getTime();
        const fFin = new Date(document.getElementById("nomFechaFin").value).getTime();

        if (!fIni || !fFin) {
          alert("Selecciona las fechas de inicio y fin del periodo a liquidar.");
          return;
        }

        const res = this.store.liquidarNominaCompleta(empId, fIni, fFin);
        alert(`Liquidación Completada:\nNeto a Pagar: $${res.neto_a_pagar.toLocaleString()}\nCesantías Prov: $${res.cesantias_estimadas.toLocaleString()}`);
        this.renderNominaTable();
      };
    }

    this.renderNominaTable();
  }

  renderNominaTable() {
    const tbody = document.getElementById("pagosTbody");
    const pagos = this.store.getPagosNomina();
    const emps = this.store.getEmpleados(false);

    if (pagos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-sub); padding:20px;">Sin pagos liquidados.</td></tr>`;
      return;
    }

    tbody.innerHTML = pagos.map(p => {
      const emp = emps.find(e => String(e.id) === String(p.empleado_id)) || { nombre: "Colaborador" };
      const fIni = new Date(p.periodo_inicio).toLocaleDateString();
      const fFin = new Date(p.periodo_fin).toLocaleDateString();
      const totalPrestaciones = p.cesantias_estimadas + p.intereses_cesantias_estimadas + p.prima_estimada + p.vacaciones_estimadas;

      return `
        <tr>
          <td><small>${fIni} - ${fFin}</small></td>
          <td><strong>${emp.nombre}</strong></td>
          <td>$${(p.sueldo_base + p.horas_extras_recargos + p.auxilio_transporte).toLocaleString()}</td>
          <td style="color:#fca5a5;">-$${(p.deduccion_salud + p.deduccion_pension + p.deduccion_novedades).toLocaleString()}</td>
          <td><strong style="color:var(--accent-green);">$${p.neto_a_pagar.toLocaleString()}</strong></td>
          <td><small>$${totalPrestaciones.toLocaleString()}</small></td>
          <td>
            ${p.pagado_flag ? '<span class="badge badge-active">PAGADO</span>' : `<button class="btn-primary btn-sm btn-mark-paid" data-id="${p.id}">Registrar Pago</button>`}
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-mark-paid").forEach(btn => {
      btn.onclick = () => {
        this.store.marcarPagoRealizado(btn.dataset.id);
        this.renderNominaTable();
      };
    });
  }

  // --- 7. CONFIGURACIÓN LEGAL Y RECARGOS ---
  renderConfig() {
    this.mountTemplate("tmpl-config-view");
    document.getElementById("headerTitle").textContent = "Parámetros de Ley";

    const btnBack = document.getElementById("btnBackHomeConf");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const conf = this.store.getConfig();
    const fHoraNoc = document.getElementById("confHoraNocturna");
    const fFinNoc = document.getElementById("confFinNocturna");
    const fRecNoc = document.getElementById("confRecargoNocturno");
    const fExDia = document.getElementById("confExtraDiurna");
    const fExNoc = document.getElementById("confExtraNocturna");
    const fFest = document.getElementById("confFestivo");
    const fExFestDia = document.getElementById("confExtraFestivoDia");
    const fExFestNoc = document.getElementById("confExtraFestivoNoc");
    const fSalud = document.getElementById("confDescSalud");
    const fPension = document.getElementById("confDescPension");
    const fAux = document.getElementById("confAuxTransporte");
    const fCes = document.getElementById("confCesantias");
    const fIntCes = document.getElementById("confInteresesCesantias");
    const fPrima = document.getElementById("confPrima");
    const fVac = document.getElementById("confVacaciones");

    fHoraNoc.value = conf.hora_inicio_nocturna || "21:00";
    fFinNoc.value = conf.hora_fin_nocturna || "06:00";
    fRecNoc.value = conf.recargo_nocturno_pct || 35;
    fExDia.value = conf.recargo_extra_diurna_pct || 25;
    fExNoc.value = conf.recargo_extra_nocturna_pct || 75;
    fFest.value = conf.recargo_festivo_pct || 75;
    fExFestDia.value = conf.recargo_extra_festivo_diurna_pct || 100;
    fExFestNoc.value = conf.recargo_extra_festivo_nocturna_pct || 150;
    fSalud.value = conf.descuento_salud_pct || 4;
    fPension.value = conf.descuento_pension_pct || 4;
    fAux.value = conf.auxilio_transporte_mensual || 162000;
    fCes.value = conf.provision_cesantias_pct || 8.33;
    fIntCes.value = conf.provision_intereses_cesantias_pct || 1.0;
    fPrima.value = conf.provision_prima_pct || 8.33;
    fVac.value = conf.provision_vacaciones_pct || 4.17;

    const form = document.getElementById("confForm");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.store.saveConfig({
          hora_inicio_nocturna: fHoraNoc.value,
          hora_fin_nocturna: fFinNoc.value,
          recargo_nocturno_pct: parseFloat(fRecNoc.value) || 35,
          recargo_extra_diurna_pct: parseFloat(fExDia.value) || 25,
          recargo_extra_nocturna_pct: parseFloat(fExNoc.value) || 75,
          recargo_festivo_pct: parseFloat(fFest.value) || 75,
          recargo_extra_festivo_diurna_pct: parseFloat(fExFestDia.value) || 100,
          recargo_extra_festivo_nocturna_pct: parseFloat(fExFestNoc.value) || 150,
          descuento_salud_pct: parseFloat(fSalud.value) || 4,
          descuento_pension_pct: parseFloat(fPension.value) || 4,
          auxilio_transporte_mensual: parseFloat(fAux.value) || 162000,
          provision_cesantias_pct: parseFloat(fCes.value) || 8.33,
          provision_intereses_cesantias_pct: parseFloat(fIntCes.value) || 1.0,
          provision_prima_pct: parseFloat(fPrima.value) || 8.33,
          provision_vacaciones_pct: parseFloat(fVac.value) || 4.17
        });
        alert("Parámetros laborales y porcentajes de ley guardados.");
        this.renderHome();
      };
    }
  }
}

// Inicialización blindada: Solo corre cuando el DOM está completamente parsed
window.addEventListener("DOMContentLoaded", () => {
  new HRController();
});
