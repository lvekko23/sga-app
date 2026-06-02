'use client';

import React, { useState, useEffect } from 'react';

// --- INTERFACES DE TIPADO ---
interface ItemStock {
  id: string;
  fecha: string; // YYYY-MM-DD para saber en qué mes impacta el gasto
  nombre: string;
  cantidad: number; // Cantidad total comprada
  costoTotal: number; // Costo total de la compra
}

interface TrabajoFumigacion {
  id: string;
  fecha: string; // YYYY-MM-DD
  cliente: string;
  servicio: string;
  productoId: string; // Enlace directo al ID de stock global
  cantidadUsada: number; 
  combustible: number;
  manoObra: number;
  otrosCostos: number;
  precioCobrado: number;
  estado: 'Pendiente' | 'Completado' | 'Cancelado';
}

export default function DashboardSGA() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [tabActiva, setTabActiva] = useState<'stock' | 'trabajos'>('stock');
  const [mesActual, setMesActual] = useState<string>('2026-06');

  // --- ESTADOS GLOBALES PLANOS (Adiós a los objetos anidados problemáticos) ---
  const [stock, setStock] = useState<ItemStock[]>([
    { id: 'prod-1', fecha: '2026-05-10', nombre: 'Gel Cucarachicida x40g', cantidad: 5, costoTotal: 25000 },
    { id: 'prod-2', fecha: '2026-05-15', nombre: 'Líquido Deltametrina 1L', cantidad: 3, costoTotal: 48000 },
    { id: 'prod-3', fecha: '2026-06-01', nombre: 'Gel Cucarachicida x40g', cantidad: 10, costoTotal: 50000 },
    { id: 'prod-4', fecha: '2026-06-02', nombre: 'Líquido Deltametrina 1L', cantidad: 4, costoTotal: 64000 }
  ]);

  const [trabajos, setTrabajos] = useState<TrabajoFumigacion[]>([
    {
      id: 'trab-1',
      fecha: '2026-05-28',
      cliente: 'Consorcio Mitre',
      servicio: 'Desinsectación',
      productoId: 'prod-2',
      cantidadUsada: 1,
      combustible: 12000,
      manoObra: 35000,
      otrosCostos: 8000,
      precioCobrado: 120000,
      estado: 'Completado'
    }
  ]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-400 animate-pulse">Cargando base de datos unificada...</p>
        </div>
      </div>
    );
  }

  // --- FILTROS DINÁMICOS POR MES ---
  const stockFiltrado = stock.filter(s => s.fecha.startsWith(mesActual));
  const trabajosFiltrados = trabajos.filter(t => t.fecha.startsWith(mesActual));

  // --- CONTADORES DE STOCK EN TIEMPO REAL ---
  const getUnidadesConsumidasGlobal = (productoId: string) => {
    return trabajos.reduce((sum, t) => t.productoId === productoId ? sum + (Number(t.cantidadUsada) || 0) : sum, 0);
  };

  // --- CALCULADORA FINANCIERA DEL MES SELECCIONADO ---
  const totalGastosStock = stockFiltrado.reduce((sum, item) => sum + (Number(item.costoTotal) || 0), 0);
  const totalGastosOperativos = trabajosFiltrados.reduce((sum, t) => {
    return sum + (Number(t.combustible) || 0) + (Number(t.manoObra) || 0) + (Number(t.otrosCostos) || 0);
  }, 0);
  const totalFacturado = trabajosFiltrados.reduce((sum, t) => sum + (Number(t.precioCobrado) || 0), 0);
  const gananciaNetaMensual = totalFacturado - (totalGastosStock + totalGastosOperativos);

  // --- CONTROLADORES DE INVENTARIO (ACCIONES ACCESIBLES) ---
  const agregarItemStock = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInicial = hoy.startsWith(mesActual) ? hoy : `${mesActual}-01`;

    const nuevo: ItemStock = {
      id: `prod-${Date.now()}`,
      fecha: fechaInicial,
      nombre: '',
      cantidad: 0,
      costoTotal: 0
    };
    setStock(prev => [...prev, nuevo]);
  };

  const editarItemStock = (id: string, campo: keyof ItemStock, valor: any) => {
    setStock(prev => prev.map(item =>
      item.id === id ? { ...item, [campo]: campo === 'nombre' || campo === 'fecha' ? valor : Number(valor) } : item
    ));
  };

  const eliminarItemStock = (id: string) => {
    setStock(prev => prev.filter(item => item.id !== id));
    setTrabajos(prev => prev.map(t => t.productoId === id ? { ...t, productoId: '', cantidadUsada: 0 } : t));
  };

  // --- CONTROLADORES DE TRABAJOS (BLINDADOS ANTI-BLOQUEOS) ---
  const agregarTrabajo = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInicial = hoy.startsWith(mesActual) ? hoy : `${mesActual}-01`;

    const nuevo: TrabajoFumigacion = {
      id: `trab-${Date.now()}`,
      fecha: fechaInicial,
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
    setTrabajos(prev => [...prev, nuevo]);
  };

  const editarTrabajo = (id: string, campo: keyof TrabajoFumigacion, valor: any) => {
    setTrabajos(prev => prev.map(t => {
      if (t.id === id) {
        let trabajoActualizado = { ...t, [campo]: valor };

        // Al cambiar de producto, limpiamos la cantidad usada de forma atómica
        if (campo === 'productoId') {
          trabajoActualizado.cantidadUsada = 0;
        }

        // Validaciones automáticas de stock real disponible en el galpón global
        if (campo === 'cantidadUsada' || campo === 'productoId') {
          const productoAsociado = stock.find(s => s.id === trabajoActualizado.productoId);

          if (productoAsociado) {
            // Calculamos lo gastado por OTRAS filas globalmente
            const consumidosOtros = prev
              .filter(trab => trab.id !== id && trab.productoId === trabajoActualizado.productoId)
              .reduce((sum, trab) => sum + (Number(trab.cantidadUsada) || 0), 0);

            const disponibleReal = productoAsociado.cantidad - consumidosOtros;
            const numValor = Number(trabajoActualizado.cantidadUsada) || 0;

            if (numValor > disponibleReal) {
              trabajoActualizado.cantidadUsada = disponibleReal;
            } else if (numValor < 0) {
              trabajoActualizado.cantidadUsada = 0;
            } else {
              trabajoActualizado.cantidadUsada = numValor;
            }
          } else {
            trabajoActualizado.cantidadUsada = 0;
          }
        } else if (['combustible', 'manoObra', 'otrosCostos', 'precioCobrado'].includes(campo as string)) {
          trabajoActualizado[campo] = Number(valor) || 0;
        }

        return trabajoActualizado;
      }
      return t;
    }));
  };

  const eliminarTrabajo = (id: string) => {
    setTrabajos(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-wide">SGA Unificado</h1>
          <p className="text-slate-400 text-sm mt-1">Base de Datos Optimizada • Insumos Globales Conectados</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">Mes de Control:</label>
          <select 
            value={mesActual} 
            onChange={(e) => setMesActual(e.target.value)}
            className="bg-transparent text-emerald-400 font-bold outline-none cursor-pointer pr-2"
          >
            <option value="2026-05" className="bg-slate-900 text-emerald-400">Mayo 2026</option>
            <option value="2026-06" className="bg-slate-900 text-emerald-400">Junio 2026</option>
            <option value="2026-07" className="bg-slate-900 text-emerald-400">Julio 2026</option>
          </select>
        </div>
      </div>

      {/* MÉTRICAS FINANCIERAS DINÁMICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Facturación {mesActual}</p>
          <p className="text-2xl font-black text-emerald-400 mt-2">${totalFacturado.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inversión Stock {mesActual}</p>
          <p className="text-2xl font-black text-orange-400 mt-2">${totalGastosStock.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Costos Operativos {mesActual}</p>
          <p className="text-2xl font-black text-rose-400 mt-2">${totalGastosOperativos.toLocaleString('es-AR')}</p>
        </div>
        <div className={`bg-slate-800 p-5 rounded-2xl border shadow-md ${gananciaNetaMensual >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Balance Neto del Mes</p>
          <p className={`text-2xl font-black mt-2 ${gananciaNetaMensual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${gananciaNetaMensual.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* PANELES / TABS */}
      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-6 max-w-md border border-slate-800">
        <button
          type="button"
          onClick={() => setTabActiva('stock')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActiva === 'stock' ? 'bg-emerald-400 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📦 Compras y Stock
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('trabajos')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActiva === 'trabajos' ? 'bg-blue-500 text-slate-100 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📅 Trabajos & Agenda
        </button>
      </div>

      {/* PANEL DE STOCK */}
      {tabActiva === 'stock' ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Compras de Remesas / Lotes</h2>
              <p className="text-xs text-slate-400">Colocá la fecha de compra para asignarle el gasto a ese mes. Los productos quedan guardados en el galpón global.</p>
            </div>
            <button 
              type="button"
              onClick={agregarItemStock}
              className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
            >
              ➕ Registrar Insumo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg w-40">Fecha Compra</th>
                  <th className="p-3">Nombre del Químico / Insumo</th>
                  <th className="p-3 text-center">Cant. Comprada</th>
                  <th className="p-3 text-center">Stock Actual Galpón</th>
                  <th className="p-3 text-right">Costo Total ($)</th>
                  <th className="p-3 text-center rounded-r-lg w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {stockFiltrado.map((item) => {
                  const totalConsumido = getUnidadesConsumidasGlobal(item.id);
                  const disponible = item.cantidad - totalConsumido;

                  return (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3">
                        <input 
                          type="date" 
                          value={item.fecha}
                          onChange={(e) => editarItemStock(item.id, 'fecha', e.target.value)}
                          className="bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded px-2 py-1 text-xs text-slate-100 outline-none w-full"
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Ej: Gel Cucarachicida x40g"
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
                      <td className="p-3 text-center font-bold">
                        {disponible <= 0 ? (
                          <span className="bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full text-xs border border-rose-500/30">⚠️ Sin Stock</span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs border border-emerald-500/20">{disponible} unidades</span>
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
                          className="text-slate-500 hover:text-rose-400 text-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {stockFiltrado.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-500 italic">No registraste compras con fecha de este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PANEL DE TRABAJOS */
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Hoja de Ruta y Desglose de Gastos</h2>
              <p className="text-xs text-slate-400">Podés usar cualquier insumo de la lista global de stock. Las cantidades se validan solas contra el galpón.</p>
            </div>
            <button 
              type="button"
              onClick={agregarTrabajo}
              className="bg-blue-500 hover:bg-blue-600 text-slate-100 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
            >
              ➕ Agendar Trabajo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 min-w-[1250px]">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg w-36">Fecha</th>
                  <th className="p-3 w-40">Cliente</th>
                  <th className="p-3 w-36">Servicio</th>
                  <th className="p-3 text-center w-32">Estado</th>
                  <th className="p-3 w-52">Insumo Utilizado</th>
                  <th className="p-3 text-center w-20">Cant.</th>
                  <th className="p-3 text-right text-rose-400">Costo Insumo</th>
                  <th className="p-3 text-right">Nafta ($)</th>
                  <th className="p-3 text-right">Mano Obra ($)</th>
                  <th className="p-3 text-right">Otros ($)</th>
                  <th className="p-3 text-right text-emerald-400">Cobrado ($)</th>
                  <th className="p-3 text-right bg-slate-950 rounded-r-lg text-slate-200 w-32">Ganancia ($)</th>
                  <th className="p-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {trabajosFiltrados.map((t) => {
                  const productoAsociado = stock.find(s => s.id === t.productoId);
                  
                  const consumidosOtros = productoAsociado 
                    ? getUnidadesConsumidasGlobal(t.productoId) - (Number(t.cantidadUsada) || 0)
                    : 0;
                  const maxPermitido = productoAsociado ? (productoAsociado.cantidad - consumidosOtros) : 0;

                  const precioUnitarioInsumo = productoAsociado && productoAsociado.cantidad > 0 
                    ? (productoAsociado.costoTotal / productoAsociado.cantidad) 
                    : 0;
                  
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

                      {/* SELECTOR DE PRODUCTO CONECTADO GLOBAL */}
                      <td className="p-3">
                        <select
                          value={t.productoId}
                          onChange={(e) => editarTrabajo(t.id, 'productoId', e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs rounded p-1 text-slate-100 outline-none w-full focus:border-blue-400 cursor-pointer"
                        >
                          <option value="" className="bg-slate-900 text-slate-300">-- Sin Insumo / Ninguno --</option>
                          {stock.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate-900 text-slate-100">
                              {item.nombre || 'Insumo sin nombre'} ({item.fecha.substring(5,7)}/{item.fecha.substring(2,4)})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* CANTIDAD GASTADA */}
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          placeholder="0"
                          min={0}
                          max={productoAsociado ? maxPermitido : undefined}
                          disabled={!t.productoId} 
                          value={t.cantidadUsada || ''}
                          onChange={(e) => editarTrabajo(t.id, 'cantidadUsada', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-center focus:border-blue-400 focus:bg-slate-900 px-1 py-1 rounded text-slate-100 w-12 outline-none text-xs disabled:opacity-20 disabled:border-transparent"
                        />
                      </td>

                      {/* COSTO DE INSUMO GENERADO */}
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

                      {/* Cobrado */}
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={t.precioCobrado || ''}
                          onChange={(e) => editarTrabajo(t.id, 'precioCobrado', e.target.value)}
                          className="bg-transparent border-b border-slate-700 text-right focus:border-blue-400 focus:bg-slate-900 px-2 py-1 rounded text-emerald-400 font-bold w-24 outline-none text-xs"
                        />
                      </td>

                      {/* Ganancia de Fila */}
                      <td className={`p-3 text-right font-black bg-slate-950/40 text-xs ${gananciaFila >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${gananciaFila.toLocaleString('es-AR')}
                      </td>

                      {/* Eliminar Fila */}
                      <td className="p-3 text-center">
                        <button 
                          type="button"
                          onClick={() => eliminarTrabajo(t.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors text-base"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {trabajosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center p-8 text-slate-500 italic">No hay órdenes creadas para este mes. ¡Hacé click en Agendar Trabajo arriba!</td>
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