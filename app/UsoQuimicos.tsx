'use client';

import { useState, useEffect } from 'react';

interface Producto {
  id: number;
  nombre: string;
  cantidadComprada: number;
  stock_disponible: number;
  costoTotal: number;
}

export default function UsoQuimicos() {
  // Estado local del depósito (Traído de tu captura de pantalla)
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: "Gel Cucarachicida x40g", cantidadComprada: 5, stock_disponible: 5, costoTotal: 25000 },
    { id: 2, nombre: "Líquido Deltametrina 1L", cantidadComprada: 3, stock_disponible: 2, costoTotal: 48000 }
  ]);

  // Estados del formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadUsada, setCantidadUsada] = useState<string>('');
  const [errorStock, setErrorStock] = useState<string>('');

  // Candado de validación estricta
  useEffect(() => {
    if (!productoSeleccionado) return;
    const cantNum = Number(cantidadUsada);

    if (cantNum > productoSeleccionado.stock_disponible) {
      setErrorStock(`¡No se puede agregar! Solo quedan ${productoSeleccionado.stock_disponible} unidades en stock.`);
    } else if (cantNum <= 0 && cantidadUsada !== '') {
      setErrorStock('La cantidad debe ser mayor a 0.');
    } else {
      setErrorStock(''); // Todo legal
    }
  }, [cantidadUsada, productoSeleccionado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errorStock || !productoSeleccionado || !cantidadUsada) return;

    const restar = Number(cantidadUsada);

    // Descuenta localmente
    setProductos(prev =>
      prev.map(p => p.id === productoSeleccionado.id ? { ...p, stock_disponible: p.stock_disponible - restar } : p)
    );

    alert(`Se aplicaron ${restar} unidades de ${productoSeleccionado.nombre}. ¡Stock actualizado!`);
    
    // Reset de campos
    setProductoSeleccionado(null);
    setCantidadUsada('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      
      {/* Formulario con bloqueo */}
      <div className="bg-[#111827] border border-gray-800 p-5 rounded-xl shadow-lg lg:col-span-1">
        <h3 className="text-base font-bold text-emerald-400 mb-1">Registrar Consumo</h3>
        <p className="text-xs text-gray-400 mb-4">El candado impide cargas mayores al stock físico real.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Seleccionar Insumo</label>
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
              <option value="">-- Elegir --</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (Dispo: {p.stock_disponible})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Cantidad a Utilizar</label>
            <input
              type="number"
              placeholder={productoSeleccionado ? `Máximo ${productoSeleccionado.stock_disponible}` : "Elegí producto"}
              value={cantidadUsada}
              disabled={!productoSeleccionado}
              onChange={(e) => setCantidadUsada(e.target.value)}
              className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
              required
            />
          </div>

          {errorStock && (
            <div className="bg-red-950/40 border border-red-600 text-red-400 text-xs p-2.5 rounded-lg">
              {errorStock}
            </div>
          )}

          <button
            type="submit"
            disabled={!!errorStock || !productoSeleccionado || !cantidadUsada}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold p-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Descontar del Depósito
          </button>
        </form>
      </div>

      {/* Tabla del Depósito (Espejo de tu diseño original) */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg lg:col-span-2">
        <h3 className="text-base font-bold text-white mb-1">Depósito de Químicos</h3>
        <p className="text-xs text-gray-400 mb-4">Estado actual en tiempo real.</p>
        
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="p-2">PRODUCTO</th>
                <th className="p-2 text-center">COMPRADO</th>
                <th className="p-2 text-center">STOCK ACTUAL</th>
                <th className="p-2 text-right">COSTO TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                  <td className="p-2 font-medium text-gray-300">{prod.nombre}</td>
                  <td className="p-2 text-center text-gray-400">{prod.cantidadComprada}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      prod.stock_disponible === prod.cantidadComprada 
                        ? 'bg-emerald-950/50 text-emerald-400' 
                        : 'bg-amber-950/50 text-amber-400'
                    }`}>
                      {prod.stock_disponible} {prod.stock_disponible === prod.cantidadComprada ? 'intactos' : 'dispo'}
                    </span>
                  </td>
                  <td className="p-2 text-right text-amber-500 font-semibold">
                    ${prod.costoTotal.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}