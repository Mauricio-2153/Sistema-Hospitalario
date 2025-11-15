const API_URL = 'http://localhost:3000/api';
let token = '';
let usuario = null;

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    token = localStorage.getItem('token');
    usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!token || !usuario) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('nombreUsuario').textContent = usuario.nombre;

    // Manejo según rol
    switch(usuario.rol) {
        case 'Enfermero':
            cargarClinicas();
            break;
        case 'Medico':
            cargarTurnosParaMedico();
            // Ocultar formulario de registro si es médico
            const formPaciente = document.getElementById('formPaciente');
            if(formPaciente) formPaciente.style.display = 'none';
            break;
        case 'Admin':
            cargarClinicas();
            cargarTodosTurnos();
            break;
        default:
            alert('Rol no autorizado.');
            cerrarSesion();
            break;
    }
});

// Cargar clínicas (para Enfermero y Admin)
async function cargarClinicas() {
    try {
        const clinicas = [
            { id: 1, nombre: 'Cardiología' },
            { id: 2, nombre: 'Pediatría' },
            { id: 3, nombre: 'Medicina General' },
            { id: 4, nombre: 'Traumatología' },
            { id: 5, nombre: 'Ginecología' }
        ];
        
        const select = document.getElementById('clinica');
        // Limpiar opciones previas
        select.innerHTML = '<option value="">Seleccione una clínica...</option>';
        clinicas.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar clínicas:', error);
    }
}

// Formulario de registro de paciente (solo Enfermero y Admin)
const form = document.getElementById('formPaciente');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if(usuario.rol === 'Medico') return;

        const nombreCompleto = document.getElementById('nombreCompleto').value;
        const dpi = document.getElementById('dpi').value;
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        const telefono = document.getElementById('telefono').value;
        const direccion = document.getElementById('direccion').value;
        const motivoConsulta = document.getElementById('motivoConsulta').value;
        const clinicaId = document.getElementById('clinica').value;
        const prioridad = document.getElementById('prioridad').value;
        const mensaje = document.getElementById('mensaje');
        
        try {
            // Registrar paciente
            const pacienteResponse = await fetch(`${API_URL}/pacientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombreCompleto,
                    dpi,
                    fechaNacimiento,
                    telefono,
                    direccion
                })
            });
            
            const pacienteData = await pacienteResponse.json();
            if (!pacienteData.success) throw new Error(pacienteData.message);

            // Crear turno
            const turnoResponse = await fetch(`${API_URL}/turnos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pacienteId: pacienteData.pacienteId,
                    clinicaId: parseInt(clinicaId),
                    motivoConsulta,
                    prioridad: parseInt(prioridad)
                })
            });
            
            const turnoData = await turnoResponse.json();
            if (turnoData.success) {
                mensaje.className = 'mensaje exito';
                mensaje.style.display = 'block';
                mensaje.innerHTML = `
                    <strong>✅ ¡Turno generado exitosamente!</strong><br>
                    Número de turno: <strong>${turnoData.turno.numeroTurno}</strong><br>
                    Paciente: ${nombreCompleto}
                `;
                form.reset();
                agregarTurnoALista(turnoData.turno.numeroTurno, nombreCompleto, clinicaId);
            } else {
                throw new Error(turnoData.message);
            }
        } catch (error) {
            mensaje.className = 'mensaje error';
            mensaje.style.display = 'block';
            mensaje.textContent = '❌ ' + error.message;
        }
    });
}

// Agregar turno a la lista visual
function agregarTurnoALista(numeroTurno, paciente, clinicaId) {
    const clinicas = ['', 'Cardiología', 'Pediatría', 'Medicina General', 'Traumatología', 'Ginecología'];
    const lista = document.getElementById('listaTurnos');
    
    const div = document.createElement('div');
    div.className = 'turno-item';
    div.innerHTML = `
        <div class="turno-numero">${numeroTurno}</div>
        <div class="turno-info">
            <div class="turno-paciente">${paciente}</div>
            <div class="turno-clinica">📍 ${clinicas[clinicaId]}</div>
        </div>
    `;
    
    lista.insertBefore(div, lista.firstChild);
}

// Cargar turnos para Médico
async function cargarTurnosParaMedico() {
    try {
        const response = await fetch(`${API_URL}/turnos/medico/${usuario.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if(data.turnos) {
            data.turnos.forEach(t => {
                agregarTurnoALista(t.numeroTurno, t.paciente, t.clinicaId);
            });
        }
    } catch (error) {
        console.error('Error al cargar turnos del médico:', error);
    }
}

// Cargar todos los turnos para Admin
async function cargarTodosTurnos() {
    try {
        const response = await fetch(`${API_URL}/turnos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if(data.turnos) {
            data.turnos.forEach(t => {
                agregarTurnoALista(t.numeroTurno, t.paciente, t.clinicaId);
            });
        }
    } catch (error) {
        console.error('Error al cargar todos los turnos:', error);
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}


