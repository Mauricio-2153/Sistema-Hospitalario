const { sql } = require('../config/database');

// Crear turno
const crearTurno = async (req, res) => {
    try {
        const { pacienteId, clinicaId, motivoConsulta, prioridad } = req.body;
        const usuarioEnfermeroId = req.usuario.id; // Viene del JWT

        // Validaciones
        if (!pacienteId || !clinicaId) {
            return res.status(400).json({
                success: false,
                message: 'PacienteID y ClinicaID son requeridos'
            });
        }

        // Generar número de turno
        const prefijoResult = await sql.query`
            SELECT LEFT(NombreClinica, 1) AS Prefijo
            FROM Clinicas
            WHERE ClinicaID = ${clinicaId}
        `;

        if (prefijoResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clínica no encontrada'
            });
        }

        const prefijo = prefijoResult.recordset[0].Prefijo;

        // Contar turnos del día en esa clínica
        const contadorResult = await sql.query`
            SELECT COUNT(*) AS Total
            FROM Turnos
            WHERE ClinicaID = ${clinicaId}
                AND CAST(FechaHoraRegistro AS DATE) = CAST(GETDATE() AS DATE)
        `;

        const numeroConsecutivo = contadorResult.recordset[0].Total + 1;
        const numeroTurno = prefijo + numeroConsecutivo.toString().padStart(3, '0');

        // Crear el turno
        const result = await sql.query`
            INSERT INTO Turnos (
                NumeroTurno, PacienteID, ClinicaID, UsuarioEnfermeroID, 
                Estado, Prioridad, MotivoConsulta
            )
            OUTPUT INSERTED.TurnoID
            VALUES (
                ${numeroTurno}, ${pacienteId}, ${clinicaId}, ${usuarioEnfermeroId},
                'En Espera', ${prioridad || 0}, ${motivoConsulta || null}
            )
        `;

        const turnoId = result.recordset[0].TurnoID;

        res.json({
            success: true,
            message: 'Turno creado exitosamente',
            turno: {
                turnoId: turnoId,
                numeroTurno: numeroTurno
            }
        });

    } catch (error) {
        console.error('Error al crear turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear turno'
        });
    }
};

// Obtener turnos por clínica
const obtenerTurnosPorClinica = async (req, res) => {
    try {
        const { clinicaId } = req.params;
        const { estado } = req.query; // Filtro opcional

        let query = `
            SELECT 
                t.TurnoID, t.NumeroTurno, t.Estado, t.MotivoConsulta,
                t.FechaHoraRegistro, t.Prioridad,
                p.NombreCompleto AS Paciente, p.DPI,
                c.NombreClinica
            FROM Turnos t
            INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
            INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
            WHERE t.ClinicaID = @clinicaId
                AND CAST(t.FechaHoraRegistro AS DATE) = CAST(GETDATE() AS DATE)
        `;

        if (estado) {
            query += ` AND t.Estado = @estado`;
        }

        query += ` ORDER BY t.Prioridad DESC, t.FechaHoraRegistro ASC`;

        const request = new sql.Request();
        request.input('clinicaId', sql.Int, clinicaId);
        if (estado) {
            request.input('estado', sql.NVarChar, estado);
        }

        const result = await request.query(query);

        res.json({
            success: true,
            turnos: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener turnos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener turnos'
        });
    }
};

// Llamar siguiente turno
const llamarTurno = async (req, res) => {
    try {
        const { turnoId } = req.params;
        const usuarioMedicoId = req.usuario.id;

        // Actualizar estado
        await sql.query`
            UPDATE Turnos
            SET Estado = 'Llamando',
                UsuarioMedicoID = ${usuarioMedicoId},
                FechaHoraLlamado = GETDATE()
            WHERE TurnoID = ${turnoId}
        `;

        res.json({
            success: true,
            message: 'Turno llamado exitosamente'
        });

    } catch (error) {
        console.error('Error al llamar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al llamar turno'
        });
    }
};

// Finalizar turno
const finalizarTurno = async (req, res) => {
    try {
        const { turnoId } = req.params;
        const { observaciones } = req.body;

        await sql.query`
            UPDATE Turnos
            SET Estado = 'Finalizado',
                FechaHoraFinalizado = GETDATE(),
                Observaciones = ${observaciones || null}
            WHERE TurnoID = ${turnoId}
        `;

        res.json({
            success: true,
            message: 'Turno finalizado exitosamente'
        });

    } catch (error) {
        console.error('Error al finalizar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al finalizar turno'
        });
    }
};

// Marcar ausente
const marcarAusente = async (req, res) => {
    try {
        const { turnoId } = req.params;

        await sql.query`
            UPDATE Turnos
            SET Estado = 'Ausente'
            WHERE TurnoID = ${turnoId}
        `;

        res.json({
            success: true,
            message: 'Turno marcado como ausente'
        });

    } catch (error) {
        console.error('Error al marcar ausente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar ausente'
        });
    }
};

// Obtener turnos para display público
const obtenerTurnosDisplay = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT TOP 10
                t.NumeroTurno, t.Estado,
                c.NombreClinica,
                CASE 
                    WHEN t.Estado = 'Llamando' THEN 1
                    WHEN t.Estado = 'En Espera' THEN 2
                    ELSE 3
                END AS Orden
            FROM Turnos t
            INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
            WHERE CAST(t.FechaHoraRegistro AS DATE) = CAST(GETDATE() AS DATE)
                AND t.Estado IN ('Llamando', 'En Espera')
            ORDER BY Orden, t.FechaHoraRegistro ASC
        `;

        res.json({
            success: true,
            turnos: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener turnos display:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener turnos'
        });
    }
};

module.exports = {
    crearTurno,
    obtenerTurnosPorClinica,
    llamarTurno,
    finalizarTurno,
    marcarAusente,
    obtenerTurnosDisplay
};

