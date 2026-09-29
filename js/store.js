/**
 * MODELO DE DATOS: Gestión Humana, Parámetros Legales, Liquidación Completa y Seguridad Social
 * KoraDevsOrg - Licencia MIT
 */

export class HRStore {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";[cite: 6]
    this.KEY_USERS = "kora_hr_users_v3";
    this.KEY_EMPS = "kora_hr_emps_v3";
    this.KEY_CONF = "kora_hr_conf_v3";
    this.KEY_NOVS = "kora_hr_novs_v3";
    this.KEY_TURNS = "kora_hr_turns_v3";
    this.KEY_PAGOS = "kora_hr_pagos_v3";
    this.initDatabase();
  }

  initDatabase() {
    if (this.hasBridge) {[cite: 6]
      try {
        const ddl = `
          CREATE TABLE IF NOT EXISTS mod_hr_usuarios (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            pin_hash TEXT NOT NULL,
            rol TEXT NOT NULL,
            permisos_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
          CREATE TABLE IF NOT EXISTS mod_hr_empleados (
            id TEXT PRIMARY KEY,
            documento_id TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            rol_oficio TEXT NOT NULL,
            tipo_pago TEXT NOT NULL,
            salario_base REAL NOT NULL,
            costo_minuto REAL NOT NULL,
            nivel_estudios TEXT,
            estado_civil TEXT,
            num_hijos INTEGER DEFAULT 0,
            contacto_emergencia_nombre TEXT,
            contacto_emergencia_tel TEXT,
            activo INTEGER DEFAULT 1,
            updated_at INTEGER NOT NULL
          );
          CREATE TABLE IF NOT EXISTS mod_hr_configuracion (
            id TEXT PRIMARY KEY,
            hora_inicio_nocturna TEXT DEFAULT '21:00',
            hora_fin_nocturna TEXT DEFAULT '06:00',
            recargo_nocturno_pct REAL DEFAULT 35,
            recargo_extra_diurna_pct REAL DEFAULT 25,
            recargo_extra_nocturna_pct REAL DEFAULT 75,
            recargo_festivo_pct REAL DEFAULT 75,
            recargo_extra_festivo_diurna_pct REAL DEFAULT 100,
            recargo_extra_festivo_nocturna_pct REAL DEFAULT 150,
            descuento_salud_pct REAL DEFAULT 4,
            descuento_pension_pct REAL DEFAULT 4,
            provision_cesantias_pct REAL DEFAULT 8.33,
            provision_intereses_cesantias_pct REAL DEFAULT 1,
            provision_prima_pct REAL DEFAULT 8.33,
            provision_vacaciones_pct REAL DEFAULT 4.17,
            auxilio_transporte_mensual REAL DEFAULT 162000,
            updated_at INTEGER NOT NULL
          );
          CREATE TABLE IF NOT EXISTS mod_hr_novedades (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            tipo_novedad TEXT NOT NULL,
            fecha_inicio INTEGER NOT NULL,
            fecha_fin INTEGER NOT NULL,
            dias_duracion INTEGER NOT NULL,
            porcentaje_pago REAL DEFAULT 100,
            motivo TEXT
          );
          CREATE TABLE IF NOT EXISTS mod_hr_turnos (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            fecha_inicio INTEGER NOT NULL,
            fecha_fin INTEGER,
            minutos_ordinarios REAL DEFAULT 0,
            minutos_extra_diurna REAL DEFAULT 0,
            minutos_extra_nocturna REAL DEFAULT 0,
            minutos_festivos REAL DEFAULT 0,
            costo_total_jornada REAL DEFAULT 0,
            liquidado_en_nomina_id TEXT
          );
          CREATE TABLE IF NOT EXISTS mod_hr_pagos_nomina (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            periodo_inicio INTEGER NOT NULL,
            periodo_fin INTEGER NOT NULL,
            sueldo_base REAL NOT NULL,
            auxilio_transporte REAL NOT NULL,
            horas_extras_recargos REAL NOT NULL,
            deduccion_salud REAL NOT NULL,
            deduccion_pension REAL NOT NULL,
            deduccion_novedades REAL NOT NULL,
            neto_a_pagar REAL NOT NULL,
            cesantias_estimadas REAL NOT NULL,
            intereses_cesantias_estimadas REAL NOT NULL,
            prima_estimada REAL NOT NULL,
            vacaciones_estimadas REAL NOT NULL,
            pagado_flag INTEGER DEFAULT 0,
            fecha_pago INTEGER,
            updated_at INTEGER NOT NULL
          );
        `;
        window.KoraDB.registerModule("org.koradevs.negocios.rrhh", "Kora RRHH", 1, ddl);[cite: 6]
      } catch (e) {
        console.warn("[HRStore] Error inicializando SQLite:", e);
      }
    }

    // Configuración paramétrica inicial
    if (!localStorage.getItem(this.KEY_CONF)) {
      const confDefault = {
        id: "conf_global",
        hora_inicio_nocturna: "21:00",
        hora_fin_nocturna: "06:00",
        recargo_nocturno_pct: 35,
        recargo_extra_diurna_pct: 25,
        recargo_extra_nocturna_pct: 75,
        recargo_festivo_pct: 75,
        recargo_extra_festivo_diurna_pct: 100,
        recargo_extra_festivo_nocturna_pct: 150,
        descuento_salud_pct: 4,
        descuento_pension_pct: 4,
        provision_cesantias_pct: 8.33,
        provision_intereses_cesantias_pct: 1.0,
        provision_prima_pct: 8.33,
        provision_vacaciones_pct: 4.17,
        auxilio_transporte_mensual: 162000,
        updated_at: Date.now()
      };
      localStorage.setItem(this.KEY_CONF, JSON.stringify(confDefault));
    }

    // Semillas para pruebas
    if (!localStorage.getItem(this.KEY_EMPS)) {
      const seedEmps = [
        {
          id: "emp_1",
          documento_id: "1001",
          nombre: "Administrador / Dueño",
          rol_oficio: "ADMINISTRADOR",
          tipo_pago: "MENSUAL",
          salario_base: 2000000,
          costo_minuto: 138.88,
          nivel_estudios: "Profesional",
          estado_civil: "Casado/a",
          num_hijos: 1,
          contacto_emergencia_nombre: "Familiar",
          contacto_emergencia_tel: "3000000000",
          activo: 1,
          updated_at: Date.now()
        },
        {
          id: "emp_2",
          documento_id: "1002",
          nombre: "Operario de Producción",
          rol_oficio: "COCINERO / OPERARIO",
          tipo_pago: "MENSUAL",
          salario_base: 1300000,
          costo_minuto: 90.27,
          nivel_estudios: "Bachiller",
          estado_civil: "Soltero/a",
          num_hijos: 0,
          contacto_emergencia_nombre: "Madre",
          contacto_emergencia_tel: "3100000000",
          activo: 1,
          updated_at: Date.now()
        }
      ];
      localStorage.setItem(this.KEY_EMPS, JSON.stringify(seedEmps));
    }

    if (!localStorage.getItem(this.KEY_NOVS)) localStorage.setItem(this.KEY_NOVS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEY_TURNS)) localStorage.setItem(this.KEY_TURNS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEY_PAGOS)) localStorage.setItem(this.KEY_PAGOS, JSON.stringify([]));
  }

  getConfig() {
    return JSON.parse(localStorage.getItem(this.KEY_CONF) || "{}");
  }

  saveConfig(conf) {
    const record = { ...conf, updated_at: Date.now() };
    localStorage.setItem(this.KEY_CONF, JSON.stringify(record));
    if (this.hasBridge) {[cite: 6]
      try {
        const sql = `
          INSERT OR REPLACE INTO mod_hr_configuracion 
          (id, hora_inicio_nocturna, hora_fin_nocturna, recargo_nocturno_pct, recargo_extra_diurna_pct, recargo_extra_nocturna_pct, recargo_festivo_pct, recargo_extra_festivo_diurna_pct, recargo_extra_festivo_nocturna_pct, descuento_salud_pct, descuento_pension_pct, provision_cesantias_pct, provision_intereses_cesantias_pct, provision_prima_pct, provision_vacaciones_pct, auxilio_transporte_mensual, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sql, JSON.stringify([[cite: 6]
          "conf_global", record.hora_inicio_nocturna, record.hora_fin_nocturna,
          record.recargo_nocturno_pct, record.recargo_extra_diurna_pct, record.recargo_extra_nocturna_pct,
          record.recargo_festivo_pct, record.recargo_extra_festivo_diurna_pct, record.recargo_extra_festivo_nocturna_pct,
          record.descuento_salud_pct, record.descuento_pension_pct, record.provision_cesantias_pct,
          record.provision_intereses_cesantias_pct, record.provision_prima_pct, record.provision_vacaciones_pct,
          record.auxilio_transporte_mensual, record.updated_at
        ]));
      } catch (e) {}
    }
  }

  getEmpleados(soloActivos = true) {
    if (this.hasBridge) {[cite: 6]
      try {
        const sql = soloActivos ? "SELECT * FROM mod_hr_empleados WHERE activo = 1 ORDER BY nombre ASC" : "SELECT * FROM mod_hr_empleados ORDER BY nombre ASC";
        return JSON.parse(window.KoraDB.query(sql, "[]"));[cite: 6]
      } catch (e) {}
    }
    const emps = JSON.parse(localStorage.getItem(this.KEY_EMPS) || "[]");
    return soloActivos ? emps.filter(e => e.activo === 1) : emps;
  }

  getEmpleadoById(id) {
    return this.getEmpleados(false).find(e => String(e.id) === String(id)) || null;
  }

  saveEmpleado(emp) {
    const list = JSON.parse(localStorage.getItem(this.KEY_EMPS) || "[]");
    const record = {
      ...emp,
      id: emp.id || `emp_${Date.now()}`,
      salario_base: Number(emp.salario_base) || 0,
      costo_minuto: Number(emp.costo_minuto) || 0,
      num_hijos: parseInt(emp.num_hijos, 10) || 0,
      activo: emp.activo !== undefined ? emp.activo : 1,
      updated_at: Date.now()
    };
    const idx = list.findIndex(e => String(e.id) === String(record.id));
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    localStorage.setItem(this.KEY_EMPS, JSON.stringify(list));

    if (this.hasBridge) {[cite: 6]
      try {
        const sql = `
          INSERT OR REPLACE INTO mod_hr_empleados 
          (id, documento_id, nombre, rol_oficio, tipo_pago, salario_base, costo_minuto, nivel_estudios, estado_civil, num_hijos, contacto_emergencia_nombre, contacto_emergencia_tel, activo, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sql, JSON.stringify([[cite: 6]
          record.id, record.documento_id, record.nombre, record.rol_oficio,
          record.tipo_pago, record.salario_base, record.costo_minuto,
          record.nivel_estudios || "", record.estado_civil || "", record.num_hijos,
          record.contacto_emergencia_nombre || "", record.contacto_emergencia_tel || "",
          record.activo, record.updated_at
        ]));
      } catch (e) {}
    }
    return record;
  }

  deleteEmpleado(id) {
    const list = JSON.parse(localStorage.getItem(this.KEY_EMPS) || "[]");
    const idx = list.findIndex(e => String(e.id) === String(id));
    if (idx >= 0) {
      list[idx].activo = 0;
      localStorage.setItem(this.KEY_EMPS, JSON.stringify(list));
    }
    if (this.hasBridge) {[cite: 6]
      try {
        window.KoraDB.execute("UPDATE mod_hr_empleados SET activo = 0 WHERE id = ?;", JSON.stringify([String(id)]));[cite: 6]
      } catch (e) {}
    }
  }

  // --- NOVEDADES ---
  getNovedades(empleadoId = null) {
    let list = JSON.parse(localStorage.getItem(this.KEY_NOVS) || "[]");
    if (empleadoId) list = list.filter(n => String(n.empleado_id) === String(empleadoId));
    return list.sort((a, b) => b.fecha_inicio - a.fecha_inicio);
  }

  saveNovedad(nov) {
    const list = this.getNovedades();
    const record = { ...nov, id: nov.id || `nov_${Date.now()}` };
    list.unshift(record);
    localStorage.setItem(this.KEY_NOVS, JSON.stringify(list));
    return record;
  }

  // --- TURNOS Y ASISTENCIA ---
  getTurnos(empleadoId = null) {
    let list = JSON.parse(localStorage.getItem(this.KEY_TURNS) || "[]");
    if (empleadoId) list = list.filter(t => String(t.empleado_id) === String(empleadoId));
    return list.sort((a, b) => b.fecha_inicio - a.fecha_inicio);
  }

  registrarInicioTurno(empleadoId) {
    const turnos = this.getTurnos();
    const nuevoTurno = {
      id: `trn_${Date.now()}`,
      empleado_id: empleadoId,
      fecha_inicio: Date.now(),
      fecha_fin: null,
      minutos_ordinarios: 0,
      minutos_extra_diurna: 0,
      minutos_extra_nocturna: 0,
      minutos_festivos: 0,
      costo_total_jornada: 0,
      liquidado_en_nomina_id: null
    };
    turnos.unshift(nuevoTurno);
    localStorage.setItem(this.KEY_TURNS, JSON.stringify(turnos));
    return nuevoTurno;
  }

  registrarFinTurno(turnoId) {
    const turnos = this.getTurnos();
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno || turno.fecha_fin) return null;

    const ahora = Date.now();
    turno.fecha_fin = ahora;

    const emp = this.getEmpleadoById(turno.empleado_id);
    const conf = this.getConfig();
    const valorMinutoBase = emp ? Number(emp.costo_minuto) : 100;

    const totalMinutos = Math.max(1, Math.round((ahora - turno.fecha_inicio) / (1000 * 60)));
    const ordinarios = Math.min(480, totalMinutos);
    const extras = Math.max(0, totalMinutos - 480);

    const fExtraDia = 1 + (Number(conf.recargo_extra_diurna_pct || 25) / 100);
    const fFestivo = (new Date(turno.fecha_inicio).getDay() === 0) ? (1 + (Number(conf.recargo_festivo_pct || 75) / 100)) : 1;

    turno.minutos_ordinarios = ordinarios;
    turno.minutos_extra_diurna = extras;
    turno.costo_total_jornada = ((ordinarios * valorMinutoBase) + (extras * valorMinutoBase * fExtraDia)) * fFestivo;

    localStorage.setItem(this.KEY_TURNS, JSON.stringify(turnos));
    return turno;
  }

  // --- LIQUIDACIÓN DE NÓMINA CON SEGURIDAD SOCIAL Y PRESTACIONES ---
  getPagosNomina() {
    return JSON.parse(localStorage.getItem(this.KEY_PAGOS) || "[]").sort((a, b) => b.periodo_fin - a.periodo_fin);
  }

  liquidarNominaCompleta(empleadoId, fInicio, fFin) {
    const emp = this.getEmpleadoById(empleadoId);
    const conf = this.getConfig();
    if (!emp) return null;

    const turnos = this.getTurnos(empleadoId).filter(t => t.fecha_inicio >= fInicio && t.fecha_inicio <= fFin && !t.liquidado_en_nomina_id && t.fecha_fin);
    const extrasYRecargos = turnos.reduce((acc, t) => acc + Number(t.costo_total_jornada), 0);

    // Días de incapacidad o permisos en el periodo
    const novedades = this.getNovedades(empleadoId).filter(n => n.fecha_inicio >= fInicio && n.fecha_inicio <= fFin);
    let deduccionNovedades = 0;
    novedades.forEach(n => {
      const pctPago = Number(n.porcentaje_pago);
      if (pctPago < 100) {
        const valorDia = Number(emp.salario_base) / 30;
        const descuentoPct = (100 - pctPago) / 100;
        deduccionNovedades += (valorDia * Number(n.dias_duracion) * descuentoPct);
      }
    });

    const sueldoBaseQuincenal = Number(emp.salario_base) / 2;
    const auxTransporteQuincenal = (Number(conf.auxilio_transporte_mensual || 162000) / 2);

    // IBC (Ingreso Base de Cotización para Salud y Pensión) = Sueldo + Extras (Sin auxilio de transporte)
    const ibc = sueldoBaseQuincenal + extrasYRecargos;
    const deduccionSalud = ibc * (Number(conf.descuento_salud_pct || 4) / 100);
    const deduccionPension = ibc * (Number(conf.descuento_pension_pct || 4) / 100);

    const totalDevengado = sueldoBaseQuincenal + auxTransporteQuincenal + extrasYRecargos;
    const totalDeducciones = deduccionSalud + deduccionPension + deduccionNovedades;
    const netoAPagar = Math.max(0, totalDevengado - totalDeducciones);

    // Provisiones de Prestaciones Sociales (A cargo de la empresa)
    const basePrestaciones = totalDevengado;
    const cesantias = basePrestaciones * (Number(conf.provision_cesantias_pct || 8.33) / 100);
    const interesesCesantias = cesantias * (Number(conf.provision_intereses_cesantias_pct || 1.0) / 100);
    const prima = basePrestaciones * (Number(conf.provision_prima_pct || 8.33) / 100);
    const vacaciones = (sueldoBaseQuincenal + extrasYRecargos) * (Number(conf.provision_vacaciones_pct || 4.17) / 100);

    const liquidacion = {
      id: `liq_${Date.now()}`,
      empleado_id: empleadoId,
      periodo_inicio: fInicio,
      periodo_fin: fFin,
      sueldo_base: Math.round(sueldoBaseQuincenal),
      auxilio_transporte: Math.round(auxTransporteQuincenal),
      horas_extras_recargos: Math.round(extrasYRecargos),
      deduccion_salud: Math.round(deduccionSalud),
      deduccion_pension: Math.round(deduccionPension),
      deduccion_novedades: Math.round(deduccionNovedades),
      neto_a_pagar: Math.round(netoAPagar),
      cesantias_estimadas: Math.round(cesantias),
      intereses_cesantias_estimadas: Math.round(interesesCesantias),
      prima_estimada: Math.round(prima),
      vacaciones_estimadas: Math.round(vacaciones),
      pagado_flag: 0,
      fecha_pago: null,
      updated_at: Date.now()
    };

    const pagos = this.getPagosNomina();
    pagos.unshift(liquidacion);
    localStorage.setItem(this.KEY_PAGOS, JSON.stringify(pagos));

    turnos.forEach(t => t.liquidado_en_nomina_id = liquidacion.id);
    localStorage.setItem(this.KEY_TURNS, JSON.stringify(this.getTurnos()));

    return liquidacion;
  }

  marcarPagoRealizado(pagoId) {
    const pagos = this.getPagosNomina();
    const p = pagos.find(x => x.id === pagoId);
    if (p) {
      p.pagado_flag = 1;
      p.fecha_pago = Date.now();
      localStorage.setItem(this.KEY_PAGOS, JSON.stringify(pagos));
    }
  }
}
