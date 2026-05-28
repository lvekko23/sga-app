'use client';

import React, { useState, useEffect } from 'react';

// --- INTERFACES DE TIPADO ---
interface ItemStock {
  id: string;
  nombre: string;
  cantidad: number;
  costoTotal: number;
}

interface TrabajoFumigacion {
  id: string;
  fecha: string;
  cliente: string;
  servicio: string;
  producto: number;
  combustible: number;
  manoObra: number;
  otrosCostos: number;
  precioCobrado: number;
  estado: 'Pendiente' | 'Completado' | 'Cancelado';
}

interface DatosMensuales {
  [mes: string]: {
    stock: ItemStock[];
    trabajos: TrabajoFumigacion[];
  };
}

export default function DashboardSGA() {
  // 🛡️ SOLUCIÓN AL CONGELAMIENTO: Esperar a que el componente esté montado en el cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Control de pestañas
  const [tabActiva, setTabActiva] = useState<'stock' | 'trabajos'>('stock');
  
  // Período seleccionado
  const [mesActual, setMesActual] = useState<string>('2026-05');

  // Estado maestro con datos iniciales fijos (evita discrepancias de fechas del servidor)
  const [datosPorMes, setDatosPorMes] = useState<DatosMensuales>({
    '2026-05': {
      stock: [
        { id: '1', nombre: 'Gel Cucarachicida x40g', cantidad: 5, costoTotal: 25000 },
        { id: '2', nombre: 'Líquido Deltametrina 1L', cantidad: 2, costoTotal: 32000 }
      ],
      trabajos: [
        { 
          id: '1', 
          fecha: '2026-05-28',
          cliente: 'Industria A', 
          servicio: 'Control Integral', 
          producto: 18000, 
          combustible: 12000, 
          manoObra: 35000, 
          otrosCostos: 8000, 
          precioCobrado: 120000,
          estado: 'Completado'
        }
      ]
    },
    '2026-06': { stock: [], trabajos: [] },
    '2026-07': { stock: [], trabajos: [] }
  });

  // Si no está montado, mostramos una pantalla de carga limpia para evitar el crash de React
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-400 animate-pulse">Iniciando SGA Finanzas...</p>
        </div>
      </div>
    );
  }

  // Obtener datos del mes de forma segura
  const datosMesActual = datosPorMes[mesActual] || { stock: [], trabajos: [] };

  // --- 🧮 CALCULADORA MAESTRA AUTOMÁTICA ---
  const totalGastosStock = datosMesActual.stock.reduce((sum, item) => sum + (Number(item.costoTotal) || 0), 0);
  
  const totalGastosTrabajos = datosMesActual.trabajos.reduce((sum, t) => {
    return sum + (Number(t.producto) || 0) + (Number(t.combustible) || 0) + (Number(t.manoObra) || 0) + (Number(t.otrosCostos) || 0);
  }, 0);

  const totalFacturado = datosMesActual.trabajos.reduce((sum, t) => sum + (Number(t.precioCobrado) || 0), 0);
  const totalGastosGlobales = totalGastosStock + totalGastosTrabajos;
  const gananciaNetaMensual = totalFacturado - totalGastosGlobales;

  // --- 🛠️ FUNCIONES DE GESTIÓN (AGREGAR, EDITAR, ELIMINAR) ---
  const guardarDatosMes = (tipo: 'stock' | 'trabajos', nuevaLista: any[]) => {
    setDatosPorMes(prev => ({
      ...prev,
      [mesActual]: {
        ...prev[mesActual],
        [tipo]: nuevaLista
      }
    }));
  };

  // Gestión de la sección de STOCK
  const agregarItemStock = () => {
    const nuevo: ItemStock = { id: Date.now().toString(), nombre: '', cantidad: 0, costoTotal: 0 };
    guardarDatosMes('stock', [...datosMesActual.stock, nuevo]);
  };

  const editarItemStock = (id: string, campo: keyof ItemStock, valor: any) => {
    const modificados = datosMesActual.stock.map(item => 
      item.id === id ? { ...item, [campo]: campo === 'nombre' ? valor : Number(valor) } : item
    );
    guardarDatosMes('stock', modificados);
  };

  const eliminarItemStock = (id: string) => {
    const filtrados = datosMesActual.stock.filter(item => item.id !== id);
    guardarDatosMes('stock', filtrados);
  };

  // Gestión de la sección de TRABAJOS Y AGENDA
  const agregarTrabajo = () => {
    const nuevo: TrabajoFumigacion = {
      id: Date.now().toString(),
      fecha: '2026-05-28',
      cliente: '',
      servicio: '',
      producto: 0,
      combustible: 0,
      manoObra: 0,
      otrosCostos: 0,
      precioCobrado: 0,
      estado: 'Pendiente'
    };
    guardarDatosMes('trabajos', [...datosMesActual.trabajos, nuevo]);
  };

  const editarTrabajo = (id: string, campo: keyof TrabajoFumigacion, valor: any) => {
    const modificados = datosMesActual.trabajos.map(t => {
      if (t.id === id) {
        if (campo === 'cliente' || campo === 'servicio' || campo === 'fecha' || campo === 'estado') {
          return { ...t, [campo]: valor };
        }
        return { ...t, [campo]: Number(valor) };
      }
      return t;
    });
    guardarDatosMes('trabajos', modificados);
  };

  const eliminarTrabajo = (id: string) => {
    const filtrados = datosMesActual.trabajos.filter(t => t.id !== id);
    guardarDatosMes('trabajos', filtrados);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      
      {/* PANEL DE CONTROL CENTRAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-wide">SGA Gestión & Finanzas</h1>
          <p className="text-slate-400 text-sm mt-1">Calculadoras en Tiempo Real y Agenda de Servicios</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">Período Seleccionado:</label>
          <select 
            value={mesActual} 
            onChange={(e) => setMesActual(e.target.value)}
            className="bg-transparent text-emerald-400 font-bold outline-none cursor-pointer pr-2"
          >
            <option value="2026-05">Mayo 2026</option>
            <option value="2026-06">Junio 2026</option>
            <option value="2026-07">Julio 2026</option>
          </select>
        </div>
      </div>

      {/* BLOQUE DE CONTADORES GLOBALES (CALCULADORA PRINCIPAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingresos Brutos</p>
          <p className="text-2xl font-black text-emerald-400 mt-2">${totalFacturado.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gastos en Insumos</p>
          <p className="text-2xl font-black text-orange-400 mt-2">${totalGastosStock.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Costos Operativos Servicios</p>
          <p className="text-2xl font-black text-rose-400 mt-2">${totalGastosTrabajos.toLocaleString('es-AR')}</p>
        </div>
        <div className={`bg-slate-800 p-5 rounded-2xl border shadow-md transition-all ${gananciaNetaMensual >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Utilidad Neta Total</p>
          <p className={`text-2xl font-black mt-2 ${gananciaNetaMensual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${gananciaNetaMensual.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* REPRODUCTOR DE SECCIONES (TABS) */}
      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-6 max-w-md border border-slate-800">
        <button
          type="button"
          onClick={() => setTabActiva('stock')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActiva === 'stock' ? 'bg-emerald-400 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📦 Sección Stock
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('trabajos')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActiva === 'trabajos' ? 'bg-blue-500 text-slate-100 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📅 Sección Trabajos & Agenda
        </button>
      </div>

      {/* CONTENIDOS DINÁMICOS CON INPUTS ASOCIADOS AL ESTADO */}
      {tabActiva === 'stock' ? (
        /* ================= PESTAÑA DE STOCK ================= */
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Inventario y Depósito de Materiales</h2>
              <p className="text-xs text-slate-400">Control directo de compras para reponer insumos químicos y herramientas</p>
            </div>
            <button 
              type="button"
              onClick={agregarItemStock}
              className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
            >
              ➕ Agregar Fila de Stock
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Nombre del Producto / Insumo</th>
                  <th className="p-3 text-center">Cantidad Adquirida</th>
                  <th className="p-3 text-right">Inversión Realizada ($)</th>
                  <th className="p-3 text-center rounded-r-lg w-16">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {datosMesActual.stock.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      <input 
                        type="text" 
                        placeholder="Ej: Deltametrina 1L"
                        value={item.nombre}
                        onChange={(e) => editarItemStock(item.id, 'nombre', e.target.value)}
                        className="bg-transparent border-b border-slate-700 focus:border-emerald-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-100 w-full outline-none transition-all"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={item.cantidad || ''}
                        onChange={(e) => editarItemStock(item.id, 'cantidad', e.target.value)}
                        className="bg-transparent border-b border-slate-700 text-center focus:border-emerald-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-100 w-24 outline-none transition-all"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={item.costoTotal || ''}
                        onChange={(e) => editarItemStock(item.id, 'costoTotal', e.target.value)}
                        className="bg-transparent border-b border-slate-700 text-right focus:border-emerald-400 focus:bg-slate-900 px-2 py-1 rounded text-orange-400 font-bold w-32 outline-none transition-all"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        type="button"
                        onClick={() => eliminarItemStock(item.id)}
                        className="text-slate-500 hover:text-rose-400 px-2 py-1 rounded transition-colors text-lg"
                        title="Eliminar material"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {datosMesActual.stock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-slate-500 italic">No hay insumos registrados en este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= PESTAÑA DE TRABAJOS Y AGENDA ================= */
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Hoja de Ruta, Turnos y Liquidación Individual</h2>
              <p className="text-xs text-slate-400">Módulo de agenda y desglose financiero por cada servicio ejecutado</p>
            </div>
            <button 
              type="button"
              onClick={agregarTrabajo}
              className="bg-blue-500 hover:bg-blue-600 text-slate-100 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
            >
              ➕ Agendar Nuevo Servicio
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 min-w-[1100px]">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg w-36">Agenda (Fecha)</th>
                  <th className="p-3 w-40">Cliente</th>
                  <th className="p-3 w-40">Tipo Servicio</th>
                  <th className="p-3 text-center w-36">Estado</th>
                  <th className="p-3 text-right">Insumos ($)</th>
                  <th className="p-3 text-right">Nafta ($)</th>
                  <th className="p-3 text-right">Mano Obra ($)</th>
                  <th className="p-3 text-right">Otros ($)</th>
                  <th className="p-3 text-right text-emerald-400">Precio Cobrado ($)</th>
                  <th className="p-3 text-right bg-slate-950 rounded-r-lg text-slate-200 w-32">Utilidad Neta ($)</th>
                  <th className="p-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {datosMesActual.trabajos.map((t) => {
                  // Cálculo de costos individuales automatizado en tiempo real
                  const costosFila = Number(t.producto) + Number(t.combustible) + Number(t.manoObra) + Number(t.otrosCostos);
                  const gananciaFila = Number(t.precioCobrado) - costosFila;

                  return (
                    <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Calendario / Fecha */}
                      <td className="p-3">
                        <input 
                          type="date" 
                          value={t.fecha}
                          onChange={(e) => editarTrabajo(t.id, 'fecha', e.target.value)}
                          className="bg-slate-900 border border-slate-700 focus:border-blue-400 rounded px-2 py-1 text-xs text-slate-100 outline-none w-full"
                        />
                      </td>
                      
                      {/* Cliente */}
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Particular / Empresa"
                          value={t.cliente}
                          onChange={(e) => editarTrabajo(t.id, 'cliente', e.target.value)}
                          className="bg-transparent border-b border-slate-700 focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-100 w-full outline-none text-xs"
                        />
                      </td>

                      {/* Tipo de Servicio */}
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Ej: Desinsectación"
                          value={t.servicio}
                          onChange={(e) => editarTrabajo(t.id, 'servicio', e.target.value)}
                          className="bg-transparent border-b border-slate-700 focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-400 w-full outline-none text-xs"
                        />
                      </td>

                      {/* Selector de Estado Agenda */}
                      <td className="p-3 text-center">
                        <select
                          value={t.estado}
                          onChange={(e) => editarTrabajo(t.id, 'estado', e.target.value as any)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border w-full ${
                            t.estado === 'Completado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            t.estado === 'Cancelado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <option value="Pendiente" className="bg-slate-900 text-amber-400">⏳ Pendiente</option>
                          <option value="Completado" className="bg-slate-900 text-emerald-400">✅ Completado</option>
                          <option value="Cancelado" className="bg-slate-900 text-rose-400">❌ Cancelado</option>
                        </select>
                      </td>

                      {/* Producto */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.producto || ''}
                          onChange={(e) => editarTrabajo(t.id, 'producto', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-rose-400 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Nafta */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.combustible || ''}
                          onChange={(e) => editarTrabajo(t.id, 'combustible', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-rose-400 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Mano de Obra */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.manoObra || ''}
                          onChange={(e) => editarTrabajo(t.id, 'manoObra', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-rose-400 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Otros Costos */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.otrosCostos || ''}
                          onChange={(e) => editarTrabajo(t.id, 'otrosCostos', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-rose-400 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Monto Cobrado */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.precioCobrado || ''}
                          onChange={(e) => editarTrabajo(t.id, 'precioCobrado', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-emerald-400 font-bold w-24 outline-none text-xs"
                        />
                      </td>

                      {/* Resultado Neto Fila */}
                      <td className={`p-3 text-right font-black bg-slate-950/40 text-xs ${gananciaFila >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${gananciaFila.toLocaleString('es-AR')}
                      </td>

                      {/* Botón de Borrado */}
                      <td className="p-3 text-center">
                        <button 
                          type="button"
                          onClick={() => eliminarTrabajo(t.id)}
                          className="text-slate-500 hover:text-rose-400 px-1 rounded transition-colors text-base"
                          title="Eliminar servicio"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {datosMesActual.trabajos.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-slate-500 italic">No hay órdenes cargadas en la agenda para este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}