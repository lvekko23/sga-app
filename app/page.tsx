'use client';

import { useState, useEffect } from 'react';

// Interfaces para TypeScript
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
  // 1. Estado de los Trabajos Mensuales (Tu lógica original de inputs)
  const [datosMesActual, setDatosMesActual] = useState({
    trabajos: [
      { id: 1, cliente: "Consorcio Mitre", servicio: "Desinsectación", fecha: "2026-05-20", gastosExtra: 0, montoCobrado: 45000 },
      { id: 2, cliente: "Panadería San José", servicio: "Control de Roedores", fecha: "2026-05-25", gastosExtra: 1200, montoCobrado: 60000 },
      { id: 3, cliente: "Restaurante Plaza", servicio: "Fumigación General", fecha: "2026-05-28", gastosExtra: 0, montoCobrado: 0 }
    ] as Trabajo[]
  });

  // 2. Estado del Depósito de Químicos (Tal cual tu captura de pantalla)
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: "Gel Cucarachicida x40g", cantidadComprada: 5, stock_disponible: 5, costoTotal: 25000 },
    { id: 2, nombre: "Líquido Deltametrina 1L", cantidadComprada: 3, stock_disponible: 2, costoTotal: 48000 }
  ]);

  // 3. Estados para el Formulario de Registrar Aplicación
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadUsada, setCantidadUsada] = useState<string>('');
  const [trabajoAsociadoId, setTrabajoAsociadoId] = useState<string>('');
  const [errorStock, setErrorStock] = useState<string>('');

  // Función para editar valores directo en la tabla (gastosExtra, montoCobrado)
  const editarTrabajo = (id: number, campo: keyof Trabajo, valor: number) => {
    setDatosMesActual((prev) => ({
      ...prev,
      trabajos: prev.trabajos.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)),
    }));
  };

  // Validar stock cada vez que cambia el producto o la cantidad ingresada
  useEffect(() => {
    if (!productoSeleccionado) return;
    const cantNum = Number(cantidadUsada);

    if (cantNum > productoSeleccionado.stock_disponible) {
      setErrorStock(`¡No se puede! Solo quedan ${productoSeleccionado.stock_disponible} unidades en el depósito.`);
    } else if (cantNum <= 0 && cantidadUsada !== '') {
      setErrorStock('La cantidad debe ser mayor a 0.');
    } else {
      setErrorStock(''); // Todo en orden
    }
  }, [cantidadUsada, productoSeleccionado]);

  // Manejar el descuento de stock al aplicar químico en un servicio
  const handleRegistrarAplicacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (errorStock || !productoSeleccionado || !cantidadUsada || !trabajoAsociadoId) return;

    const cantidadRestar = Number(cantidadUsada);

    // Descontar del stock disponible en la tabla de Depósito
    setProductos((prevProductos) =>
      prevProductos.map((p) =>
        p.id === productoSeleccionado.id
          ? { ...p, stock_disponible: p.stock_disponible - cantidadRestar }
          : p
      )
    );

    // Sumar el costo/gasto extra al trabajo seleccionado (Opcional, según tu flujo)
    const costoPorUnidad = productoSeleccionado.costoTotal / productoSeleccionado.cantidadComprada;
    const gastoCalculado = Math.round(costoPorUnidad * cantidadRestar);
    
    setDatosMesActual((prev) => ({
      ...prev,
      trabajos: prev.trabajos.map((t) =>
        t.id === Number(trabajoAsociadoId)
          ? { ...t, gastosExtra: t.gastosExtra + gastoCalculado }
          : t
      ),
    }));

    // Resetear formulario
    alert(`¡Aplicación registrada con éxito! Se descontaron ${cantidadRestar} unidades.`);
    setProductoSeleccionado(null);
    setCantidadUsada('');
    setTrabajoAsociadoId('');
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white p-4 md:p-8 space-y-10">
      
      {/* SECCIÓN 1: CONTROL DE TRABAJOS MENSUALES */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-emerald-400 mb-4">Control de Trabajos e Ingresos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="p-3">Cliente / Servicio</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-right">Gastos Extra ($)</th>
                <th className="p-3 text-right">Monto Cobrado ($)</th>
                <th className="p-3 text-right">Ganancia Individual ($)</th>
              </tr>
            </thead>
            <tbody>
              {datosMesActual.trabajos.map((t) => {
                const gananciaIndividual = t.montoCobrado - t.gastosExtra;
                return (
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{t.cliente}</div>
                      <div className="text-xs text-gray-500">{t.servicio}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{t.fecha}</td>
                    
                    {/* Input Gastos Extra */}
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={t.gastosExtra || ''}
                        onChange={(e) => editarTrabajo(t.id, 'gastosExtra', Number(e.target.value))}
                        className="bg-transparent border-b border-transparent text-right hover:border-slate-600 focus:border-emerald-400 focus:outline-none w-24"
                      />
                    </td>

                    {/* Input Monto Cobrado */}
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={t.montoCobrado || ''}
                        onChange={(e) => editarTrabajo(t.id, 'montoCobrado', Number(e.target.value))}
                        className="bg-transparent border-b border-transparent text-right hover:border-slate-600 focus:border-emerald-400 focus:outline-none w-24"
                      />
                    </td>

                    {/* Cálculo de Ganancia */}
                    <td className={`p-3 text-right font-bold ${gananciaIndividual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${gananciaIndividual.toLocaleString('es-AR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN COMPUESTA: FORMULARIO + DEPOSITÓ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO PARA APLICAR Y DESCONTAR INSUMOS */}
        <div className="bg-[#111827] border border-gray-800 p-6 rounded-xl shadow-xl lg:col-span-1">
          <h3 className="text-lg font-bold text-emerald-400 mb-1">Registrar Uso de Químico</h3>
          <p className="text-xs text-gray-400 mb-6">Descuenta stock físico y añade el costo al gasto del servicio.</p>
          
          <form onSubmit={handleRegistrarAplicacion} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">1. Seleccionar Insumo del Depósito</label>
              <select
                value={productoSeleccionado ? productoSeleccionado.id : ''}
                onChange={(e) => {
                  const prod = productos.find(p => p.id === Number(e.target.value));
                  setProductoSeleccionado(prod || null);
                  setCantidadUsada('');
                }}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              >
                <option value="">-- Seleccionar --</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} (Dispo: {p.stock_disponible})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">2. Vincular al Trabajo de:</label>
              <select
                value={trabajoAsociadoId}
                onChange={(e) => setTrabajoAsociadoId(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {datosMesActual.trabajos.map(t => (
                  <option key={t.id} value={t.id}>{t.cliente}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">3. Cantidad Utilizada</label>
              <input
                type="number"
                placeholder={productoSeleccionado ? `Máximo ${productoSeleccionado.stock_disponible}` : "Elegí un químico"}
                value={cantidadUsada}
                disabled={!productoSeleccionado}
                onChange={(e) => setCantidadUsada(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                required
              />
            </div>

            {errorStock && (
              <div className="bg-red-950/40 border border-red-600 text-red-400 text-xs p-2.5 rounded-lg font-medium">
                {errorStock}
              </div>
            )}

            <button
              type="submit"
              disabled={!!errorStock || !productoSeleccionado || !cantidadUsada || !trabajoAsociadoId}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold p-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aplicar y Restar Stock
            </button>
          </form>
        </div>

        {/* SECCIÓN 2: TU TABLA DE DEPÓSITO DE QUÍMICOS (VISTA EN TU CAPTURA) */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Depósito de Químicos y Materiales</h2>
              <p className="text-xs text-gray-400">El stock disponible bajará solo según lo gastado en los servicios.</p>
            </div>
            <button className="bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold px-3 py-2 rounded-lg transition-colors">
              + Registrar Nueva Compra
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-3">DETALLE DEL PRODUCTO</th>
                  <th className="p-3 text-center">CANTIDAD COMPRADA</th>
                  <th className="p-3 text-center">STOCK DISPONIBLE</th>
                  <th className="p-3 text-right">COSTO TOTAL COMPRA ($)</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id} className="border-b border-gray-800 hover:bg-gray-900/40 transition-colors">
                    <td className="p-3 font-medium text-gray-200">{prod.nombre}</td>
                    <td className="p-3 text-center text-gray-300">{prod.cantidadComprada}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        prod.stock_disponible === prod.cantidadComprada 
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' 
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}>
                        {prod.stock_disponible} {prod.stock_disponible === prod.cantidadComprada ? 'intactos' : 'disponibles'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-amber-500 font-semibold">
                      ${prod.costoTotal.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}