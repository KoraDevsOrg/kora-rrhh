/**
 * MODELO DE DATOS: Gestión Humana, Liquidación Legal, Novedades y Control RBAC
 * KoraDevsOrg - Licencia MIT
 */

export class HRStore {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";[cite: 3, 5]
    this.KEY_USERS = "kora_hr_usuarios_v2";
    this.KEY_EMPS = "kora_hr_empleados_v2";
    this.KEY_CONF = "kora_hr_configuracion_v2";
    this.KEY_NOVS = "kora_hr_novedades_v2";
    this.KEY_TURNS = "kora_hr_turnos_v2";
    this.KEY_PAGOS = "kora_hr_pagos_v2";
    this.initDatabase();
  }

  initDatabase() {
    if (this.hasBridge) {[cite: 3, 5]
      try {
        const ddl = `
          CREATE TABLE IF NOT EXISTS mod_hr_usuarios (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            pin_hash TEXT NOT NULL,
            rol TEXT NOT NULL,
            permisos_modulos_json TEXT NOT NULL,
            es_admin_maestro INTEGER DEFAULT 0,
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
            hora_entrada_programada TEXT DEFAULT '08:00',
            hora_salida_programada TEXT DEFAULT '17:00',
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
            dias_festivos_json TEXT DEFAULT '[]',
            bssid_red_autorizada TEXT,
            updated_at INTEGER NOT NULL
          );
          CREATE TABLE IF NOT EXISTS mod_hr_novedades (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            tipo_novedad TEXT NOT NULL,
            fecha_inicio INTEGER NOT NULL,
            fecha_fin INTEGER NOT NULL,
            dias_duracion INTEGER NOT NULL,
            remunerada INTEGER DEFAULT 1,
            motivo TEXT,
            estado TEXT DEFAULT 'APROBADA'
          );
          CREATE TABLE IF NOT EXISTS mod_hr_turnos (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            fecha_inicio INTEGER NOT NULL,
            fecha_fin INTEGER,
            minutos_ordinarios REAL DEFAULT 0,
            minutos_extra_diurna REAL DEFAULT 0,
            minutos_extra_nocturna REAL DEFAULT 0,
            minutos_recargo_nocturno REAL DEFAULT 0,
            minutos_festivos REAL DEFAULT 0,
            costo_total_jornada REAL DEFAULT 0,
            liquidado_en_nomina_id TEXT
          );
          CREATE TABLE IF NOT EXISTS mod_hr_pagos_nomina (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            periodo_inicio INTEGER NOT NULL,
            periodo_fin INTEGER NOT NULL,
            total_devengado REAL NOT NULL,
            total_deducciones REAL NOT NULL,
            neto_pagado REAL NOT NULL,
            pagado_flag INTEGER DEFAULT 0,
            fecha_pago INTEGER,
            comprobante_json TEXT NOT NULL
          );
        `;
        window.KoraDB.registerModule("org.koradevs.negocios.rrhh", "Kora RRHH", 1, ddl);[cite: 3, 5]
      } catch (e) {
        console.warn("[HRStore] Error inicializando SQLite:", e);
      }
    }

    // Configuración paramétrica inicial de jornada
    if (!localStorage.getItem(this.KEY_CONF)) {
      const defaultConfig = {
        id: "conf_default",
        hora_inicio_nocturna: "21:00",
        hora_fin_nocturna: "06:00",
        recargo_nocturno_pct: 35,
        recargo_extra_diurna_pct: 25,
        recargo_extra_nocturna_pct: 75,
        recargo_festivo_pct: 75,
        dias_festivos: ["2026-01-01", "2026-05-01", "2026-07-20", "2026-08-07", "2026-12-25"],
        bssid_red_autorizada: "",
        updated_at: Date.now()
      };
      localStorage.setItem(this.KEY_CONF, JSON.stringify(defaultConfig));
    }

    // Semilla inicial si está vacío
    if (!localStorage.getItem(this.KEY_EMPS)) {
      const seedEmps = [
        {
          id: "emp_admin",
          documento_id: "1001",
          nombre: "Administrador / Dueño",
          rol_oficio: "ADMINISTRADOR",
          tipo_pago: "MENSUAL",
          salario_base: 2400000,
          costo_minuto: 166.66,
          nivel_estudios: "Técnico / Universidad",
          estado_civil: "Casado/a",
          num_hijos: 1,
          contacto_emergencia_nombre: "Familiar",
          contacto_emergencia_tel: "3000000000",
          hora_entrada_programada: "08:00",
          hora_salida_programada: "17:00",
          activo: 1,
          updated_at: Date.now()
        }
      ];
      localStorage.setItem(this.KEY_EMPS, JSON.stringify(seedEmps));

      // Usuario administrador inicial (PIN por defecto: 1234)
      const seedUsers = [
        {
          id: "usr_admin",
          empleado_id: "emp_admin",
          pin_hash: "1234",
          rol: "ADMINISTRADOR",
          permisos_modulos: ["inventario", "fabricacion", "ventas", "rrhh", "costos", "financiero"],
          es_admin_maestro: 1,
          updated_at: Date.now()
        }
      ];
      localStorage.setItem(this.KEY_USERS, JSON.stringify(seedUsers));
    }

    if (!localStorage.getItem(this.KEY_NOVS)) localStorage.setItem(this.KEY_NOVS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEY_TURNS)) localStorage.setItem(this.KEY_TURNS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEY_PAGOS)) localStorage.setItem(this.KEY_PAGOS, JSON.stringify([]));
  }

  // --- CONTROL DE ACCESO Y SEGURIDAD (RBAC) ---
  getUsuarios() {
    return JSON.parse(localStorage.getItem(this.KEY_USERS) || "[]");
  }

  autenticar(pin) {
    const users = this.getUsuarios();
    return users.find(u => u.pin_hash === String(pin)) || null;
  }

  guardarUsuario(usr) {
    const users = this.getUsuarios();
    const idx = users.findIndex(u => u.id === usr.id);
    if (idx >= 0) users[idx] = usr;
    else users.push(usr);
    localStorage.setItem(this.KEY_USERS, JSON.stringify(users));
  }

  // --- CONFIGURACIÓN DE NÓMINA Y FESTIVOS ---
  getConfig() {
    return JSON.parse(localStorage.getItem(this.KEY_CONF) || "{}");
  }

  saveConfig(conf) {
    localStorage.setItem(this.KEY_CONF, JSON.stringify({ ...conf, updated_at: Date.now() }));
  }

  // --- EMPLEADOS Y HOJA DE VIDA ---
  getEmpleados(soloActivos = true) {
    if (this.hasBridge) {[cite: 3, 5]
      try {
        const sql = soloActivos ? "SELECT * FROM mod_hr_empleados WHERE activo = 1 ORDER BY nombre ASC" : "SELECT * FROM mod_hr_empleados ORDER BY nombre ASC";
        return JSON.parse(window.KoraDB.query(sql, "[]"));[cite: 3, 5]
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
      costo_minuto: Number(emp.costo_minuto) || 0,
      salario_base: Number(emp.salario_base) || 0,
      num_hijos: parseInt(emp.num_hijos, 10) || 0,
      activo: emp.activo !== undefined ? emp.activo : 1,
      updated_at: Date.now()
    };

    const idx = list.findIndex(e => String(e.id) === String(record.id));
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    localStorage.setItem(this.KEY_EMPS, JSON.stringify(list));

    if (this.hasBridge) {[cite: 3, 5]
      try {
        const sql = `
          INSERT OR REPLACE INTO mod_hr_empleados 
          (id, documento_id, nombre, rol_oficio, tipo_pago, salario_base, costo_minuto, nivel_estudios, estado_civil, num_hijos, contacto_emergencia_nombre, contacto_emergencia_tel, hora_entrada_programada, hora_salida_programada, activo, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sql, JSON.stringify([[cite: 3, 5]
          record.id, record.documento_id, record.nombre, record.rol_oficio,
          record.tipo_pago, record.salario_base, record.costo_minuto,
          record.nivel_estudios || "", record.estado_civil || "", record.num_hijos,
          record.contacto_emergencia_nombre || "", record.contacto_emergencia_tel || "",
          record.hora_entrada_programada || "08:00", record.hora_salida_programada || "17:00",
          record.activo, record.updated_at
        ]));
      } catch (e) {}
    }
    return record;
  }

  // --- NOVEDADES (INCAPACIDAD, VACACIONES, PERMISOS) ---
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

  // --- TURNOS Y CÁLCULO PRECISO DE HORAS EXTRAS / RECARGOS ---
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
      minutos_recargo_nocturno: 0,
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

    // Duración total en minutos
    const totalMinutos = Math.max(1, Math.round((ahora - turno.fecha_inicio) / (1000 * 60)));

    // Discriminación de jornada (estándar 8 horas = 480 min)
    let ordinarios = Math.min(480, totalMinutos);
    let extras = Math.max(0, totalMinutos - 480);

    // Detección de festivo
    const fechaStr = new Date(turno.fecha_inicio).toISOString().split("T")[0];
    const esFestivo = (conf.dias_festivos || []).includes(fechaStr) || new Date(turno.fecha_inicio).getDay() === 0;

    // Recargos
    const factorExtraDiurna = 1 + (Number(conf.recargo_extra_diurna_pct || 25) / 100);
    const factorFestivo = 1 + (Number(conf.recargo_festivo_pct || 75) / 100);

    turno.minutos_ordinarios = ordinarios;
    turno.minutos_extra_diurna = extras;

    let costoJornada = (ordinarios * valorMinutoBase) + (extras * valorMinutoBase * factorExtraDiurna);
    if (esFestivo) {
      costoJornada *= factorFestivo;
      turno.minutos_festivos = totalMinutos;
    }

    turno.costo_total_jornada = costoJornada;
    localStorage.setItem(this.KEY_TURNS, JSON.stringify(turnos));
    return turno;
  }

  // --- LIQUIDACIÓN DE NÓMINA Y REGISTRO DE PAGOS ---
  getPagosNomina() {
    return JSON.parse(localStorage.getItem(this.KEY_PAGOS) || "[]").sort((a, b) => b.periodo_fin - a.periodo_fin);
  }

  liquidarNominaEmpleado(empleadoId, fechaInicio, fechaFin) {
    const emp = this.getEmpleadoById(empleadoId);
    if (!emp) return null;

    // 1. Turnos acumulados no liquidados
    const turnos = this.getTurnos(empleadoId).filter(t => t.fecha_inicio >= fechaInicio && t.fecha_inicio <= fechaFin && !t.liquidado_en_nomina_id && t.fecha_fin);
    let totalExtrasJornadas = turnos.reduce((acc, t) => acc + Number(t.costo_total_jornada), 0);

    // 2. Novedades que descuentan
    const novedades = this.getNovedades(empleadoId).filter(n => n.fecha_inicio >= fechaInicio && n.fecha_inicio <= fechaFin);
    let totalDeducciones = 0;
    novedades.forEach(n => {
      if (Number(n.remunerada) === 0) {
        // Descuento de día no remunerado: Salario base / 30 * días
        const valorDia = Number(emp.salario_base) / 30;
        totalDeducciones += valorDia * Number(n.dias_duracion);
      }
    });

    const sueldoBasePeriodo = emp.tipo_pago === "MENSUAL" ? (Number(emp.salario_base) / 2) : totalExtrasJornadas; // Quincenal
    const totalDevengado = sueldoBasePeriodo + (emp.tipo_pago === "MENSUAL" ? (totalExtrasJornadas - (turnos.length * 480 * emp.costo_minuto)) : 0);
    const netoAPagar = Math.max(0, totalDevengado - totalDeducciones);

    const liquidacion = {
      id: `nom_${Date.now()}`,
      empleado_id: empleadoId,
      periodo_inicio: fechaInicio,
      periodo_fin: fechaFin,
      total_devengado: Math.round(totalDevengado),
      total_deducciones: Math.round(totalDeducciones),
      neto_pagado: Math.round(netoAPagar),
      pagado_flag: 0,
      fecha_pago: null,
      comprobante_json: JSON.stringify({
        empleado: emp.nombre,
        documento: emp.documento_id,
        turnos_computados: turnos.length,
        novedades_descontadas: novedades.length
      })
    };

    const pagos = this.getPagosNomina();
    pagos.unshift(liquidacion);
    localStorage.setItem(this.KEY_PAGOS, JSON.stringify(pagos));

    // Marcar turnos como procesados
    turnos.forEach(t => t.liquidado_en_nomina_id = liquidacion.id);
    localStorage.setItem(this.KEY_TURNS, JSON.stringify(this.getTurnos()));

    return liquidacion;
  }

  marcarNominaComoPagada(pagoId) {
    const pagos = this.getPagosNomina();
    const p = pagos.find(x => x.id === pagoId);
    if (p) {
      p.pagado_flag = 1;
      p.fecha_pago = Date.now();
      localStorage.setItem(this.KEY_PAGOS, JSON.stringify(pagos));
    }
  }
}
