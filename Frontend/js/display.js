const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    actualizarFechaHora();
    cargarTurnos();
    
    setInterval(cargarTurnos, 5000);
    setInterval(actualizarFechaHora, 1000);
});

function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = ahora.toLocaleDateString('es-ES', opciones);
    const hora = ahora.toLocaleTimeString('es-ES');
    
    document.getElementById('fecha').textContent = fecha;
    document.getElementById('hora').textContent = hora;
}

async function cargarTurnos() {
    try {
        const response = await fetch(`${API_URL}/turnos/display/publico`);
        const data = await response.json();
        
        if (data.success && data.turnos.length > 0) {
            const llamando = data.turnos.filter(t => t.Estado === 'Llamando');
            const enEspera = data.turnos.filter(t => t.Estado === 'En Espera');
            
            if (llamando.length > 0) {
                mostrarTurnoLlamando(llamando[0]);
            } else {
                limpiarTurnoLlamando();
            }
            
            mostrarProximosTurnos(enEspera.slice(0, 5));
        } else {
            limpiarTurnoLlamando();
            limpiarProximosTurnos();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarTurnoLlamando(turno) {
    const div = document.getElementById('turnoLlamando');
    div.className = 'turno-actual';
    div.innerHTML = `
        <div class="turno-numero-grande">${turno.NumeroTurno}</div>
        <div class="turno-clinica">📍 ${turno.NombreClinica}</div>
    `;
}

function limpiarTurnoLlamando() {
    const div = document.getElementById('turnoLlamando');
    div.className = 'sin-turno';
    div.innerHTML = '<p>En espera del siguiente turno...</p>';
}

function mostrarProximosTurnos(turnos) {
    const lista = document.getElementById('proximosTurnos');
    
    if (turnos.length === 0) {
        lista.innerHTML = '<p class="cargando">No hay turnos en espera</p>';
        return;
    }
    
    lista.innerHTML = turnos.map(turno => `
        <div class="proximo-item">
            <div class="proximo-numero">${turno.NumeroTurno}</div>
            <div class="proximo-info">
                <div class="proximo-clinica">📍 ${turno.NombreClinica}</div>
            </div>
        </div>
    `).join('');
}

function limpiarProximosTurnos() {
    document.getElementById('proximosTurnos').innerHTML = '<p class="cargando">No hay turnos programados</p>';
}
