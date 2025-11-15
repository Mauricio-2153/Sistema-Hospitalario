const API_URL = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const mensaje = document.getElementById('mensaje');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, contrasena })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar token y usuario en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            mensaje.className = 'mensaje exito';
            mensaje.style.display = 'block';
            mensaje.textContent = '✅ Login exitoso! Redirigiendo...';
            
            // Redirigir según el rol
            setTimeout(() => {
                if (data.usuario.rol === 'Enfermero') {
                    window.location.href = 'preclasificacion.html';
                } else if (data.usuario.rol === 'Medico') {
                    window.location.href = 'medico.html';
                } else if (data.usuario.rol === 'Admin') {
                    window.location.href = 'admin.html';
                }
            }, 1500);
            
        } else {
            mensaje.className = 'mensaje error';
            mensaje.style.display = 'block';
            mensaje.textContent = '❌ ' + data.message;
        }
        
    } catch (error) {
        mensaje.className = 'mensaje error';
        mensaje.style.display = 'block';
        mensaje.textContent = '❌ Error de conexión. Verifica que el servidor esté corriendo.';
    }
});


