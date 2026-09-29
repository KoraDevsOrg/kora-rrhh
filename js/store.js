/**
 * MODELO DE DATOS: Gestión Humana, Nómina y Turnos
 * KoraDevsOrg - Licencia MIT
 */

export class HRStore {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";
    this.KEY_HR = "kora_hr_empleados_v1";
    this.KEY_TURNOS = "kora_hr_turnos_v1";
    this.initDatabase();
  }

  initDatabase() {
    if (this.hasBridge) {
      try {
        const ddl = `
          CREATE TABLE IF NOT EXISTS mod_hr_empleados (
            id TEXT PRIMARY KEY,
            documento_id TEXT,
            nombre TEXT NOT NULL,
            rol TEXT NOT NULL,
            costo_minuto REAL NOT NULL,
            tipo_pago TEXT NOT NULL,
            salario_base REAL NOT NULL,
            activo INTEGER DEFAULT 1,
            telefono TEXT,
            updated_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS mod_hr_turnos (
            id TEXT PRIMARY KEY,
            empleado_id TEXT NOT NULL,
            fecha_inicio INTEGER NOT NULL,
            fecha_fin INTEGER,
            minutos_trabajados INTEGER DEFAULT 0,
            costo_total_jornada REAL DEFAULT 0,
            notas TEXT
          );
        `;
        window.KoraDB.registerModule("org.koradevs.negocios.rrhh", "Kora Gestión Humana", 1, ddl);
      } catch (e) {
        console.warn("[HRStore] Error inicializando SQLite:", e);
      }
    }

    // Datos semilla
    if (!localStorage.getItem(this.KEY_HR)) {
      const seedEmployees = [
        {
          id: "emp_dueno",
          documento_id: "1001",
          nombre: "Propietario / Administrador",
          rol: "ADMINISTRADOR",
          tipo_pago: "FIJO_MENSUAL",
          salario_base: 2000000,
          costo_minuto: 173.61, // 2'000.000 / (30 días * 8 horas * 60 min = 11.520 min mensuales)
          activo: 1,
          telefono: "3001234567",
          updated_at: Date.now()
        },
        {
          id: "emp_operario_1",
          documento_id: "1002",
          nombre: "Operario Producción / Cocinero",
          rol: "OPERARIO",
          tipo_pago: "POR_HORA",
          salario_base: 60000, // Día de 8 horas = $7.500 hora = $125 minuto
          costo_minuto: 125.0,
          activo: 1,
          telefono: "3109876543",
          updated_at: Date.now()
        }
      ];
      localStorage.setItem(this.KEY_HR, JSON.stringify(seedEmployees));
    }

    if (!localStorage.getItem(this.KEY_TURNOS)) {
      localStorage.setItem(this.KEY_TURNOS, JSON.stringify([]));
    }
  }

  getEmpleados(soloActivos = true) {
    if (this.hasBridge) {
      try {
        const sql = soloActivos ? "SELECT * FROM mod_hr_empleados WHERE activo = 1 ORDER BY nombre ASC" : "SELECT * FROM mod_hr_empleados ORDER BY nombre ASC";
        return JSON.parse(window.KoraDB.query(sql, "[]"));
      } catch (e) {}
    }
    const list = JSON.parse(localStorage.getItem(this.KEY_HR) || "[]");
    return soloActivos ? list.filter(e => e.activo === 1) : list;
  }

  getEmpleadoById(id) {
    return this.getEmpleados(false).find(e => String(e.id) === String(id)) || null;
  }

  saveEmpleado(emp) {
    const list = JSON.parse(localStorage.getItem(this.KEY_HR) || "[]");
    const record = {
      ...emp,
      id: emp.id || `emp_${Date.now()}`,
      costo_minuto: Number(emp.costo_minuto) || 0,
      salario_base: Number(emp.salario_base) || 0,
      activo: emp.activo !== undefined ? emp.activo : 1,
      updated_at: Date.now()
    };

    const idx = list.findIndex(e => String(e.id) === String(record.id));
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    localStorage.setItem(this.KEY_HR, JSON.stringify(list));

    if (this.hasBridge) {
      try {
        const sql = `
          INSERT OR REPLACE INTO mod_hr_empleados 
          (id, documento_id, nombre, rol, costo_minuto, tipo_pago, salario_base, activo, telefono, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sql, JSON.stringify([
          record.id, record.documento_id || "", record.nombre, record.rol,
          record.costo_minuto, record.tipo_pago, record.salario_base,
          record.activo, record.telefono || "", record.updated_at
        ]));
      } catch (e) {}
    }
    return record;
  }

  deleteEmpleado(id) {
    const list = JSON.parse(localStorage.getItem(this.KEY_HR) || "[]");
    const idx = list.findIndex(e => String(e.id) === String(id));
    if (idx >= 0) {
      list[idx].activo = 0; // Borrado lógico para preservar integridad en históricos
      localStorage.setItem(this.KEY_HR, JSON.stringify(list));
    }
    if (this.hasBridge) {
      try {
        window.KoraDB.execute("UPDATE mod_hr_empleados SET activo = 0 WHERE id = ?;", JSON.stringify([String(id)]));
      } catch (e) {}
    }
  }

  // --- CONTROL DE TURNOS Y ASISTENCIA ---
  getTurnos() {
    if (this.hasBridge) {
      try {
        return JSON.parse(window.KoraDB.query("SELECT * FROM mod_hr_turnos ORDER BY fecha_inicio DESC", "[]"));
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem(this.KEY_TURNOS) || "[]");
  }

  registrarInicioTurno(empleadoId, notas = "") {
    const turnos = this.getTurnos();
    const nuevoTurno = {
      id: `trn_${Date.now()}`,
      empleado_id: empleadoId,
      fecha_inicio: Date.now(),
      fecha_fin: null,
      minutos_trabajados: 0,
      costo_total_jornada: 0,
      notas: notas
    };

    turnos.unshift(nuevoTurno);
    localStorage.setItem(this.KEY_TURNOS, JSON.stringify(turnos));

    if (this.hasBridge) {
      try {
        const sql = `INSERT INTO mod_hr_turnos (id, empleado_id, fecha_inicio, fecha_fin, minutos_trabajados, costo_total_jornada, notas) VALUES (?, ?, ?, ?, ?, ?, ?);`;
        window.KoraDB.execute(sql, JSON.stringify([nuevoTurno.id, nuevoTurno.empleado_id, nuevoTurno.fecha_inicio, null, 0, 0, notas]));
      } catch (e) {}
    }
    return nuevoTurno;
  }

  registrarFinTurno(turnoId) {
    const turnos = this.getTurnos();
    const turno = turnos.find(t => String(t.id) === String(turnoId));
    if (!turno || turno.fecha_fin) return;

    const ahora = Date.now();
    const emp = this.getEmpleadoById(turno.empleado_id);
    const minutos = Math.max(1, Math.round((ahora - turno.fecha_inicio) / (1000 * 60)));
    const costoMinuto = emp ? Number(emp.costo_minuto) : 0;

    turno.fecha_fin = ahora;
    turno.minutos_trabajados = minutos;
    turno.costo_total_jornada = minutos * costoMinuto;

    localStorage.setItem(this.KEY_TURNOS, JSON.stringify(turnos));

    if (this.hasBridge) {
      try {
        const sql = `UPDATE mod_hr_turnos SET fecha_fin = ?, minutos_trabajados = ?, costo_total_jornada = ? WHERE id = ?;`;
        window.KoraDB.execute(sql, JSON.stringify([ahora, minutos, turno.costo_total_jornada, turno.id]));
      } catch (e) {}
    }
  }
}
