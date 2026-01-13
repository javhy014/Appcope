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
              <i data-lucide="piggy-bank" className="w-8 h-8 text-white"></i>
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
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'usuarios', icon: 'users', label: 'Usuarios' },
    { id: 'ahorros', icon: 'piggy-bank', label: 'Ahorros' },
    { id: 'creditos', icon: 'credit-card', label: 'Créditos' },
    { id: 'calculadora', icon: 'calculator', label: 'Calculadora' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <i data-lucide={menuOpen ? 'x' : 'menu'} className="w-6 h-6"></i>
            </button>
            <div className="flex items-center gap-2">
              <i data-lucide="piggy-bank" className="w-8 h-8 text-indigo-600"></i>
              <h1 className="text-xl font-bold text-gray-800">CoopAhorro</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <i data-lucide="bell" className="w-6 h-6 text-gray-600"></i>
              {alertas.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {alertas.length}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800">{currentUser.username}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Cerrar sesión"
            >
              <i data-lucide="log-out" className="w-5 h-5 text-gray-600"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block fixed lg:sticky top-[57px] left-0 w-64 bg-white h-[calc(100vh-57px)] shadow-lg z-40`}>
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setMenuOpen(false);
                  setTimeout(() => lucide.createIcons(), 0);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i data-lucide={item.icon} className="w-5 h-5"></i>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Usuarios</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{usuarios.length}</p>
                    </div>
                    <i data-lucide="users" className="w-12 h-12 text-indigo-600 opacity-20"></i>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Ahorros</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">
                        ${ahorros.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <i data-lucide="trending-up" className="w-12 h-12 text-green-600 opacity-20"></i>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Créditos Activos</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{creditos.length}</p>
                    </div>
                    <i data-lucide="credit-card" className="w-12 h-12 text-blue-600 opacity-20"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i data-lucide="bell" className="w-5 h-5"></i>
                  Alertas de Vencimiento
                </h3>

                {alertas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i data-lucide="check-circle" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>No hay pagos próximos a vencer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alertas.map((alerta, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-4 rounded-lg ${
                          alerta.tipo === 'vencido'
                            ? 'bg-red-50 border border-red-200'
                            : alerta.tipo === 'urgente'
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <i data-lucide="alert-circle" className={`w-5 h-5 mt-0.5 ${
                          alerta.tipo === 'vencido'
                            ? 'text-red-600'
                            : alerta.tipo === 'urgente'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}></i>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{alerta.mensaje}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Fecha: {alerta.fecha} | Monto: ${alerta.monto}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'usuarios' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i data-lucide="user-plus" className="w-5 h-5"></i>
                  Registrar Nuevo Usuario
                </h3>

                <form onSubmit={registrarUsuario} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Cédula"
                    value={nuevoUsuario.cedula}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, cedula: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={nuevoUsuario.telefono}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={nuevoUsuario.direccion}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, direccion: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2"
                    required
                  />
                  <button
                    type="submit"
                    className="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700"
                  >
                    Registrar Usuario
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lista de Usuarios</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cédula</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usuarios.map(usuario => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{usuario.nombre}</td>
                          <td className="px-4 py-3 text-sm">{usuario.cedula}</td>
                          <td className="px-4 py-3 text-sm">{usuario.telefono}</td>
                          <td className="px-4 py-3 text-sm">{usuario.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usuarios.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No hay usuarios registrados</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === 'ahorros' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Ahorros</h2>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar Ahorro</h3>

                <form onSubmit={registrarAhorro} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={nuevoAhorro.usuarioId}
                    onChange={(e) => setNuevoAhorro({...nuevoAhorro, usuarioId: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    <option value="">Seleccionar Usuario</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto"
                    value={nuevoAhorro.monto}
                    onChange={(e) => setNuevoAhorro({...nuevoAhorro, monto: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <select
                    value={nuevoAhorro.tipo}
                    onChange={(e) => setNuevoAhorro({...nuevoAhorro, tipo: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="corriente">Cuenta Corriente</option>
                    <option value="plazo">Plazo Fijo</option>
                    <option value="programado">Ahorro Programado</option>
                  </select>
                  <button
                    type="submit"
                    className="md:col-span-3 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Registrar Ahorro
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Ahorros</h3>
                <div className="space-y-3">
                  {ahorros.map(ahorro => {
                    const usuario = usuarios.find(u => u.id === ahorro.usuarioId);
                    return (
                      <div key={ahorro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{usuario?.nombre || 'Usuario'}</p>
                          <p className="text-sm text-gray-600 capitalize">{ahorro.tipo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">${ahorro.monto}</p>
                          <p className="text-xs text-gray-500">{new Date(ahorro.fecha).toLocaleDateString()}</p>
                        </div>
                      </div>
                    );
                  })}
                  {ahorros.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No hay ahorros registrados</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === 'creditos' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Créditos</h2>

              <div className="bg-white rounded-xl shadow-sm