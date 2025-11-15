const API_URL = 'http://localhost:3000/api';
let token = '';
let usuario = null;
let turnoActualId = null;


document.addEventListener('DOMContentLoaded', () => {
    token = localStorage.getItem('token');
    usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!token || !usuario) {
        window.location.href = 'login.html';
        return;
    }
    
    if (usuario.rol !== 'Medico') {
        alert('Acceso denegado. Esta página es solo para médicos.');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Usuario médico:', usuario); // DEBUG
    
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    cargarNombreClinica();
    cargarTurnos();
    
    // Actualizar cada 10 segundos
    setInterval(cargarTurnos, 10000);
});

function cargarNombreClinica() {
    const clinicas = ['', 'Cardiología', 'Pediatría', 'Medicina General', 'Traumatología', 'Ginecología'];
    if (usuario.clinicaId) {
        document.getElementById('clinicaNombre').textContent = clinicas[usuario.clinicaId];
    }
}

async function cargarTurnos() {
    try {
        console.log('Cargando turnos para clínica:', usuario.clinicaId); // DEBUG
        
        const response = await fetch(`${API_URL}/turnos/clinica/${usuario.clinicaId}?estado=En Espera`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status); // DEBUG
        
        const data = await response.json();
        console.log('Turnos recibidos:', data); // DEBUG
        
        if (data.success) {
            document.getElementById('turnosEspera').textContent = data.turnos.length;
            mostrarTurnos(data.turnos);
        } else {
            console.error('Error en respuesta:', data.message);
            document.getElementById('listaTurnos').innerHTML = '<p class="cargando">Error al cargar turnos: ' + data.message + '</p>';
        }
        
        // Cargar atendidos hoy
        const atendidosResponse = await fetch(`${API_URL}/turnos/clinica/${usuario.clinicaId}?estado=Finalizado`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const atendidosData = await atendidosResponse.json();
        if (atendidosData.success) {
            document.getElementById('turnosAtendidos').textContent = atendidosData.turnos.length;
        }
        
    } catch (error) {
        console.error('Error al cargar turnos:', error);
        document.getElementById('listaTurnos').innerHTML = '<p class="cargando">Error de conexión: ' + error.message + '</p>';
    }
}

function mostrarTurnos(turnos) {
    const lista = document.getElementById('listaTurnos');
    
    console.log('Mostrando turnos:', turnos.length); // DEBUG
    
    if (turnos.length === 0) {
        lista.innerHTML = '<p class="cargando">No hay pacientes en espera</p>';
        return;
    }
    
    lista.innerHTML = turnos.map(turno => `
        <div class="turno-item">
            <div class="turno-item-info">
                <div class="turno-item-numero">${turno.NumeroTurno}</div>
                <div class="turno-item-paciente">${turno.Paciente}</div>
                <div class="turno-item-motivo">📋 ${turno.MotivoConsulta || 'Sin motivo especificado'}</div>
            </div>
            <button class="btn-llamar" onclick="llamarTurno(${turno.TurnoID}, '${turno.NumeroTurno}', '${turno.Paciente}', '${turno.MotivoConsulta || ''}')">
                📞 Llamar
            </button>
        </div>
    `).join('');
}

async function llamarTurno(turnoId, numeroTurno, paciente, motivo) {
    try {
        const response = await fetch(`${API_URL}/turnos/${turnoId}/llamar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            turnoActualId = turnoId;
            mostrarTurnoActual(numeroTurno, paciente, motivo);
            cargarTurnos();
        } else {
            alert('Error al llamar turno: ' + data.message);
        }
        
    } catch (error) {
        alert('Error de conexión: ' + error.message);
    }
}

function mostrarTurnoActual(numeroTurno, paciente, motivo) {
    const content = document.getElementById('turnoActualContent');
    content.className = '';
    content.innerHTML = `
        <div class="turno-info">
            <div class="turno-numero">${numeroTurno}</div>
            <div class="paciente-nombre">${paciente}</div>
            <div class="paciente-detalle">📋 ${motivo || 'Sin motivo especificado'}</div>
        </div>
        <div class="acciones">
            <button class="btn btn-finalizar" onclick="finalizarTurno()">
                ✅ Finalizar Consulta
            </button>
            <button class="btn btn-ausente" onclick="marcarAusente()">
                ❌ Marcar Ausente
            </button>
        </div>
    `;
}

async function finalizarTurno() {
    if (!turnoActualId) return;
    
    const observaciones = prompt('Observaciones (opcional):');
    
    try {
        const response = await fetch(`${API_URL}/turnos/${turnoActualId}/finalizar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ observaciones })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Consulta finalizada');
            limpiarTurnoActual();
            cargarTurnos();
        }
        
    } catch (error) {
        alert('Error de conexión: ' + error.message);
    }
}

async function marcarAusente() {
    if (!turnoActualId) return;
    
    if (!confirm('¿Confirmas que el paciente no se presentó?')) return;
    
    try {
        const response = await fetch(`${API_URL}/turnos/${turnoActualId}/ausente`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Paciente marcado como ausente');
            limpiarTurnoActual();
            cargarTurnos();
        }
        
    } catch (error) {
        alert('Error de conexión: ' + error.message);
    }
}

function limpiarTurnoActual() {
    turnoActualId = null;
    const content = document.getElementById('turnoActualContent');
    content.className = 'sin-turno';
    content.innerHTML = `
        <p>No hay turno en atención</p>
        <small>Llama al siguiente paciente para comenzar</small>
    `;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}


