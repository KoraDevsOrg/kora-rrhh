import { HRStore } from "./store.js";

class HRController {
  constructor() {
    this.store = new HRStore();
    this.mainEl = document.getElementById("appContent");
    this.editingEmpId = null;

    this.initDrawer();
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

    const btnAdmin = document.getElementById("btnOpenKoraAdmin");
    if (btnAdmin) {
      btnAdmin.onclick = () => {
        toggle(false);
        window.location.href = "intent://org.koradevs.admindb/#Intent;scheme=package;end";
      };
    }
  }

  showExternalModuleNotice(modName) {
    this.mainEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px 16px;">
        <span style="font-size: 2.5rem;">🔗</span>
        <h2 style="color: var(--accent-gold); margin: 12px 0; font-size: 1.25rem;">${modName}</h2>
        <p style="color: var(--text-sub); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px;">
          Este módulo está desacoplado. Puedes abrirlo o instalarlo desde <strong>Kora Admin DB</strong> para compartir la misma base de datos.
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
    document.getElementById("headerTitle").textContent = "Kora Gestión Humana";

    const btnEmps = document.getElementById("btnActionEmployees");
    const btnNew = document.getElementById("btnActionNewEmp");
    const btnTurnos = document.getElementById("btnActionTurnos");

    if (btnEmps) btnEmps.onclick = () => this.renderEmployeesList();
    if (btnNew) btnNew.onclick = () => this.renderEmpForm(null);
    if (btnTurnos) btnTurnos.onclick = () => this.renderTurnos();
  }

  // --- 2. LISTADO DE COLABORADORES ---
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
          <strong style="color:#fff; font-size:1rem;">${e.nombre}</strong>
          <div style="font-size:0.8rem; color:var(--text-sub); margin-top:2px;">
            ${e.rol} • <span style="color:var(--accent-gold);">$${Math.round(e.costo_minuto)}/min</span>
          </div>
          <small style="color:var(--text-sub);">${e.tipo_pago} ($${Math.round(e.salario_base).toLocaleString()})</small>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary btn-sm btn-edit-emp" data-id="${e.id}">✏️</button>
          <button class="btn-danger btn-sm btn-del-emp" data-id="${e.id}">🗑️</button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-edit-emp").forEach(btn => {
      btn.onclick = () => this.renderEmpForm(btn.dataset.id);
    });

    container.querySelectorAll(".btn-del-emp").forEach(btn => {
      btn.onclick = () => {
        const emp = this.store.getEmpleadoById(btn.dataset.id);
        if (confirm(`¿Desactivar a ${emp.nombre}?`)) {
          this.store.deleteEmpleado(btn.dataset.id);
          this.renderEmployeesList();
        }
      };
    });
  }

  // --- 3. FORMULARIO: ALTA Y EDICIÓN CON CÁLCULO DE COSTO/MINUTO ---
  renderEmpForm(empId = null) {
    this.mountTemplate("tmpl-emp-form-view");
    document.getElementById("headerTitle").textContent = empId ? "Editar Colaborador" : "Nuevo Colaborador";

    const emp = empId ? this.store.getEmpleadoById(empId) : null;
    const form = document.getElementById("empForm");
    const idInput = document.getElementById("empId");
    const nombreInput = document.getElementById("empNombre");
    const rolInput = document.getElementById("empRol");
    const docInput = document.getElementById("empDoc");
    const tipoPagoSelect = document.getElementById("empTipoPago");
    const salarioInput = document.getElementById("empSalarioBase");
    const telInput = document.getElementById("empTelefono");
    const outCostoMinuto = document.getElementById("outCostoMinuto");
    const lblSalario = document.getElementById("lblSalarioBase");
    const lblFormula = document.getElementById("lblCalcFormula");

    // Lógica matemática de conversión a $/minuto
    const updateCostoMinuto = () => {
      const val = parseFloat(salarioInput.value) || 0;
      const tipo = tipoPagoSelect.value;
      let costoMin = 0;

      if (tipo === "FIJO_MENSUAL" || tipo === "DUENO") {
        lblSalario.textContent = "Salario Mensual Pactado ($):";
        lblFormula.textContent = "Basado en 240 horas mensuales (8h/día)";
        // 240 horas al mes * 60 min = 14.400 minutos laborales
        costoMin = val / 14400;
      } else {
        lblSalario.textContent = "Valor por Día Laborado ($):";
        lblFormula.textContent = "Basado en jornada diaria de 8 horas (480 min)";
        costoMin = val / 480;
      }
      outCostoMinuto.textContent = costoMin.toFixed(2);
    };

    salarioInput.oninput = updateCostoMinuto;
    tipoPagoSelect.onchange = updateCostoMinuto;

    if (emp) {
      document.getElementById("empFormTitle").textContent = "Editar Colaborador";
      idInput.value = emp.id;
      nombreInput.value = emp.nombre;
      rolInput.value = emp.rol;
      docInput.value = emp.documento_id || "";
      tipoPagoSelect.value = emp.tipo_pago;
      salarioInput.value = emp.salario_base;
      telInput.value = emp.telefono || "";
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
        const costoCalculado = parseFloat(outCostoMinuto.textContent) || 0;

        this.store.saveEmpleado({
          id: idInput.value || null,
          nombre: nombreInput.value.trim(),
          rol: rolInput.value.trim(),
          documento_id: docInput.value.trim(),
          tipo_pago: tipoPagoSelect.value,
          salario_base: parseFloat(salarioInput.value) || 0,
          costo_minuto: costoCalculado,
          telefono: telInput.value.trim()
        });

        this.renderEmployeesList();
      };
    }
  }

  // --- 4. TURNOS Y JORNADAS ---
  renderTurnos() {
    this.mountTemplate("tmpl-turnos-view");
    document.getElementById("headerTitle").textContent = "Asistencia & Turnos";

    const btnBack = document.getElementById("btnBackHomeTurnos");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const selEmp = document.getElementById("selEmpTurno");
    const emps = this.store.getEmpleados(true);
    selEmp.innerHTML = emps.map(e => `<option value="${e.id}">${e.nombre} (${e.rol})</option>`).join("");

    const btnStart = document.getElementById("btnStartTurno");
    if (btnStart) {
      btnStart.onclick = () => {
        if (!selEmp.value) return;
        this.store.registrarInicioTurno(selEmp.value, "Entrada normal");
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
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-sub); padding:20px;">Sin registros de turnos.</td></tr>`;
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
          <td><small>${horaIn}</small></td>
          <td>
            <small>${horaFin}</small><br>
            <span class="badge ${isOpen ? 'badge-progress' : 'badge-active'}">
              ${isOpen ? 'EN CURSO' : `${t.minutos_trabajados} min`}
            </span>
          </td>
          <td><strong>$ ${Math.round(t.costo_total_jornada).toLocaleString()}</strong></td>
          <td>
            ${isOpen ? `
              <button class="btn-primary btn-sm btn-close-shift" data-id="${t.id}">
                ■ Salida
              </button>
            ` : '<span style="color:var(--text-sub); font-size:0.75rem;">Cerrado</span>'}
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
}

document.addEventListener("DOMContentLoaded", () => {
  new HRController();
});
