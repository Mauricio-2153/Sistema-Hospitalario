const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
connectDB();

// Rutas
const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const { verificarToken } = require('./middleware/auth');

// Rutas públicas
app.use('/api/auth', authRoutes);

// Ruta de turnos públicos (display) - sin autenticación
app.get('/api/turnos/display/publico', async (req, res) => {
    const { obtenerTurnosDisplay } = require('./controllers/turnoController');
    obtenerTurnosDisplay(req, res);
});

// Rutas protegidas
app.use('/api/pacientes', verificarToken, pacienteRoutes);
app.use('/api/turnos', verificarToken, turnoRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: '🏥 API del Sistema de Turnos Hospitalarios',
        status: 'Funcionando correctamente',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login'
            },
            pacientes: {
                registrar: 'POST /api/pacientes',
                listar: 'GET /api/pacientes',
                buscarPorDPI: 'GET /api/pacientes/dpi/:dpi'
            },
            turnos: {
                crear: 'POST /api/turnos',
                obtenerPorClinica: 'GET /api/turnos/clinica/:clinicaId',
                llamar: 'PUT /api/turnos/:turnoId/llamar',
                finalizar: 'PUT /api/turnos/:turnoId/finalizar',
                ausente: 'PUT /api/turnos/:turnoId/ausente',
                display: 'GET /api/turnos/display/publico'
            }
        }
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});


