import { useState, useEffect } from 'react';

// Mock inicial simulando los datos que tenés actualmente en tu depósito
const PRODUCTOS_DEPOSITO = [
  { id: 1, nombre: "Gel Cucarachicida x40g", stock_disponible: 5 },
  { id: 2, nombre: "Líquido Deltametrina 1L", stock_disponible: 2 }
];

export default function RegistrarServicio() {
  // Estado para los productos (luego los traerás de tu base de datos)
  const [productos, setProductos] = useState(PRODUCTOS_DEPOSITO);
  
  // Estados del formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [errorStock, setErrorStock] = useState('');
  const [loading, setLoading] = useState(false);

  // Escucha cambios en la cantidad o producto para clavar el candado de validación
  useEffect(() => {
    if (!productoSeleccionado) return;

    const cantNum = Number(cantidad);

    if (cantNum > productoSeleccionado.stock_disponible) {
      setErrorStock(`¡Atención! Stock insuficiente. Solo quedan ${productoSeleccionado.stock_disponible} unidades.`);
    } else if (cantNum <= 0 && cantidad !== '') {
      setErrorStock('La cantidad debe ser mayor a 0.');
    } else {
      setErrorStock(''); // Todo legal
    }
  }, [cantidad, productoSeleccionado]);

  const handleProductoChange = (e) => {
    const prodId = Number(e.target.value);
    const prod = productos.find(p => p.id === prodId);
    setProductoSeleccionado(prod || null);
    setCantidad(''); // Resetea cantidad al cambiar de insumo
    setErrorStock('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Doble check por seguridad en el frontend
    if (errorStock || !productoSeleccionado || !cantidad) return;

    setLoading(true);

    try {
      // -------------------------------------------------------------
      // ACÁ CONECTÁS CON TU API (Next.js API Routes o Python Backend)
      // -------------------------------------------------------------
      // const response = await fetch('/api/servicios', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ productoId: productoSeleccionado.id, cantidad: Number(cantidad) })
      // });
      // -------------------------------------------------------------

      // Simulación de guardado exitoso:
      alert(`Servicio registrado. Se descontaron ${cantidad} unidades de ${productoSeleccionado.nombre}`);

      // Actualización del estado local para que el stock baje al instante en pantalla
      setProductos(prevProductos => 
        prevProductos.map(p => 
          p.id === productoSeleccionado.id 
            ? { ...p, stock_disponible: p.stock_disponible - Number(cantidad) }
            : p
        )
      );

      // Limpiamos los campos del formulario
      setProductoSeleccionado(null);
      setCantidad('');
      
    } catch (error) {
      console.error("Error al registrar la aplicación:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 bg-[#111827] border border-gray-800 p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-xl font-bold mb-2 text-[#10B981]">Registrar Aplicación de Servicio</h2>
      <p className="text-sm text-gray-400 mb-6">El stock disponible bajará automáticamente según lo gastado.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Selector de Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Seleccionar Químico / Material</label>
          <select
            onChange={handleProductoChange}
            value={productoSeleccionado ? productoSeleccionado.id : ''}
            className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#10B981] focus:outline-none"
            required
          >
            <option value="">-- Elegir Insumo --</option>
            {productos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.nombre} (Disponibles: {prod.stock_disponible})
              </option>
            ))}
          </select>
        </div>

        {/* Input de Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad Utilizada</label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={!productoSeleccionado}
            placeholder={productoSeleccionado ? `Máximo ${productoSeleccionado.stock_disponible}` : "Seleccioná un producto primero"}
            className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#10B981] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
        </div>

        {/* Alerta de Error de Stock */}
        {errorStock && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm p-3 rounded-lg font-medium">
            {errorStock}
          </div>
        )}

        {/* Botón de Envío Deshabilitado si infringe las reglas */}
        <button
          type="submit"
          disabled={loading || !!errorStock || !productoSeleccionado || !cantidad || Number(cantidad) <= 0}
          className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold p-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'Confirmar y Descontar Stock'}
        </button>

      </form>
    </div>
  );
}