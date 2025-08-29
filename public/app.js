// Variables globales
let productos = [];

// URLs de la API
const API_BASE = '';
const API_PRODUCTOS = '/productos';

// Elementos del DOM
const btnAgregar = document.getElementById('btnAgregar');
const formAgregar = document.getElementById('formAgregar');
const formEditar = document.getElementById('formEditar');
const modalEditar = document.getElementById('modalEditar');
const modalContent = document.getElementById('modalContent');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');
const tablaProductos = document.getElementById('tablaProductos');
const sinProductos = document.getElementById('sinProductos');

// Campos de estadísticas
const totalProductos = document.getElementById('totalProductos');
const valorTotal = document.getElementById('valorTotal');
const totalStock = document.getElementById('totalStock');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    formAgregar.addEventListener('submit', manejarAgregarProducto);
    formEditar.addEventListener('submit', manejarEditarProducto);
    btnCancelar.addEventListener('click', cerrarModal);
    modalEditar.addEventListener('click', (e) => {
        if (e.target === modalEditar) {
            cerrarModal();
        }
    });
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const response = await fetch(API_PRODUCTOS);
        const data = await response.json();
        
        if (response.ok) {
            productos = data.productos;
            renderizarProductos();
            actualizarEstadisticas();
        } else {
            mostrarToast('Error al cargar productos: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión al cargar productos', 'error');
    }
}

// Renderizar productos en la tabla
function renderizarProductos() {
    if (productos.length === 0) {
        tablaProductos.innerHTML = '';
        sinProductos.classList.remove('hidden');
        return;
    }

    sinProductos.classList.add('hidden');
    
    tablaProductos.innerHTML = productos.map(producto => `
        <tr class="hover:bg-gray-50 transition-colors duration-200">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${producto.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${producto.nombre}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-semibold">$${formatearPrecio(producto.precio)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    producto.stock > 10 ? 'bg-success-100 text-success-800' :
                    producto.stock > 0 ? 'bg-warning-100 text-warning-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${producto.stock} unidades
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button 
                    onclick="abrirModalEditar(${producto.id})" 
                    class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                    Editar
                </button>
                <button 
                    onclick="eliminarProducto(${producto.id})" 
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                    Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = productos.length;
    const valorTotalCalculado = productos.reduce((sum, producto) => sum + (producto.precio * producto.stock), 0);
    const stockTotal = productos.reduce((sum, producto) => sum + producto.stock, 0);

    totalProductos.textContent = total;
    valorTotal.textContent = '$' + formatearPrecio(valorTotalCalculado);
    totalStock.textContent = stockTotal;
}

// Manejar agregar producto
async function manejarAgregarProducto(e) {
    e.preventDefault();
    
    const formData = new FormData(formAgregar);
    const nuevoProducto = {
        nombre: formData.get('nombre').trim(),
        precio: parseFloat(formData.get('precio')),
        stock: parseInt(formData.get('stock'))
    };

    // Validaciones del frontend
    if (!nuevoProducto.nombre) {
        mostrarToast('El nombre del producto es requerido', 'error');
        return;
    }

    if (nuevoProducto.precio <= 0) {
        mostrarToast('El precio debe ser mayor a 0', 'error');
        return;
    }

    if (nuevoProducto.stock < 0) {
        mostrarToast('El stock no puede ser negativo', 'error');
        return;
    }

    try {
        const response = await fetch(API_PRODUCTOS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nuevoProducto)
        });

        const data = await response.json();
        
        if (response.ok) {
            formAgregar.reset();
            await cargarProductos();
            mostrarToast('Producto agregado exitosamente', 'success');
        } else {
            mostrarToast('Error al agregar producto: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión al agregar producto', 'error');
    }
}

// Abrir modal de edición
async function abrirModalEditar(id) {
    const producto = productos.find(p => p.id === id);
    
    if (!producto) {
        mostrarToast('Producto no encontrado', 'error');
        return;
    }

    // Llenar el formulario con los datos del producto
    document.getElementById('editarId').value = producto.id;
    document.getElementById('editarNombre').value = producto.nombre;
    document.getElementById('editarPrecio').value = producto.precio;
    document.getElementById('editarStock').value = producto.stock;

    // Mostrar modal con animación
    modalEditar.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Cerrar modal
function cerrarModal() {
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        modalEditar.classList.add('hidden');
        formEditar.reset();
    }, 300);
}

// Manejar editar producto
async function manejarEditarProducto(e) {
    e.preventDefault();
    
    const formData = new FormData(formEditar);
    const id = formData.get('id');
    const productoEditado = {
        nombre: formData.get('nombre').trim(),
        precio: parseFloat(formData.get('precio')),
        stock: parseInt(formData.get('stock'))
    };

    // Validaciones del frontend
    if (!productoEditado.nombre) {
        mostrarToast('El nombre del producto es requerido', 'error');
        return;
    }

    if (productoEditado.precio <= 0) {
        mostrarToast('El precio debe ser mayor a 0', 'error');
        return;
    }

    if (productoEditado.stock < 0) {
        mostrarToast('El stock no puede ser negativo', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productoEditado)
        });

        const data = await response.json();
        
        if (response.ok) {
            cerrarModal();
            await cargarProductos();
            mostrarToast('Producto actualizado exitosamente', 'success');
        } else {
            mostrarToast('Error al actualizar producto: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión al actualizar producto', 'error');
    }
}

// Mostrar toast de notificación
function mostrarToast(mensaje, tipo = 'success') {
    toastMessage.textContent = mensaje;
    
    // Configurar icono y colores según el tipo
    if (tipo === 'success') {
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        toastIcon.className = 'w-5 h-5 text-success-500';
        toast.querySelector('div').className = 'bg-white border-l-4 border-success-500 rounded-lg shadow-lg p-4 max-w-sm';
    } else {
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
        toastIcon.className = 'w-5 h-5 text-red-500';
        toast.querySelector('div').className = 'bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4 max-w-sm';
    }

    // Mostrar toast
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
    }, 10);

    // Ocultar después de 3 segundos
    setTimeout(() => {
        ocultarToast();
    }, 3000);
}

// Ocultar toast
function ocultarToast() {
    toast.classList.remove('translate-x-0');
    toast.classList.add('translate-x-full');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 500);
}

// Eliminar producto
async function eliminarProducto(id) {
    const producto = productos.find(p => p.id === id);
    
    if (!producto) {
        mostrarToast('Producto no encontrado', 'error');
        return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (response.ok) {
            await cargarProductos();
            mostrarToast('Producto eliminado exitosamente', 'success');
        } else {
            mostrarToast('Error al eliminar producto: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión al eliminar producto', 'error');
    }
}

// Formatear precio
function formatearPrecio(precio) {
    return parseFloat(precio).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Función global para usar en onclick (necesaria para compatibilidad)
window.abrirModalEditar = abrirModalEditar;
window.eliminarProducto = eliminarProducto;