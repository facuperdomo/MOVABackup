// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboardStyle.css";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { customFetch } from "../../utils/api";
import PaymentQR from "../paymentqr/PaymentQR"; // Asegúrate de que la ruta sea correcta

const Dashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showQR, setShowQR] = useState(false); // Estado para mostrar el QR
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false); // Estado de la caja

  // Verificar si la caja está abierta
  const checkCashRegisterStatus = async () => {
    try {
      const response = await customFetch("http://localhost:8080/api/cash-register/status");
      setIsCashRegisterOpen(response); // true o false
    } catch (error) {
      console.error("Error al verificar la caja:", error);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "ADMIN");
    fetchProducts();
    checkCashRegisterStatus();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await customFetch("http://localhost:8080/api/products");
      if (!Array.isArray(response)) throw new Error("La respuesta no es un array");

      const productsWithFixedImages = response.map((product) => ({
        ...product,
        image: product.image?.startsWith("data:image")
          ? product.image
          : `data:image/png;base64,${product.image}`,
        imageError: false,
      }));

      setProducts(productsWithFixedImages);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      const index = updatedCart.findIndex((item) => item.id === product.id);
      if (index !== -1) {
        updatedCart[index] = { ...updatedCart[index], quantity: updatedCart[index].quantity + 1 };
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }
      return updatedCart;
    });
    setTotal((prevTotal) => prevTotal + product.price);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.id !== productId);
      const newTotal = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setTotal(newTotal);
      return updatedCart;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  // Al abrir el popup, se resetea la vista para mostrar la selección de pago
  const handlePayment = () => {
    setShowPopup(true);
    setShowQR(false);
  };

  const closePopup = () => {
    setShowPopup(false);
    setShowQR(false);
  };

  const handleCashPayment = async () => {
    const saleData = {
      totalAmount: total,
      paymentMethod: "CASH",
      dateTime: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    try {
      await customFetch("http://localhost:8080/api/sales", {
        method: "POST",
        body: JSON.stringify(saleData),
      });
      console.log("Pago con efectivo confirmado y guardado en la base de datos");
      setShowPopup(false);
      setCart([]);
      setTotal(0);
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      alert("Ocurrió un error al procesar la venta. Inténtelo de nuevo.");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("popup-overlay")) {
      closePopup();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar (solo para admin) */}
      {isAdmin && (
        <div className="dashboard-sidebar" onClick={() => navigate("/admin-options")}>
          <ArrowLeft size={40} className="back-icon" />
        </div>
      )}

      {/* Contenedor para contenido y carrito */}
      <div className="content-wrapper">
        {/* Contenido principal */}
        <div className="main-content">
          <h2>Selección de Productos</h2>
          {loading ? (
            <p>Cargando productos...</p>
          ) : products.length === 0 ? (
            <p>No hay productos disponibles.</p>
          ) : (
            <div className="products-grid">
              {products.map((product, index) => (
                <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                  <div className="image-container">
                    {!product.imageError ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={() => {
                          setProducts((prevProducts) => {
                            const newProducts = [...prevProducts];
                            newProducts[index] = { ...product, imageError: true };
                            return newProducts;
                          });
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">Imagen no disponible</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel del carrito */}
        <div className="cart-panel">
          <h2>Carrito</h2>
          <div className="cart-list">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-text">
                  {item.name} x {item.quantity}
                </div>
                <button className="delete-button" onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <span className="total-amount">Total: ${total}</span>
            <button className="accept-sale" onClick={handlePayment} disabled={!isCashRegisterOpen}>
              Aceptar Venta
            </button>
            {!isCashRegisterOpen && (
              <p className="cash-register-closed">
                ⚠️ La caja está cerrada. No se pueden realizar ventas.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botón de logout para usuario no admin */}
      {!isAdmin && (
        <div className="logout-button-container">
          <div className="logout-button" onClick={handleLogout}>
            🚪
          </div>
        </div>
      )}

      {/* Popup de Pago */}
      {showPopup && (
        <div className="popup-overlay" onClick={handleOverlayClick}>
          <div className="popup-content">
            <X className="popup-close" size={32} onClick={closePopup} />
            {showQR ? (
              // Vista de pago con QR
              <>
                <h2>Escanea el código QR para pagar</h2>
                <PaymentQR amount={total} />
                <button onClick={() => setShowQR(false)}>Volver</button>
              </>
            ) : (
              // Vista de selección de método de pago
              <>
                <h2>Selecciona el Método de Pago</h2>
                <div className="popup-buttons">
                  <button className="popup-btn popup-btn-cash" onClick={handleCashPayment}>
                    💸 Pagar con Efectivo
                  </button>
                  <button
                    className="popup-btn popup-btn-qr"
                    onClick={() => {
                      console.log("Pago con QR seleccionado");
                      setShowQR(true);
                    }}
                  >
                    📱 Pagar con QR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
