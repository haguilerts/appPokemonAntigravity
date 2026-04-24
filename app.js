document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');

    // Verificar si el usuario ya inició sesión previamente
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'store.html';
    }

    // Alternar entre formularios
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('d-none');
        registerContainer.classList.remove('d-none');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('d-none');
        loginContainer.classList.remove('d-none');
    });

    // Lógica de Registro
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Recuperar usuarios existentes o inicializar arreglo vacío
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Verificar si el correo ya existe
        if (users.find(u => u.email === email)) {
            alert('El correo electrónico ya está registrado.');
            return;
        }

        // Agregar nuevo usuario
        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        registerForm.reset();
        
        // Mostrar formulario de login
        registerContainer.classList.add('d-none');
        loginContainer.classList.remove('d-none');
    });

    // Lógica de Inicio de Sesión
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Éxito al iniciar sesión
            localStorage.setItem('currentUser', JSON.stringify(user));
            loginForm.reset();
            window.location.href = 'store.html';
        } else {
            // Error
            alert('Correo o contraseña incorrectos.');
        }
    });

});
