/**
 * MODELO: Gestión Humana, Liquidación Legal y Prestaciones
 * KoraDevsOrg - Licencia MIT
 */

export class HRStore {
  constructor() {
    this.KEY_CONF = "kora_hr_conf_v6";
    this.KEY_EMPS = "kora_hr_emps_v6";
    this.KEY_NOVS = "kora_hr_novs_v6";
    this.KEY_TURNS = "kora_hr_turns_v6";
    this.KEY_PAGOS = "kora_hr_pagos_v6";
    this.initSeeds();
  }

  initSeeds() {
    if (!localStorage.getItem(this.KEY_CONF)) {
      const defaultConf = {
        hora_inicio_nocturna: "21:00",
        hora_fin_nocturna: "06:00",
        recargo_nocturno_pct: 35,
        recargo_extra_diurna_pct: 25,
        recargo_extra_nocturna_pct: 75,
        recargo_festivo_pct: 75,
        descuento_salud_pct: 4,
        descuento_pension_pct: 4,
        provision_cesantias_pct: 8.33,
        provision_intereses_cesantias_pct: 1.0,
        provision_prima_pct: 8.33,
        provision_vacaciones_pct: 4.17,
        auxilio_transporte_mensual: 162000
      };
      localStorage.setItem(this.KEY_CONF, JSON.stringify(defaultConf));
    }

    if (!localStorage.getItem(this.KEY_EMPS)) {
      const seedEmps = [
        {
          id: "emp_1",
          documento_id: "1001",
          nombre: "Administrador / Dueño",
          rol_oficio: "ADMINISTRADOR",
          tipo_pago: "MENSUAL",
          salario_base: 2400000,
          costo_minuto: 166.66,
          nivel_estudios: "Profesional",
          estado_civil: "Casado/a",
          num_hijos: 1,
          contacto_emergencia_nombre: "Familiar",
          contacto_emergencia_tel: "3000000000",
          activo: 1
        },
        {
          id: "emp_2",
          documento_id: "1002",
          nombre: "Cocinero / Operario",
          rol_oficio: "OPERARIO",
          tipo_pago: "MENSUAL",
          salario_base: 1300000,
          costo_minuto: 90.27,
          nivel_estudios: "Bachiller",
          estado_civil: "Soltero/a",
          num_hijos: 0,
          contacto_emergencia_nombre: "Madre",
          contacto_emergencia_tel: "3100000000",
          activo: 1
        }
      ];
      localStorage.setItem(this.KEY_EMPS, JSON.stringify(seedEmps));
    }

    if (!localStorage.getItem(this.KEY_NOVS)) localStorage.setItem(this.KEY_NOVS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEY_TURNS)) localStorage.setItem(this.KEY_TURNS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEY_PAGOS)) localStorage.setItem(this.KEY_PAGOS, JSON.stringify([]));
  }

  getConfig() { return JSON.parse(localStorage.getItem(this.KEY_CONF) || "{}"); }
  saveConfig(conf) { localStorage.setItem(this.KEY_CONF, JSON.stringify(conf)); }

  getEmpleados() { return JSON.parse(localStorage.getItem(this.KEY_EMPS) || "[]").filter(e => e.activo === 1); }
  getEmpleadoById(id) { return this.getEmpleados().find(e => String(e.id) === String(id)) || null; }
  
  saveEmpleado(emp) {
    const list = JSON.parse(localStorage.getItem(this.KEY_EMPS) || "[]");
    const record = { ...emp, id: emp.id || `emp_${Date.now()}`, activo: 1 };
    const idx = list.findIndex(e => String(e.id) === String(record.id));
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    localStorage.setItem(this.KEY_EMPS, JSON.stringify(list));
    return record;
  }

  getNovedades() { return JSON.parse(localStorage.getItem(this.KEY_NOVS) || "[]"); }
  saveNovedad(nov) {
    const list = this.getNovedades();
    list.unshift({ ...nov, id: `nov_${Date.now()}` });
    localStorage.setItem(this.KEY_NOVS, JSON.stringify(list));
  }

  getTurnos() { return JSON.parse(localStorage.getItem(this.KEY_TURNS) || "[]"); }
  
  iniciarTurno(empId) {
    const list = this.getTurnos();
    list.unshift({
      id: `trn_${Date.now()}`,
      empleado_id: empId,
      fecha_inicio: Date.now(),
      fecha_fin: null,
      minutos_ordinarios: 0,
      minutos_extra: 0,
      costo_total: 0
    });
    localStorage.setItem(this.KEY_TURNS, JSON.stringify(list));
  }

  cerrarTurno(trnId) {
    const list = this.getTurnos();
    const t = list.find(x => x.id === trnId);
    if (!t || t.fecha_fin) return;
    const ahora = Date.now();
    t.fecha_fin = ahora;
    const emp = this.getEmpleadoById(t.empleado_id);
    const conf = this.getConfig();
    const mins = Math.max(1, Math.round((ahora - t.fecha_inicio) / 60000));
    const ord = Math.min(480, mins);
    const ext = Math.max(0, mins - 480);
    const costMin = emp ? Number(emp.costo_minuto) : 90;
    const fExt = 1 + (Number(conf.recargo_extra_diurna_pct || 25) / 100);

    t.minutos_ordinarios = ord;
    t.minutos_extra = ext;
    t.costo_total = (ord * costMin) + (ext * costMin * fExt);
    localStorage.setItem(this.KEY_TURNS, JSON.stringify(list));
  }

  getPagosNomina() { return JSON.parse(localStorage.getItem(this.KEY_PAGOS) || "[]"); }

  liquidar(empId, fIni, fFin) {
    const emp = this.getEmpleadoById(empId);
    const conf = this.getConfig();
    const sueldoBaseQuincenal = Number(emp.salario_base) / 2;
    const auxTransporte = Number(conf.auxilio_transporte_mensual || 162000) / 2;

    const turnos = this.getTurnos().filter(t => t.empleado_id === empId && t.fecha_inicio >= fIni && t.fecha_inicio <= fFin && t.fecha_fin);
    const extras = turnos.reduce((acc, curr) => acc + (curr.minutos_extra * emp.costo_minuto * 1.25), 0);

    const novedades = this.getNovedades().filter(n => n.empleado_id === empId && n.fecha_inicio >= fIni && n.fecha_inicio <= fFin);
    let deducNov = 0;
    novedades.forEach(n => {
      if (Number(n.porcentaje_pago) < 100) {
        const valDia = Number(emp.salario_base) / 30;
        deducNov += valDia * Number(n.dias) * ((100 - Number(n.porcentaje_pago)) / 100);
      }
    });

    const ibc = sueldoBaseQuincenal + extras;
    const salud = ibc * (Number(conf.descuento_salud_pct || 4) / 100);
    const pension = ibc * (Number(conf.descuento_pension_pct || 4) / 100);

    const devengado = sueldoBaseQuincenal + auxTransporte + extras;
    const deducciones = salud + pension + deducNov;
    const neto = Math.max(0, devengado - deducciones);

    // Provisiones de ley (Costo real de empresa)
    const cesantias = devengado * (Number(conf.provision_cesantias_pct || 8.33) / 100);
    const intCesantias = cesantias * (Number(conf.provision_intereses_cesantias_pct || 1) / 100);
    const prima = devengado * (Number(conf.provision_prima_pct || 8.33) / 100);
    const vacaciones = (sueldoBaseQuincenal + extras) * (Number(conf.provision_vacaciones_pct || 4.17) / 100);

    const pago = {
      id: `pgo_${Date.now()}`,
      empleado_id: empId,
      periodo_str: `${new Date(fIni).toLocaleDateString()} - ${new Date(fFin).toLocaleDateString()}`,
      devengado: Math.round(devengado),
      deducciones: Math.round(deducciones),
      neto: Math.round(neto),
      prestaciones: Math.round(cesantias + intCesantias + prima + vacaciones),
      pagado: 0
    };

    const pagos = this.getPagosNomina();
    pagos.unshift(pago);
    localStorage.setItem(this.KEY_PAGOS, JSON.stringify(pagos));
    return pago;
  }

  marcarPagado(pgoId) {
    const list = this.getPagosNomina();
    const p = list.find(x => x.id === pgoId);
    if (p) {
      p.pagado = 1;
      localStorage.setItem(this.KEY_PAGOS, JSON.stringify(list));
    }
  }
}
