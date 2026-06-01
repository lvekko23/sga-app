'use client';

import React, { useState, useEffect } from 'react';

// --- INTERFACES DE TIPADO ---
interface ItemStock {
  id: string;
  nombre: string;
  cantidad: number; // Cantidad total comprada
  costoTotal: number; // Costo de la compra mayorista
}

interface TrabajoFumigacion {
  id: string;
  fecha: string;
  cliente: string;
  servicio: string;
  productoId: string; // ID del producto de stock seleccionado
  cantidadUsada: number; // Cuántas unidades se consumieron
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [tabActiva, setTabActiva] = useState<'stock' | 'trabajos'>('stock');
  const [mesActual, setMesActual] = useState<string>('2026-05');

  // Estado maestro con datos iniciales vinculados de ejemplo
  const [datosPorMes, setDatosPorMes] = useState<DatosMensuales>({
    '2026-05': {
      stock: [
        { id: 'prod-1', nombre: 'Gel Cucarachicida x40g', cantidad: 5, costoTotal: 25000 }, // Cada uno sale $5.000
        { id: 'prod-2', nombre: 'Líquido Deltametrina 1L', cantidad: 3, costoTotal: 48000 }  // Cada uno sale $16.000
      ],
      trabajos: [
        { 
          id: 'trab-1', 
          fecha: '2026-05-28',
          cliente: 'Industria A', 
          servicio: 'Control Integral', 
          productoId: 'prod-2', // Usa Deltametrina
          cantidadUsada: 1,      // Gasta 1 Litro ($16.000)
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-400 animate-pulse">Conectando Stock y Agenda...</p>
        </div>
      </div>
    );
  }

  const datosMesActual = datosPorMes[mesActual] || { stock: [], trabajos: [] };

  // --- 🧮 CALCULADORA DE DESCUENTOS Y UNIDADES USADAS ---
  const getUnidadesConsumidas = (productoId: string) => {
    return datosMesActual.trabajos
      .reduce((sum, t) => t.productoId === productoId ? sum + (Number(t.cantidadUsada) || 0) : sum, 0);
  };

  // --- 📈 CALCULADORA MAESTRA FINANCIERA ---
  const totalGastosStock = datosMesActual.stock.reduce((sum, item) => sum + (Number(item.costoTotal) || 0), 0);
  
  const totalGastosOperativos = datosMesActual.trabajos.reduce((sum, t) => {
    return sum + (Number(t.combustible) || 0) + (Number(t.manoObra) || 0) + (Number(t.otrosCostos) || 0);
  }, 0);

  const totalFacturado = datosMesActual.trabajos.reduce((sum, t) => sum + (Number(t.precioCobrado) || 0), 0);
  
  // Utilidad Neta Real = Lo cobrado menos lo invertido en galpón/stock y los viajes
  const gananciaNetaMensual = totalFacturado - (totalGastosStock + totalGastosOperativos);

  // --- 🛠️ CONTROLADORES DE BASE DE DATOS LOCAL ---
  const guardarDatosMes = (tipo: 'stock' | 'trabajos', nuevaLista: any[]) => {
    setDatosPorMes(prev => ({
      ...prev,
      [mesActual]: {
        ...prev[mesActual],
        [tipo]: nuevaLista
      }
    }));
  };

  // Acciones de Stock
  const agregarItemStock = () => {
    const nuevo: ItemStock = { id: `prod-${Date.now()}`, nombre: '', cantidad: 0, costoTotal: 0 };
    guardarDatosMes('stock', [...datosMesActual.stock, nuevo]);
  };

  const editarItemStock = (id: string, campo: keyof ItemStock, valor: any) => {
    const modificados = datosMesActual.stock.map(item => 
      item.id === id ? { ...item, [campo]: campo === 'nombre' ? valor : Number(valor) } : item
    );
    guardarDatosMes('stock', modificados);
  };

  const eliminarItemStock = (id: string) => {
    // Si borramos el producto, desvinculamos los trabajos que lo usaban
    const stockFiltrado = datosMesActual.stock.filter(item => item.id !== id);
    const trabajosLimpios = datosMesActual.trabajos.map(t => t.productoId === id ? { ...t, productoId: '', cantidadUsada: 0 } : t);
    
    setDatosPorMes(prev => ({
      ...prev,
      [mesActual]: {
        stock: stockFiltrado,
        trabajos: trabajosLimpios
      }
    }));
  };

  // Acciones de Trabajos
  const agregarTrabajo = () => {
    const nuevo: TrabajoFumigacion = {
      id: `trab-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      cliente: '',
      servicio: '',
      productoId: '', 
      cantidadUsada: 0,
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
        if (['cliente', 'servicio', 'fecha', 'estado', 'productoId'].includes(campo)) {
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
      
      {/* CARD PRINCIPAL DE CONTROL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-wide">SGA Conectado</h1>
          <p className="text-slate-400 text-sm mt-1">Inventario Vinculado Automatizado en Tiempo Real</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">Mes de Gestión:</label>
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

      {/* BLOQUE DE NÚMEROS GLOBALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Facturación Total</p>
          <p className="text-2xl font-black text-emerald-400 mt-2">${totalFacturado.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Invertido en Insumos (Galpón)</p>
          <p className="text-2xl font-black text-orange-400 mt-2">${totalGastosStock.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gastos de Viaje / Logística</p>
          <p className="text-2xl font-black text-rose-400 mt-2">${totalGastosOperativos.toLocaleString('es-AR')}</p>
        </div>
        <div className={`bg-slate-800 p-5 rounded-2xl border shadow-md ${gananciaNetaMensual >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Caja Neta del Mes</p>
          <p className={`text-2xl font-black mt-2 ${gananciaNetaMensual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${gananciaNetaMensual.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* TABS DE SECCIÓN */}
      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-6 max-w-md border border-slate-800">
        <button
          type="button"
          onClick={() => setTabActiva('stock')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActiva === 'stock' ? 'bg-emerald-400 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📦 Stock e Inventario
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('trabajos')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActiva === 'trabajos' ? 'bg-blue-500 text-slate-100 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📅 Trabajos & Agenda
        </button>
      </div>

      {/* CONTENIDO INTERCONECTADO */}
      {tabActiva === 'stock' ? (
        /* ================= VISTA STOCK ================= */
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Depósito de Químicos y Materiales</h2>
              <p className="text-xs text-slate-400">Registrá las compras mayoristas. El stock disponible bajará solo según lo gastado en los servicios.</p>
            </div>
            <button 
              type="button"
              onClick={agregarItemStock}
              className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
            >
              ➕ Registrar Nueva Compra
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Detalle del Producto</th>
                  <th className="p-3 text-center">Cantidad Comprada</th>
                  <th className="p-3 text-center">Stock Disponible</th>
                  <th className="p-3 text-right">Costo Total Compra ($)</th>
                  <th className="p-3 text-center rounded-r-lg w-16">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {datosMesActual.stock.map((item) => {
                  const consumidos = getUnidadesConsumidas(item.id);
                  const disponible = item.cantidad - consumidos;

                  return (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Ej: Deltametrina 1L"
                          value={item.nombre}
                          onChange={(e) => editarItemStock(item.id, 'nombre', e.target.value)}
                          className="bg-transparent border-b border-slate-700 focus:border-emerald-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-100 w-full outline-none"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={item.cantidad || ''}
                          onChange={(e) => editarItemStock(item.id, 'cantidad', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-center focus:border-emerald-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-100 w-24 outline-none"
                        />
                      </td>
                      {/* INDICADOR DINÁMICO DE STOCK DISPONIBLE */}
                      <td className="p-3 text-center font-bold">
                        {disponible <= 0 ? (
                          <span className="bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full text-xs border border-rose-500/30">⚠️ Agotado</span>
                        ) : disponible === item.cantidad ? (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs border border-emerald-500/20">{disponible} intactos</span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-xs border border-amber-500/20">{disponible} disponibles</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={item.costoTotal || ''}
                          onChange={(e) => editarItemStock(item.id, 'costoTotal', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-emerald-400 focus:bg-slate-900 px-2 py-1 rounded text-orange-400 font-bold w-32 outline-none"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          type="button"
                          onClick={() => eliminarItemStock(item.id)}
                          className="text-slate-500 hover:text-rose-400 px-2 py-1 rounded text-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {datosMesActual.stock.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500 italic">No hay compras ingresadas en este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= VISTA TRABAJOS & AGENDA ================= */
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Hoja de Ruta y Desglose Financiero</h2>
              <p className="text-xs text-slate-400">Seleccioná qué insumo del depósito gastaste y la cantidad. Los costos se calculan solos.</p>
            </div>
            <button 
              type="button"
              onClick={agregarTrabajo}
              className="bg-blue-500 hover:bg-blue-600 text-slate-100 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
            >
              ➕ Agendar Visita / Servicio
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 min-w-[1200px]">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg w-36">Fecha</th>
                  <th className="p-3 w-40">Cliente</th>
                  <th className="p-3 w-36">Servicio</th>
                  <th className="p-3 text-center w-32">Estado</th>
                  <th className="p-3 w-48">Insumo Utilizado</th>
                  <th className="p-3 text-center w-20">Cant.</th>
                  <th className="p-3 text-right text-rose-400">Costo Insumo ($)</th>
                  <th className="p-3 text-right">Nafta ($)</th>
                  <th className="p-3 text-right">Mano Obra ($)</th>
                  <th className="p-3 text-right">Otros ($)</th>
                  <th className="p-3 text-right text-emerald-400">Cobrado ($)</th>
                  <th className="p-3 text-right bg-slate-950 rounded-r-lg text-slate-200 w-32">Ganancia ($)</th>
                  <th className="p-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {datosMesActual.trabajos.map((t) => {
                  // 🧠 CÁLCULOS LOGICIALES POR FILA
                  const productoAsociado = datosMesActual.stock.find(s => s.id === t.productoId);
                  
                  // Precio Unitario = Costo Total Compra / Cantidad Comprada
                  const precioUnitarioInsumo = productoAsociado && productoAsociado.cantidad > 0 
                    ? (productoAsociado.costoTotal / productoAsociado.cantidad) 
                    : 0;
                  
                  // Costo Insumo de la Fila = Precio Unitario * Cantidad Usada en este servicio
                  const costoInsumoCalculado = precioUnitarioInsumo * (Number(t.cantidadUsada) || 0);

                  const costosTotalesFila = costoInsumoCalculado + Number(t.combustible) + Number(t.manoObra) + Number(t.otrosCostos);
                  const gananciaFila = Number(t.precioCobrado) - costosTotalesFila;

                  return (
                    <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Fecha */}
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
                          placeholder="Cliente"
                          value={t.cliente}
                          onChange={(e) => editarTrabajo(t.id, 'cliente', e.target.value)}
                          className="bg-transparent border-b border-slate-700 focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-100 w-full outline-none text-xs"
                        />
                      </td>

                      {/* Servicio */}
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Ej: Desratización"
                          value={t.servicio}
                          onChange={(e) => editarTrabajo(t.id, 'servicio', e.target.value)}
                          className="bg-transparent border-b border-slate-700 focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-slate-400 w-full outline-none text-xs"
                        />
                      </td>

                      {/* Estado */}
                      <td className="p-3 text-center">
                        <select
                          value={t.estado}
                          onChange={(e) => editarTrabajo(t.id, 'estado', e.target.value as any)}
                          className={`px-1.5 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border w-full ${
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

                      {/* 🔄 SELECTOR DINÁMICO DE PRODUCTOS DE STOCK */}
                      <td className="p-3">
                        <select
                          value={t.productoId}
                          onChange={(e) => {
                            editarTrabajo(t.id, 'productoId', e.target.value);
                            // Reseteamos cantidad usada al cambiar de producto para evitar errores
                            editarTrabajo(t.id, 'cantidadUsada', 0);
                          }}
                          className="bg-slate-900 border border-slate-700 text-xs rounded p-1 text-slate-300 outline-none w-full focus:border-blue-400"
                        >
                          <option value="">-- Ninguno / Sin Insumo --</option>
                          {datosMesActual.stock.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.nombre || 'Producto sin nombre'}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* CANTIDAD GASTADA */}
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          placeholder="0"
                          disabled={!t.productoId} // Deshabilitado si no eligió producto primero
                          value={t.cantidadUsada || ''}
                          onChange={(e) => editarTrabajo(t.id, 'cantidadUsada', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-center focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-slate-100 w-12 outline-none text-xs disabled:opacity-30 disabled:border-transparent"
                        />
                      </td>

                      {/* COSTO AUTOMÁTICO DE INSUMO EN ESTA FILA */}
                      <td className="p-3 text-right font-semibold text-rose-400 text-xs">
                        ${costoInsumoCalculado.toLocaleString('es-AR')}
                      </td>

                      {/* Nafta */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.combustible || ''}
                          onChange={(e) => editarTrabajo(t.id, 'combustible', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-slate-300 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Mano de Obra */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.manoObra || ''}
                          onChange={(e) => editarTrabajo(t.id, 'manoObra', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-slate-300 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Otros Costos */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.otrosCostos || ''}
                          onChange={(e) => editarTrabajo(t.id, 'otrosCostos', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-slate-300 w-16 outline-none text-xs"
                        />
                      </td>

                      {/* Precio Cobrado */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.precioCobrado || ''}
                          onChange={(e) => editarTrabajo(t.id, 'precioCobrado', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-emerald-400 font-bold w-24 outline-none text-xs"
                        />
                      </td>

                      {/* Ganancia de la Fila */}
                      <td className={`p-3 text-right font-black bg-slate-950/40 text-xs ${gananciaFila >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${gananciaFila.toLocaleString('es-AR')}
                      </td>

                      {/* Borrar Fila */}
                      <td className="p-3 text-center">
                        <button 
                          type="button"
                          onClick={() => eliminarTrabajo(t.id)}
                          className="text-slate-500 hover:text-rose-400 px-1 rounded transition-colors text-base"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {datosMesActual.trabajos.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center p-8 text-slate-500 italic">No hay órdenes cargadas en la agenda para este mes.</td>
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