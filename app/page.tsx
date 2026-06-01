'use client';

import { useState, useEffect } from 'react';

// Interfaces estables para TypeScript
interface Trabajo {
  id: number;
  cliente: string;
  servicio: string;
  fecha: string;
  gastosExtra: number;
  montoCobrado: number;
}

interface Producto {
  id: number;
  nombre: string;
  cantidadComprada: number;
  stock_disponible: number;
  costoTotal: number;
}

export default function DashboardSGA() {
  // 1. TU ESTADO ORIGINAL DE TRABAJOS (Para que agregues clientes libremente)
  const [datosMesActual, setDatosMesActual] = useState({
    trabajos: [
      { id: 1, cliente: "Consorcio Mitre", servicio: "Desinsectación", fecha: "2026-05-20", gastosExtra: 0, montoCobrado: 45000 },
      { id: 2, cliente: "Panadería San José", servicio: "Control de Roedores", fecha: "2026-05-25", gastosExtra: 1200, montoCobrado: 60000 },
      { id: 3, cliente: "Restaurante Plaza", servicio: "Fumigación General", fecha: "2026-05-28", gastosExtra: 0, montoCobrado: 0 }
    ] as Trabajo[]
  });

  // 2. ESTADO DEL DEPÓSITO DE QUÍMICOS
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: "Gel Cucarachicida x40g", cantidadComprada: 5, stock_disponible: 5, costoTotal: 25000 },
    { id: 2, nombre: "Líquido Deltametrina 1L", cantidadComprada: 3, stock_disponible: 2, costoTotal: 48000 }
  ]);

  // Inputs para el formulario de Agregar Nuevo Trabajo
  const [nuevoCliente, setNuevoCliente] = useState('');
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');

  // Inputs para el formulario de Registrar Uso de Químico
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [trabajoAsociadoId, setTrabajoAsociadoId] = useState('');
  const [cantidadUsada, setCantidadUsada] = useState('');
  const [errorStock, setErrorStock] = useState('');

  // MANEJADOR PARA AGREGAR NUEVOS CLIENTES A LA LISTA
  const handleAgregarTrabajo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCliente || !nuevoServicio) return;

    const nuevo: Trabajo = {
      id: Date.now(),
      cliente: nuevoCliente,
      servicio: nuevoServicio,
      fecha: new Date().toISOString().split('T')[0], // Fecha de hoy automática
      gastosExtra: 0,
      montoCobrado: Number(nuevoMonto) || 0
    };

    setDatosMesActual((prev) => ({
      ...prev,
      trabajos: [...prev.trabajos, nuevo]
    }));

    // Limpiar campos
    setNuevoCliente('');
    setNuevoServicio('');
    setNuevoMonto('');
  };

  // CANDADO DE VALIDACIÓN EN VIVO DEL STOCK
  useEffect(() => {
    if (!productoSeleccionadoId) {
      setErrorStock('');
      return;
    }
    const prod = productos.find(p => p.id === Number(productoSeleccionadoId));
    const cantNum = Number(cantidadUsada);

    if (prod && cantNum > prod.stock_disponible) {
      setErrorStock(`¡No se puede! Solo quedan ${prod.stock_disponible} unidades en el depósito.`);
    } else if (cantNum <= 0 && cantidadUsada !== '') {
      setErrorStock('La cantidad debe ser mayor a 0.');
    } else {
      setErrorStock('');
    }
  }, [cantidadUsada, productoSeleccionadoId, productos]);

  // MANEJADOR PARA DESCONTAR STOCK Y SUMAR GASTO AL TRABAJO
  const handleRegistrarAplicacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (errorStock || !productoSeleccionadoId || !cantidadUsada || !trabajoAsociadoId) return;

    const prodId = Number(productoSeleccionadoId);
    const cantRestar = Number(cantidadUsada);
    const prod = productos.find(p => p.id === prodId);

    if (!prod) return;

    // Descontar del inventario
    setProductos(prevProd =>
      prevProd.map(p => p.id === prodId ? { ...p, stock_disponible: p.stock_disponible - cantRestar } : p)
    );

    // Calcular costo proporcional y sumarlo a los gastos del cliente
    const costoPorUnidad = prod.costoTotal / prod.cantidadComprada;
    const gastoCalculado = Math.round(costoPorUnidad * cantRestar);

    setDatosMesActual((prev) => ({
      ...prev,
      trabajos: prev.trabajos.map((t) =>
        t.id === Number(trabajoAsociadoId) ? { ...t, gastosExtra: t.gastosExtra + gastoCalculado } : t
      )
    }));

    alert(`¡Aplicación registrada con éxito! Se restaron ${cantRestar} unidades.`);
    
    // Limpiar campos
    setProductoSeleccionadoId('');
    setTrabajoAsociadoId('');
    setCantidadUsada('');
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white p-4 md:p-8 space-y-6">
      
      {/* TÍTULO DEL PANEL */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">SGA - Panel de Control</h1>
        <p className="text-xs text-gray-400">Gestión de servicios, clientes e inventario de depósito.</p>
      </div>

      {/* REPRODUCCIÓN DEL DISEÑO DE DOS COLUMNAS DE "image_e4159f.png" */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* COLUMNA IZQUIERDA: LAS DOS TABLAS JUNTAS (Ocupa 3 de 4 columnas) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* TABLA 1: CONTROL DE TRABAJOS E INGRESOS */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-emerald-400 mb-4">Control de Trabajos e Ingresos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="pb-3 text-left">Cliente / Servicio</th>
                    <th className="pb-3 text-left">Fecha</th>
                    <th className="pb-3 text-right">Gastos Extra ($)</th>
                    <th className="pb-3 text-right">Monto Cobrado ($)</th>
                    <th className="pb-3 text-right">Ganancia ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {datosMesActual.trabajos.map((t) => {
                    const gananciaIndividual = t.montoCobrado - t.gastosExtra;
                    return (
                      <tr key={t.id} className="border-b border-gray-800/60 hover:bg-gray-900/30 transition-colors">
                        <td className="py-3 text-left">
                          <div className="font-bold text-gray-200">{t.cliente}</div>
                          <div className="text-xs text-gray-500">{t.servicio}</div>
                        </td>
                        <td className="py-3 text-gray-400 text-xs text-left">{t.fecha}</td>
                        <td className="py-3 text-right text-gray-300">{t.gastosExtra}</td>
                        <td className="py-3 text-right text-gray-300">{t.montoCobrado}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">
                          ${gananciaIndividual.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: DEPÓSITO DE QUÍMICOS Y MATERIALES */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-1">Depósito de Químicos y Materiales</h2>
            <p className="text-xs text-gray-400 mb-4">Inventario real disponible en stock.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="pb-3 text-left">Detalle del Insumo</th>
                    <th className="pb-3 text-center">Comprados</th>
                    <th className="pb-3 text-center">Stock Disponible</th>
                    <th className="pb-3 text-right">Costo Total Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => (
                    <tr key={prod.id} className="border-b border-gray-800/60 hover:bg-gray-900/30 transition-colors">
                      <td className="py-3 text-left font-medium text-gray-200">{prod.nombre}</td>
                      <td className="py-3 text-center text-gray-400">{prod.cantidadComprada}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          prod.stock_disponible === prod.cantidadComprada 
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' 
                            : 'bg-amber-950/60 text-amber-400 border border-amber-900'
                        }`}>
                          {prod.stock_disponible} {prod.stock_disponible === prod.cantidadComprada ? 'intactos' : 'disponibles'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-amber-500 font-semibold">
                        ${prod.costoTotal.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: LOS DOS FORMULARIOS JUNTOS (Ocupa 1 de 4 columnas) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* FORMULARIO 1: AGREGAR NUEVO TRABAJO */}
          <div className="bg-[#111827] border border-gray-800 p-5 rounded-xl shadow-xl">
            <h3 className="text-sm font-bold text-emerald-400 mb-1">Agregar Nuevo Trabajo</h3>
            <p className="text-xs text-gray-400 mb-4">Registrá un cliente nuevo en la lista mensual.</p>
            
            <form onSubmit={handleAgregarTrabajo} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Consorcio Mitre"
                  value={nuevoCliente}
                  onChange={(e) => setNuevoCliente(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de Servicio</label>
                <input
                  type="text"
                  placeholder="Ej: Fumigación General"
                  value={nuevoServicio}
                  onChange={(e) => setNuevoServicio(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Monto a Cobrar ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 50000"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold p-2 rounded-lg text-xs transition-colors mt-2"
              >
                + Agregar a la Lista
              </button>
            </form>
          </div>

          {/* FORMULARIO 2: REGISTRAR USO DE QUÍMICO */}
          <div className="bg-[#111827] border border-gray-800 p-5 rounded-xl shadow-xl">
            <h3 className="text-sm font-bold text-emerald-400 mb-1">Registrar Uso de Químico</h3>
            <p className="text-xs text-gray-400 mb-4">Descuenta stock físico y asocia el gasto al cliente elegido.</p>
            
            <form onSubmit={handleRegistrarAplicacion} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">1. Elegir Químico</label>
                <select
                  value={productoSeleccionadoId}
                  onChange={(e) => {
                    setProductoSeleccionadoId(e.target.value);
                    setCantidadUsada('');
                  }}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Dispo: {p.stock_disponible})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">2. Vincular a Trabajo de:</label>
                <select
                  value={trabajoAsociadoId}
                  onChange={(e) => setTrabajoAsociadoId(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {datosMesActual.trabajos.map(t => (
                    <option key={t.id} value={t.id}>{t.cliente} ({t.servicio})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">3. Cantidad Utilizada</label>
                <input
                  type="number"
                  placeholder={productoSeleccionadoId ? "Ingresá cantidad" : "Elegí un químico primero"}
                  value={cantidadUsada}
                  disabled={!productoSeleccionadoId}
                  onChange={(e) => setCantidadUsada(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                  required
                />
              </div>

              {errorStock && (
                <div className="bg-red-950/40 border border-red-600 text-red-400 text-xs p-2 rounded-lg font-medium">
                  {errorStock}
                </div>
              )}

              <button
                type="submit"
                disabled={!!errorStock || !productoSeleccionadoId || !cantidadUsada || !trabajoAsociadoId}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold p-2 rounded-lg text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                Aplicar y Restar Stock
              </button>
            </form>
          </div>

        </div>

      </div>
    </main>
  );
}