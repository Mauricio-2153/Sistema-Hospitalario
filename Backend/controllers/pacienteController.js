const { sql } = require('../config/database');

// Registrar nuevo paciente
const registrarPaciente = async (req, res) => {
    try {
        const { nombreCompleto, dpi, fechaNacimiento, telefono, direccion } = req.body;

        // Validar datos obligatorios
        if (!nombreCompleto) {
            return res.status(400).json({
                success: false,
                message: 'El nombre completo es requerido'
            });
        }

        // Insertar paciente
        const result = await sql.query`
            INSERT INTO Pacientes (NombreCompleto, DPI, FechaNacimiento, Telefono, Direccion)
            OUTPUT INSERTED.PacienteID
            VALUES (${nombreCompleto}, ${dpi || null}, ${fechaNacimiento || null}, ${telefono || null}, ${direccion || null})
        `;

        const pacienteId = result.recordset[0].PacienteID;

        res.json({
            success: true,
            message: 'Paciente registrado exitosamente',
            pacienteId: pacienteId
        });

    } catch (error) {
        console.error('Error al registrar paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar paciente'
        });
    }
};

// Obtener todos los pacientes
const obtenerPacientes = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT PacienteID, NombreCompleto, DPI, Telefono, 
                   CONVERT(VARCHAR, FechaNacimiento, 103) AS FechaNacimiento,
                   Direccion
            FROM Pacientes
            ORDER BY FechaRegistro DESC
        `;

        res.json({
            success: true,
            pacientes: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pacientes'
        });
    }
};

// Buscar paciente por DPI
const buscarPacientePorDPI = async (req, res) => {
    try {
        const { dpi } = req.params;

        const result = await sql.query`
            SELECT PacienteID, NombreCompleto, DPI, Telefono,
                   CONVERT(VARCHAR, FechaNacimiento, 103) AS FechaNacimiento,
                   Direccion
            FROM Pacientes
            WHERE DPI = ${dpi}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        res.json({
            success: true,
            paciente: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al buscar paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar paciente'
        });
    }
};

module.exports = {
    registrarPaciente,
    obtenerPacientes,
    buscarPacientePorDPI
};