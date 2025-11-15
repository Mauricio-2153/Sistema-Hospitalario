const { sql } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ===== REGISTRO DE USUARIO =====
const registrarUsuario = async (req, res) => {
    try {
        const { nombreCompleto, usuario, contrasena, rol, clinicaId } = req.body;

        if (!nombreCompleto || !usuario || !contrasena || !rol) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }

        // Verificar si el usuario ya existe
        const existe = await sql.query`SELECT * FROM Usuarios WHERE Usuario = ${usuario}`;
        if (existe.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Usuario ya existe' });
        }

        // 🔐 Hashear la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Insertar usuario en la base de datos
        await sql.query`
            INSERT INTO Usuarios (NombreCompleto, Usuario, Contrasena, Rol, ClinicaID, Estado)
            VALUES (${nombreCompleto}, ${usuario}, ${hashedPassword}, ${rol}, ${clinicaId || null}, 1)
        `;

        res.json({ success: true, message: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// ===== LOGIN =====
const login = async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena) {
            return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
        }

        const result = await sql.query`
            SELECT UsuarioID, NombreCompleto, Usuario, Contrasena, Rol, ClinicaID, Estado
            FROM Usuarios
            WHERE Usuario = ${usuario}
        `;

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }

        const user = result.recordset[0];

        if (!user.Estado) {
            return res.status(401).json({ success: false, message: 'Usuario desactivado' });
        }

        // 🔐 Comparar contraseñas con bcrypt
        const passwordMatch = await bcrypt.compare(contrasena, user.Contrasena);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user.UsuarioID, usuario: user.Usuario, rol: user.Rol, clinicaId: user.ClinicaID },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            usuario: {
                id: user.UsuarioID,
                nombre: user.NombreCompleto,
                usuario: user.Usuario,
                rol: user.Rol,
                clinicaId: user.ClinicaID
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { registrarUsuario, login };


