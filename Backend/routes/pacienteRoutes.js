const express = require('express');
const router = express.Router();
const { registrarPaciente, obtenerPacientes, buscarPacientePorDPI } = require('../controllers/pacienteController');

router.post('/', registrarPaciente);
router.get('/', obtenerPacientes);
router.get('/dpi/:dpi', buscarPacientePorDPI);

module.exports = router;