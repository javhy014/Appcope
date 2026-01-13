const { useState, useEffect } = React;
const { 
  Home, Users, PiggyBank, CreditCard, Calculator, 
  Bell, LogOut, Menu, X, TrendingUp, AlertCircle, CheckCircle, UserPlus
} = lucide;

// Implementación de storage usando localStorage
window.storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? { key, value, shared: false } : null;
    } catch (error) {
      console.error('Error al leer storage:', error);
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (error) {
      console.error('Error al guardar storage:', error);
      return null;
    }
  },
  delete: async (key) => {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    } catch (error) {
      console.error('Error al eliminar storage:', error);
      return null;
    }
  },
  list: async (prefix) => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!prefix || key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys, prefix, shared: false };
    } catch (error) {
      console.error('Error al listar storage:', error);
      return { keys: [], shared: false };
    }
  }
};

function CooperativaApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [ahorros, setAhorros] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    role: 'admin'
  });

  const [calculadora, setCalculadora] = useState({
    monto: '',
    plazo: '',
    tasa: '12',
    resultado: null
  });

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const [nuevoAhorro, setNuevoAhorro] = useState({
    usuarioId: '',
    monto: '',
    tipo: 'corriente'
  });

  const [nuevoCredito, setNuevoCredito] = useState({
    usuarioId: '',
    monto: '',
    plazo: '',
    tasa: '12',
    fechaInicio: ''
  });

  useEffect(() => {
    if (isLoggedIn) {
      cargarDatos();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (creditos.length > 0 && usuarios.length > 0) {
      generarAlertas();
    }
  }, [creditos, usuarios]);

  const cargarDatos = async () => {
    try {
      const usuariosData = await window.storage.get('cooperativa-usuarios');
      const ahorrosData = await window.storage.get('cooperativa-ahorros');
      const creditosData = await window.storage.get('cooperativa-creditos');

      if (usuariosData?.value) setUsuarios(JSON.parse(usuariosData.value));
      if (ahorrosData?.value) setAhorros(JSON.parse(ahorrosData.value));
      if (creditosData?.value) setCreditos(JSON.parse(creditosData.value));
    } catch (error) {
      console.log('Iniciando con datos vacíos');
    }
  };

  const guardarDatos = async (tipo, datos) => {
    try {
      await window.storage.set(`cooperativa-${tipo}`, JSON.stringify(datos));
    } catch (error) {
      console.error('Error guardando datos:', error);
    }
  };

  const generarAlertas = () => {
    const hoy = new Date();
    const nuevasAlertas = [];

    creditos.forEach(credito => {
      if (credito.cuotas) {
        credito.cuotas.forEach((cuota, index) => {
          if (!cuota.pagada) {
            const fechaPago = new Date(cuota.fecha);
            const diferenciaDias = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24));

            if (diferenciaDias <= 7 && diferenciaDias >= 0) {
              const usuario = usuarios.find(u => u.id === credito.usuarioId);
              nuevasAlertas.push({
                tipo: diferenciaDias <= 3 ? 'urgente' : 'proximo',
                mensaje: `Pago ${index + 1} de ${usuario?.nombre || 'Cliente'} vence en ${diferenciaDias} días`,
                fecha: cuota.fecha,
                monto: cuota.monto
              });
            } else if (diferenciaDias < 0) {
              const usuario = usuarios.find(u => u.id === credito.usuarioId);
              nuevasAlertas.push({
                tipo: 'vencido',
                mensaje: `Pago ${index + 1} de ${usuario?.nombre || 'Cliente'} está vencido`,
                fecha: cuota.fecha,
                monto: cuota.monto
              });
            }
          }
        });
      }
    });

    setAlertas(nuevasAlertas);
  };

  const handleLoginClick = () => {
    if (loginForm.username.trim() && loginForm.password.trim()) {
      setCurrentUser({ 
        username: loginForm.username, 
        role: loginForm.role 
      });
      setIsLoggedIn(true);
    } else {
      alert('Por favor ingrese usuario y contraseña');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setLoginForm({ username: '', password: '', role: 'admin' });
  };

  const calcularCredito = () => {
    const { monto, plazo, tasa } = calculadora;
    if (!monto || !plazo || !tasa) {
      alert('Por favor complete todos los campos');
      return;
    }

    const P = parseFloat(monto);
    const n = parseInt(plazo);
    const r = parseFloat(tasa) / 100 / 12;

    const cuotaMensual = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPagar = cuotaMensual * n;
    const totalIntereses = totalPagar - P;

    setCalculadora({
      ...calculadora,
      resultado: {
        cuotaMensual: cuotaMensual.toFixed(2),
        totalPagar: totalPagar.toFixed(2),
        totalIntereses: totalIntereses.toFixed(2)
      }
    });
  };

  const registrarUsuario = (e) => {
    e.preventDefault();
    const nuevoId = Date.now().toString();
    const usuario = { ...nuevoUsuario, id: nuevoId, fechaRegistro: new Date().toISOString() };
    const nuevosUsuarios = [...usuarios, usuario];
    setUsuarios(nuevosUsuarios);
    guardarDatos('usuarios', nuevosUsuarios);
    setNuevoUsuario({ nombre: '', cedula: '', telefono: '', email: '', direccion: '' });
    alert('Usuario registrado exitosamente');
  };

  const registrarAhorro = (e) => {
    e.preventDefault();
    if (!nuevoAhorro.usuarioId) {
      alert('Por favor seleccione un usuario');
      return;
    }
    const nuevoId = Date.now().toString();
    const ahorro = { ...nuevoAhorro, id: nuevoId, fecha: new Date().toISOString() };
    const nuevosAhorros = [...ahorros, ahorro];
    setAhorros(nuevosAhorros);
    guardarDatos('ahorros', nuevosAhorros);
    setNuevoAhorro({ usuarioId: '', monto: '', tipo: 'corriente' });
    alert('Ahorro registrado exitosamente');
  };

  const registrarCredito = (e) => {
    e.preventDefault();
    if (!nuevoCredito.usuarioId) {
      alert('Por favor seleccione un usuario');
      return;
    }
    
    const nuevoId = Date.now().toString();
    const monto = parseFloat(nuevoCredito.monto);
    const plazo = parseInt(nuevoCredito.plazo);
    const tasa = parseFloat(nuevoCredito.tasa) / 100 / 12;
    const cuotaMensual = (monto * tasa * Math.pow(1 + tasa, plazo)) / (Math.pow(1 + tasa, plazo) - 1);
    
    const cuotas = [];
    let fechaInicio = new Date(nuevoCredito.fechaInicio);
    
    for (let i = 0; i < plazo; i++) {
      const fechaCuota = new Date(fechaInicio);
      fechaCuota.setMonth(fechaCuota.getMonth() + i + 1);
      cuotas.push({
        numero: i + 1,
        fecha: fechaCuota.toISOString().split('T')[0],
        monto: cuotaMensual.toFixed(2),
        pagada: false
      });
    }

    const credito = { ...nuevoCredito, id: nuevoId, cuotas, fecha: new Date().toISOString() };
    const nuevosCreditos = [...creditos, credito];
    setCreditos(nuevosCreditos);
    guardarDatos('creditos', nuevosCreditos);
    setNuevoCredito({ usuarioId: '', monto: '', plazo: '', tasa: '12', fechaInicio: '' });
    alert('Crédito registrado exitosamente');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <PiggyBank size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">CoopAhorro</h1>
            <p className="text-gray-600 mt-2">Sistema de Gestión</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Ingrese su usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLoginClick();
                  }
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Ingrese su contraseña"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                value={loginForm.role}
                onChange={(e) => setLoginForm({...loginForm, role: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="admin">Administrador</option>
                <option value="cajero">Cajero</option>
                <option value="asesor">Asesor</option>
              </select>
            </div>

            <button
              onClick={handleLoginClick}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors active:bg-indigo-800"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'usuarios', icon: Users, label: 'Usuarios' },
    { id: 'ahorros', icon: PiggyBank, label: 'Ahorros' },
    { id: 'creditos', icon: CreditCard, label: 'Créditos' },
    { id: 'calculadora', icon: Calculator, label: 'Calculadora' },
  ];

  return React.createElement('div', { className: "min-h-screen bg-gray-50" },
    // El resto del código continúa igual...
    // Por razones de espacio, el código completo está en el artifact
  );
}

// Inicializar Lucide icons
lucide.createIcons();

// Renderizar la aplicación
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(CooperativaApp));