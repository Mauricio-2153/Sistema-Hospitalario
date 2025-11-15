const express = require('express');
const router = express.Router();
const {
    crearTurno,
    obtenerTurnosPorClinica,
    llamarTurno,
    finalizarTurno,
    marcarAusente,
    obtenerTurnosDisplay
} = require('../controllers/turnoController');

router.post('/', crearTurno);
router.get('/clinica/:clinicaId', obtenerTurnosPorClinica);
router.put('/:turnoId/llamar', llamarTurno);
router.put('/:turnoId/finalizar', finalizarTurno);
router.put('/:turnoId/ausente', marcarAusente);

module.exports = router;

