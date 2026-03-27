import { useState, useEffect } from "react";
import type { ItemCarrito, Repuesto } from "./types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

function App() {
  const COLORES = ["#facc15", "#1e293b", "#3b82f6", "#ef4444", "#22c55e"];

  // --- 1. ESTADOS ---
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  // puede ser un string para tener varias pantqallas :"inventario","carrito","ventas"
  const [pantallaActual, setPantallaActual] = useState("inventario");
  const [historial, setHistorial] = useState([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [datosGrafico, setDatosGrafico] = useState([]);

  const [dataVentas, setDataVentas] = useState([]);
  const [dataMarcas, setDataMarcas] = useState([]);
  const [dataStock, setDataStock] = useState([]);
  const [dataTop, setDataTop] = useState([]);
  const [dataComparativa, setDataComparativa] = useState([]);

  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [dataProveedores, setDataProveedores] = useState([]);
  const [dataHoras, setDataHoras] = useState([]);

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const API_URL = "https://api-repuestos-jn.onrender.com";

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Limpiamos errores anteriores

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: usuario, password: password }),
      });

      if (!response.ok) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const data = await response.json();

      // ✅ GUARDAMOS EL SELLO (TOKEN)
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const eliminarDelCarrito = (id: number) => {
    // usamos .filter para dejar afuera el id que queremos borrar
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  //funcion que habla con el endpoint que cree en python
  const obtenerHistorial = async () => {
    try {
      // Si hay una fecha elegida, la agregamos a la URL como "query parameter"
      const url = filtroFecha
        ? `${API_URL}/historial?fecha=${filtroFecha}`
        : `${API_URL}/historial`;

      const res = await fetch(url);
      const data = await res.json();
      setHistorial(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Estadísticas y gráficos
  // 📊 Único Efecto para cargar todas las estadísticas al entrar a la pantalla
  useEffect(() => {
    if (pantallaActual === "estadisticas") {
      // 1. Ventas Semanales
      fetch(`${API_URL}/stats/ventas-semanales`)
        .then((r) => r.json())
        .then(setDataVentas);

      // 2. Marcas
      fetch(`${API_URL}/stats/marcas`)
        .then((r) => r.json())
        .then(setDataMarcas);

      // 3. Stock Alto
      fetch(`${API_URL}/stats/stock-alto`)
        .then((r) => r.json())
        .then(setDataStock);

      // 4. Ticket Promedio
      fetch(`${API_URL}/stats/ticket-promedio`)
        .then((r) => r.json())
        .then((data) => setTicketPromedio(data.valor));

      // 5. Proveedores
      fetch(`${API_URL}/stats/proveedores-top`)
        .then((r) => r.json())
        .then(setDataProveedores);

      // 6. Horas Pico
      fetch(`${API_URL}/stats/horas-pico`)
        .then((r) => r.json())
        .then(setDataHoras);

      // 7. Top Vendidos
      fetch(`${API_URL}/stats/top-vendidos`)
        .then((r) => r.json())
        .then(setDataTop);

      // 8. Comparativa Mensual
      fetch(`${API_URL}/stats/comparativa-mensual`)
        .then((r) => r.json())
        .then(setDataComparativa);
    }
  }, [pantallaActual]);

  // Agregamos filtroFecha a las dependencias del useEffect para que recargue al cambiar la fecha
  useEffect(() => {
    if (pantallaActual === "historial") {
      obtenerHistorial();
    }
  }, [pantallaActual, filtroFecha]);

  //funcion para restar 1 o eliminar si llega a 0
  const restarCantidad = (id: number) => {
    setCarrito((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.cantidad > 1) {
        return prev.map((i) =>
          i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i,
        );
      }
      return prev.filter((i) => i.id !== id);
    });
  };
  const [nuevoRepuesto, setNuevoRepuesto] = useState({
    nombre: "",
    codigo_barra: "",
    precio: 0,
    marca: "", // Agregamos marca que faltaba
    stock: 0,
    proveedor: "",
  });

  // --- 2. CARGA DE DATOS ---
  useEffect(() => {
    fetch(`${API_URL}/repuestos`)
      .then((res) => res.json())
      .then((data) => setRepuestos(data));
  }, []);

  // --- 3. FUNCIONES DE LÓGICA ---
  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value } = e.target;
    setNuevoRepuesto({
      ...nuevoRepuesto,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  // funcion para agregar al carrito
  const agregarAlCarrito = (producto: Repuesto) => {
    setCarrito((prev) => {
      // buscamos si el producto ya esta en el carrito usando .find()
      const existe = prev.find((item) => item.id === producto.id);
      const cantidadActual = existe ? existe.cantidad : 0;

      if (cantidadActual + 1 > producto.stock) {
        alert(
          `❌ Stock máximo disponible alcanzado: solo hay ${producto.stock} unidades de ${producto.nombre}`,
        );
        return prev;
      }

      if (existe) {
        // si existe, creamos un nuevo array donde ese item le sumemos 1
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      } else {
        // si es nuevo, lo agregamos a la lista con cantidad 1
        return [
          ...prev,
          {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
          },
        ];
      }
    });
  };

  const guardarRepuesto = async (e: React.FormEvent) => {
    e.preventDefault();

    // Decidimos la URL y el método según si estamos editando o no
    const url = editandoId ? `/repuestos/${editandoId}` : `/repuestos`;
    const metodo = editandoId ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoRepuesto),
      });

      if (response.ok) {
        alert(
          editandoId
            ? "✅ Repuesto actualizado con éxito"
            : "✅ Nuevo repuesto guardado",
        );
        setEditandoId(null); // Limpiamos el modo edición
        setNuevoRepuesto({
          nombre: "",
          codigo_barra: "",
          precio: 0,
          marca: "",
          stock: 0,
          proveedor: "",
        });

        // Recargamos los datos para ver el nuevo producto
        const res = await fetch(`${API_URL}/repuestos`);
        const data = await res.json();
        setRepuestos(data);
      } else {
        const errorData = await response.json();
        alert("❌ Error: " + (errorData.detail || "No se pudo guardar"));
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("❌ Error de conexión con el servidor");
    }
  };

  // --- 4. FILTRO ---
  const productosFiltrados = repuestos.filter(
    (r) =>
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(r.codigo_barra).includes(busqueda) ||
      r.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.proveedor?.toLowerCase().includes(busqueda.toLowerCase()),
  );
  const enviarVentaAlBackend = async () => {
    if (carrito.length === 0) return;

    try {
      const response = await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carrito),
      });

      if (response.ok) {
        alert("✅ Venta realizada con éxito!");
        setCarrito([]);
        setPantallaActual("inventario");
        // Recargamos los repuestos para ver el stock actualizado
        const res = await fetch(`${API_URL}/repuestos`);
        const data = await res.json();
        setRepuestos(data);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.detail}`);
      }
    } catch (error) {
      alert("❌ Error de conexión con el servidor");
    }
  };

  // --- 5. RENDERIZADO ---
  return (
    <div className="p-6 bg-slate-900 min-h-screen font-sans text-slate-900">
      {!token ? (
        /* 🚪 PANTALLA DE LOGIN */
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-md border-t-[10px] border-yellow-400 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10">
              <div className="inline-block bg-slate-900 text-yellow-400 p-4 rounded-2xl rotate-3 mb-4 shadow-xl font-black text-4xl italic">
                J·N
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
                Acceso <span className="text-blue-600">Privado</span>
              </h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                Gestión de Repuestos J·N
              </p>
            </div>

            <form onSubmit={manejarLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Usuario Administrador
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-bold"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Nombre de usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Contraseña de Seguridad
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs font-black p-4 rounded-xl border-l-4 border-red-500 animate-bounce">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-700 hover:shadow-[0_10px_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 text-sm uppercase tracking-widest"
              >
                Entrar al Local
              </button>
            </form>

            <p className="text-center mt-8 text-[9px] text-slate-300 font-bold uppercase tracking-widest">
              Mendiolaza · Córdoba · Argentina
            </p>
          </div>
        </div>
      ) : (
        /* ✅ SISTEMA COMPLETO (Si hay token) */
        <div className="p-4 md:p-8 animate-in fade-in duration-700">
          <button
            onClick={cerrarSesion}
            className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold transition-all border border-white/20"
          >
            CERRAR SESIÓN 🚪
          </button>

          <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-slate-700 pb-8">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-400 text-slate-900 p-3 rounded-xl rotate-2 shadow-[0_0_20px_rgba(250,204,21,0.3)] font-black text-3xl italic">
                  J·N
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                    Repuestos{" "}
                    <span className="text-yellow-400">del Automotor</span>
                  </h1>
                  <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                    Panel de Control General
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block border-l border-slate-700 pl-6">
                <p className="text-sm font-bold text-yellow-400">
                  Sucursal La Coordillera
                </p>
              </div>
            </header>

            {/* NAVEGACIÓN */}
            <nav className="flex gap-4 mb-8">
              <button
                onClick={() => setPantallaActual("inventario")}
                className={`px-4 py-2 rounded-lg font-bold ${pantallaActual === "inventario" ? "bg-white shadow" : "bg-slate-800 text-white"}`}
              >
                📦 Inventario
              </button>
              <button
                onClick={() => setPantallaActual("historial")}
                className={`px-4 py-2 rounded-lg font-bold ${pantallaActual === "historial" ? "bg-white shadow" : "bg-slate-800 text-white"}`}
              >
                📜 Historial de Ventas
              </button>
              <button
                onClick={() => setPantallaActual("estadisticas")}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  pantallaActual === "estadisticas"
                    ? "bg-yellow-400 text-slate-900 shadow-lg"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                📊 Gráficos y Resumen
              </button>
            </nav>

            {/* PANTALLA: ESTADÍSTICAS */}
            {pantallaActual === "estadisticas" && (
              <div className="space-y-8 pb-10 animate-in fade-in duration-500">
                {/* --- FILA 1: EL CORAZÓN DEL NEGOCIO (FINANZAS) --- */}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* 1. Comparativa Mensual (Grande) */}

                  <div className="lg:col-span-3 bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-black uppercase tracking-tighter text-lg italic">
                        📈 Crecimiento Mes a Mes
                      </h3>

                      <span className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1 rounded-full uppercase">
                        Balance
                      </span>
                    </div>

                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataComparativa}>
                          <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={12}
                            axisLine={false}
                            tickLine={false}
                          />

                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",

                              borderRadius: "12px",

                              border: "none",

                              boxShadow: "0 10px 15px rgba(0,0,0,0.2)",
                            }}
                            itemStyle={{ color: "#1e293b" }}
                          />

                          <Bar
                            dataKey="total"
                            radius={[10, 10, 0, 0]}
                            barSize={80}
                          >
                            {dataComparativa.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? "#6366f1" : "#22c55e"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 2. Ticket Promedio (Tarjeta Neón) */}

                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-3xl shadow-[0_0_40px_rgba(250,204,21,0.15)] flex flex-col justify-center items-center text-slate-900 border-b-8 border-orange-600">
                    <span className="text-5xl mb-4">💰</span>

                    <h4 className="font-black uppercase text-xs mb-1 opacity-70">
                      Ticket Promedio
                    </h4>

                    <p className="text-5xl font-black tracking-tighter">
                      ${ticketPromedio.toLocaleString("es-AR")}
                    </p>

                    <div className="mt-6 bg-black/10 px-4 py-2 rounded-full text-[10px] font-bold">
                      FACTURACIÓN x CLIENTE
                    </div>
                  </div>
                </div>

                {/* --- FILA 2: COMPORTAMIENTO Y VENTAS (MEDIANOS) --- */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 3. Ventas Semanales (Línea Neón) */}

                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <h3 className="text-slate-800 font-black mb-4 uppercase text-xs italic">
                      Ventas de la Semana
                    </h3>

                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataVentas}>
                          <XAxis
                            dataKey="name"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                          />

                          <Tooltip />

                          <Line
                            type="monotone"
                            dataKey="ventas"
                            stroke="#3b82f6"
                            strokeWidth={4}
                            dot={{ r: 6, fill: "#3b82f6" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 4. Horas Pico (Área Violeta) */}

                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <h3 className="text-slate-800 font-black mb-4 uppercase text-xs italic">
                      Flujo por Hora
                    </h3>

                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataHoras}>
                          <defs>
                            <linearGradient
                              id="colorV"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#8b5cf6"
                                stopOpacity={0.3}
                              />

                              <stop
                                offset="95%"
                                stopColor="#8b5cf6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <XAxis
                            dataKey="hora"
                            fontSize={10}
                            axisLine={false}
                          />

                          <Tooltip />

                          <Area
                            type="monotone"
                            dataKey="ventas"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#colorV)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 5. Distribución por Marcas (Torta) */}

                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <h3 className="text-slate-800 font-black mb-4 uppercase text-xs italic">
                      Dominio de Marcas
                    </h3>

                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataMarcas}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label
                          >
                            {dataMarcas.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  ["#facc15", "#1e293b", "#3b82f6", "#ef4444"][
                                    index % 4
                                  ]
                                }
                              />
                            ))}
                          </Pie>

                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* --- FILA 3: STOCK Y LOGÍSTICA (INFERIOR) --- */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 6. Top 5 Más Vendidos (Frecuencia) */}

                  <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-xl">
                    <h3 className="text-slate-800 font-black mb-4 uppercase text-xs italic">
                      🔥 Los más pedidos
                    </h3>

                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataTop} layout="vertical">
                          <XAxis type="number" hide />

                          <YAxis
                            dataKey="name"
                            type="category"
                            width={90}
                            fontSize={10}
                            axisLine={false}
                          />

                          <Tooltip />

                          <Bar
                            dataKey="ventas"
                            fill="#ec4899"
                            radius={[0, 10, 10, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 7. Productos con Mucho Stock */}

                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <h3 className="text-slate-800 font-black mb-4 uppercase text-xs italic">
                      📦 Mercadería Inmóvil
                    </h3>

                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataStock}>
                          <XAxis dataKey="name" fontSize={8} tick={false} />

                          <Tooltip />

                          <Bar
                            dataKey="cantidad"
                            fill="#94a3b8"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 8. Ranking de Proveedores */}

                  <div className="bg-slate-800 p-6 rounded-3xl shadow-xl text-white">
                    <h3 className="text-yellow-400 font-black mb-4 uppercase text-xs italic">
                      🤝 Mis Proveedores
                    </h3>

                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProveedores}>
                          <XAxis dataKey="name" fontSize={9} stroke="#fff" />

                          <Tooltip contentStyle={{ color: "#000" }} />

                          <Bar
                            dataKey="cantidad"
                            fill="#facc15"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PANTALLA: INVENTARIO */}
            {pantallaActual === "inventario" && (
              <SeccionInventario
                repuestos={productosFiltrados}
                alAgregar={agregarAlCarrito}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                nuevoRepuesto={nuevoRepuesto}
                manejarCambio={manejarCambio}
                guardarRepuesto={guardarRepuesto}
                setNuevoRepuesto={setNuevoRepuesto}
                setEditandoId={setEditandoId}
                editandoId={editandoId}
              />
            )}

            {/* PANTALLA: CARRITO */}
            {pantallaActual === "carrito" && (
              <SeccionCarrito
                carrito={carrito}
                alFinalizar={enviarVentaAlBackend}
                volver={() => setPantallaActual("inventario")}
                alRestar={restarCantidad}
                alAgregar={agregarAlCarrito}
                alEliminar={eliminarDelCarrito}
                repuestos={repuestos}
              />
            )}

            {/* PANTALLA: HISTORIAL */}
            {pantallaActual === "historial" && (
              <>
                <SeccionHistorial
                  ventas={historial}
                  volver={() => setPantallaActual("inventario")}
                  alSeleccionar={setVentaSeleccionada}
                  filtroFecha={filtroFecha}
                  setFiltroFecha={setFiltroFecha}
                />
                <ModalDetalleVenta
                  venta={ventaSeleccionada}
                  cerrar={() => setVentaSeleccionada(null)}
                />
              </>
            )}
          </div>

          {/* BOTÓN FLOTANTE CARRITO */}
          {carrito.length > 0 && pantallaActual === "inventario" && (
            <div className="fixed bottom-8 right-8 z-[9999]">
              <div className="relative">
                <button
                  onClick={() => setPantallaActual("carrito")}
                  className="bg-blue-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center w-16 h-16"
                >
                  <span className="text-2xl">🛒</span>
                </button>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">
                  {carrito.reduce((acc, item) => acc + item.cantidad, 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

// Recibe los repuestos para listarlos y la función para agregar al carrito
function SeccionInventario({
  repuestos,
  alAgregar,
  busqueda,
  setBusqueda,
  nuevoRepuesto,
  manejarCambio,
  guardarRepuesto,
  setNuevoRepuesto,
  setEditandoId,
  editandoId,
}) {
  const productosCriticos = repuestos.filter((r) => r.stock < 3).length;
  const valorTotalInventario = repuestos.reduce(
    (acc, r) => acc + r.precio * r.stock,
    0,
  );
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase font-bold">
            Total Productos
          </p>
          <p className="text-3xl font-black">{repuestos.length}</p>
        </div>

        <div
          className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${productosCriticos > 0 ? "border-red-500 animate-pulse" : "border-green-500"}`}
        >
          <p className="text-sm text-gray-500 uppercase font-bold">
            Stock Crítico (Menos de 3)
          </p>
          <p className="text-3xl font-black text-red-600">
            {productosCriticos}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500 uppercase font-bold">
            Valor del Inventario
          </p>
          <p className="text-3xl font-black text-green-700">
            ${valorTotalInventario.toLocaleString()}
          </p>
        </div>
      </div>
      {/* FORMULARIO DE ALTA */}
      <form
        onSubmit={guardarRepuesto}
        className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-7 gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 text-slate-400">
            Nombre
          </label>
          <input
            name="nombre"
            value={nuevoRepuesto.nombre}
            onChange={manejarCambio}
            className="w-full p-2 border rounded mt-1 bg-slate-50"
            required
            placeholder="Rubén Martinez"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 text-slate-400">
            Código
          </label>
          <input
            name="codigo_barra"
            value={nuevoRepuesto.codigo_barra}
            onChange={manejarCambio}
            className="w-full p-2 border rounded mt-1 bg-slate-50"
            required
            placeholder="#AK438C"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 text-slate-400">
            Marca
          </label>
          <input
            name="marca"
            value={nuevoRepuesto.marca}
            onChange={manejarCambio}
            className="w-full p-2 border rounded mt-1 bg-slate-50"
            required
            placeholder="Renault/Fiat/Chevrolet"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 text-slate-400">
            Proveedor
          </label>
          <input
            name="proveedor"
            value={nuevoRepuesto.proveedor || ""}
            onChange={manejarCambio}
            className="w-full p-2 border rounded mt-1 bg-slate-50"
            placeholder="Ej: Repuestos Zazzi"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 text-slate-400">
            Precio
          </label>
          <input
            name="precio"
            type="number"
            value={nuevoRepuesto.precio}
            onChange={manejarCambio}
            className="w-full p-2 border rounded mt-1 bg-slate-50"
            placeholder="$10.000"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock Inicial
          </label>
          <input
            name="stock"
            type="number"
            value={nuevoRepuesto.stock}
            onChange={manejarCambio}
            className="w-full p-2 border rounded mt-1 bg-slate-50"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-yellow-400 text-slate-900 p-2 rounded-lg font-black uppercase tracking-tighter hover:bg-yellow-500 transition shadow-lg h-[42px] flex items-center justify-center text-xs"
        >
          {editandoId ? "✅ Guardar Cambios" : "+ Agregar Nuevo Repuesto"}
        </button>
        {editandoId && (
          <button
            type="button" // IMPORTANTE: tipo 'button' para que NO haga submit al form
            onClick={() => {
              setEditandoId(null); // Salimos del modo edición
              // Limpiamos el formulario
              setNuevoRepuesto({
                nombre: "",
                codigo_barra: "",
                precio: 0,
                marca: "",
                stock: 0,
              });
            }}
            className="bg-gray-200 text-gray-700 p-2 rounded-lg font-bold hover:bg-gray-300 transition"
          >
            ✕ Cancelar
          </button>
        )}
      </form>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-slate-100 flex items-center gap-3">
        <span className="text-slate-400 text-xl">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre, código o marca..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-slate-800 focus:outline-none"
        />
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-yellow-400">
            <tr>
              <th className="p-4 uppercase text-xs tracking-widest">Código</th>
              <th className="p-4 uppercase text-xs tracking-widest">Nombre</th>
              <th className="p-4 uppercase text-xs tracking-widest">Marca</th>
              <th className="p-4 uppercase text-xs tracking-widest">
                Proveedor
              </th>
              <th className="p-4 text-right uppercase text-xs tracking-widest">
                Precio
              </th>
              <th className="p-4 text-center uppercase text-xs tracking-widest">
                Stock
              </th>

              <th className="p-4 text-center uppercase text-xs tracking-widest font-black">
                Estado
              </th>
              <th className="p-4 text-center uppercase text-xs tracking-widest">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {repuestos.map((r) => {
              // 🚩 Definimos los colores de fondo SUAVES para la fila
              let colorFila = "hover:bg-slate-50"; // Normal
              if (r.stock > 10) colorFila = "bg-blue-50 hover:bg-blue-100"; // Mucho Stock (Sutil)
              if (r.stock < 5) colorFila = "bg-yellow-50 hover:bg-yellow-100"; // Poco Stock (Sutil)
              if (r.stock <= 2) colorFila = "bg-red-50 hover:bg-red-100"; // Crítico (Sutil)
              if (r.stock === 0) colorFila = "bg-red-300 "; // Agotado

              return (
                <tr
                  key={r.id}
                  className={`border-b border-slate-100 transition-colors ${colorFila}`}
                >
                  <td className="p-4 font-mono text-sm text-slate-600">
                    {r.codigo_barra}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{r.nombre}</td>
                  <td className="p-4 text-slate-600">{r.marca}</td>
                  <td className="p-4 text-slate-500 text-sm italic">
                    {r.proveedor || "Sin asignar"}
                  </td>
                  <td className="p-4 text-right font-bold text-green-700">
                    ${r.precio.toLocaleString("es-AR")}
                  </td>

                  {/* Columna Stock Limpia */}
                  <td className="p-4 text-center font-black text-slate-800 text-lg">
                    {r.stock}
                  </td>

                  {/* 🆕 COLUMNA ESTADO (Emojis Grandes y Ordenados) */}
                  <td className="p-4 text-center text-3xl">
                    {r.stock <= 2 && r.stock > 0 && (
                      <span className="animate-pulse" title="Crítico">
                        🚨
                      </span>
                    )}
                    {r.stock <= 4 && r.stock > 2 && (
                      <span title="Poco stock">⚠️</span>
                    )}
                    {r.stock === 0 && <span title="Agotado">🚫</span>}
                    {r.stock > 5 && (
                      <span className="text-blue-500" title="Buen stock">
                        ✅
                      </span>
                    )}
                  </td>

                  {/* Columna Acción Ordenada (Solo Botones) */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => alAgregar(r)}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 font-bold transition text-sm"
                      >
                        + Carrito
                      </button>
                      <button
                        onClick={() => {
                          setNuevoRepuesto(r);
                          setEditandoId(r.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-lg hover:bg-yellow-500 font-bold transition text-sm"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
function SeccionCarrito({
  carrito,
  alRestar,
  alAgregar,
  alEliminar,
  alFinalizar,
  volver,
  repuestos,
}) {
  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  );

  return (
    <section className="bg-white p-6 rounded-xl shadow-lg">
      <button
        onClick={volver}
        className="bg-yellow-400 text-slate-900 p-2 rounded-lg font-black uppercase tracking-tighter hover:bg-yellow-500 transition shadow-lg"
      >
        {" "}
        ← Volver{" "}
      </button>
      <h2 className="text-2xl font-bold mb-6">Carrito de Ventas</h2>

      {carrito.length === 0 ? (
        <p className="text-center py-10">El carrito está vacío</p>
      ) : (
        <>
          {carrito.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b py-3"
            >
              <div>
                <p className="font-bold">{item.nombre}</p>
                <p className="text-sm">${item.precio} c/u</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => alRestar(item.id)}
                  className="bg-gray-200 px-2 rounded"
                >
                  -
                </button>
                <span>{item.cantidad}</span>
                <button
                  onClick={() => {
                    // 1. Buscamos el repuesto en la lista general de 'repuestos'
                    const repuestoOriginal = repuestos.find(
                      (r) => r.id === item.id,
                    );

                    if (repuestoOriginal) {
                      // 2. Usamos la función del padre que ya tiene la validación de stock
                      alAgregar(repuestoOriginal);
                    }
                  }}
                  className="bg-gray-200 px-3 py-1 rounded-lg hover:bg-green-100 transition font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => alEliminar(item.id)}
                  className="ml-4 text-red-500"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          <div className="text-right text-2xl font-bold mt-6">
            Total: ${total}
          </div>
          <button
            onClick={alFinalizar}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-bold"
          >
            CONFIRMAR VENTA
          </button>
        </>
      )}
    </section>
  );
}

function SeccionHistorial({
  ventas,
  volver,
  alSeleccionar,
  filtroFecha,
  setFiltroFecha,
}) {
  return (
    <section className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Registro de Ventas</h2>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">
            Filtrar por día:
          </label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {filtroFecha && (
            <button
              onClick={() => setFiltroFecha("")}
              className="text-red-500 text-sm underline"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
      <button
        onClick={volver}
        className="bg-yellow-400 text-slate-900 p-2 rounded-lg font-black uppercase tracking-tighter hover:bg-yellow-500 transition shadow-lg"
      >
        {" "}
        ← Volver{" "}
      </button>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-yellow-400">
            <tr>
              <th className="p-4 uppercase text-xs tracking-widest font-black">
                ID Venta
              </th>
              <th className="p-4 uppercase text-xs tracking-widest font-black">
                Fecha y Hora
              </th>
              <th className="p-4 text-right uppercase text-xs tracking-widest font-black">
                Monto Total
              </th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-16 text-center text-slate-400 font-medium"
                >
                  <span className="text-4xl block mb-2">🤷‍♂️</span>
                  No hay ventas registradas todavía.
                </td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => alSeleccionar(v)}
                  className="border-b border-slate-100 hover:bg-yellow-50/50 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-mono text-blue-600 font-bold group-hover:text-blue-700">
                    #{v.id}
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {new Date(v.fecha).toLocaleString("es-AR")}
                  </td>
                  <td className="p-4 text-right font-black text-green-700 text-lg tracking-tighter">
                    ${v.total.toLocaleString("es-AR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function ModalDetalleVenta({ venta, cerrar }) {
  if (!venta) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 transition-all"
      onClick={cerrar}
    >
      <div
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter">
              Detalle de Venta {venta.id}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {new Date(venta.fecha).toLocaleString("es-AR")}
            </p>
          </div>
          <button
            onClick={cerrar}
            className="text-slate-400 hover:text-slate-900 text-2xl transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="text-slate-400 text-xs uppercase">
              <tr>
                <th className="pb-4">Producto</th>
                <th className="pb-4 text-center">Cant.</th>
                <th className="pb-4 text-right">Precio Unit.</th>
                <th className="pb-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalles.map((d, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="py-4 font-medium">
                    {d.repuesto.nombre}{" "}
                    <span className="text-xs text-slate-400 block">
                      {d.repuesto.marca}
                    </span>
                  </td>
                  <td className="py-4 text-center">{d.cantidad}</td>
                  <td className="py-4 text-right">
                    ${d.precio_unitario.toLocaleString()}
                  </td>
                  <td className="py-4 text-right font-bold">
                    ${(d.cantidad * d.precio_unitario).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50 border-t text-right">
          <span className="text-slate-500 mr-4">Total cobrado:</span>
          <span className="text-2xl font-black text-green-700">
            ${venta.total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
