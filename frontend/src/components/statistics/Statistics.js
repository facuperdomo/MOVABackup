import React, { useState, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { customFetch } from "../../utils/api";
import "./statisticsStyle.css";

Chart.register(...registerables);

const Statistics = () => {
  const navigate = useNavigate();

  // Estados
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [selectedOption, setSelectedOption] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedOption === "sales") fetchSalesData();
    if (selectedOption === "top-products") fetchTopProducts();
    if (selectedOption === "cash-register") fetchCashRegisterHistory();
  }, [selectedFilter, selectedOption]);

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customFetch(
        `http://localhost:8080/api/statistics/sales?filter=${selectedFilter}`
      );

      if (!Array.isArray(response)) throw new Error("La respuesta del servidor no es un array");

      setSalesData(response);
    } catch (err) {
      console.error("❌ Error al obtener estadísticas de ventas:", err);
      setError("No se pudieron cargar las estadísticas.");
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customFetch(
        `http://localhost:8080/api/statistics/top-selling-drinks?filter=${selectedFilter}`
      );
  
      // Si el servidor devuelve 204, forzamos una respuesta vacía
      if (!response) {
        console.warn("⚠️ No hay productos vendidos en este periodo.");
        setTopProducts([]);
        return;
      }
  
      if (!Array.isArray(response)) {
        console.error("❌ Error: La respuesta no es un array. Respuesta:", response);
        throw new Error("La respuesta del servidor no es un array");
      }
  
      setTopProducts(response);
    } catch (err) {
      console.error("❌ Error al obtener productos más vendidos:", err);
      setError("Hubo un error al obtener los productos más vendidos.");
      setTopProducts([]); // Evita datos antiguos en caso de error
    } finally {
      setLoading(false);
    }
  };
  

  const fetchCashRegisterHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customFetch("http://localhost:8080/api/statistics/cash-register-history");

      if (!Array.isArray(response)) throw new Error("La respuesta del servidor no es un array");

      setCashRegisterHistory(response);
    } catch (err) {
      console.error("❌ Error al obtener historial de caja:", err);
      setError("No se pudo cargar el historial de caja.");
      setCashRegisterHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const salesChartData = {
    labels: salesData.map((sale) => sale.date),
    datasets: [
      {
        label: "Ventas",
        data: salesData.map((sale) => sale.total),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Función para generar colores aleatorios
  const generateColors = (numColors) => {
    return Array.from({ length: numColors }, () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`);
  };

  const colors = generateColors(topProducts.length);

  const topProductsChartData = {
    labels: topProducts.map((product) => product.name),
    datasets: [
      {
        label: "Cantidad vendida",
        data: topProducts.map((product) => product.totalSold),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="statistics-page">
      {/* Sidebar con opciones */}
      <div className="statistics-sidebar">
        <ArrowLeft size={40} className="back-icon" onClick={() => navigate("/dashboard")} />
        <button className={selectedOption === "sales" ? "active" : ""} onClick={() => setSelectedOption("sales")}>
          📊 Ventas
        </button>
        <button className={selectedOption === "top-products" ? "active" : ""} onClick={() => setSelectedOption("top-products")}>
          🍸 Tragos más vendidos
        </button>
        <button className={selectedOption === "cash-register" ? "active" : ""} onClick={() => setSelectedOption("cash-register")}>
          💰 Historial de caja
        </button>
      </div>

      {/* Contenido */}
      <div className="statistics-content">
        <h2>📊 Estadísticas</h2>

        {/* Filtros */}
        <div className="filter-container">
          {["day", "week", "month", "year"].map((filter) => (
            <button
              key={filter}
              className={selectedFilter === filter ? "active" : ""}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === "day" ? "📅 Día" : filter === "week" ? "📆 Semana" : filter === "month" ? "📅 Mes" : "📆 Año"}
            </button>
          ))}
        </div>

        {/* Estado de carga y errores */}
        {loading ? (
          <p>⌛ Cargando estadísticas...</p>
        ) : error ? (
          <p>❌ {error}</p>
        ) : selectedOption === "sales" ? (
          salesData.length > 0 ? (
            <div className="chart-container">
              <Bar data={salesChartData} />
            </div>
          ) : (
            <p>❌ No hay ventas realizadas en el período seleccionado.</p>
          )
        ) : selectedOption === "top-products" ? (
          topProducts.length > 0 ? (
            <div className="chart-container">
              <Pie data={topProductsChartData} />
            </div>
          ) : (
            <p>❌ No hay productos vendidos en el período seleccionado.</p>
          )
        ) : (
          <div className="cash-register-history">
            {cashRegisterHistory.length > 0 ? (
              cashRegisterHistory.map((entry, index) => (
                <div key={index} className="cash-register-entry">
                  <p>📆 {entry.date}</p>
                  <p>🔹 {entry.type === "OPEN" ? "Apertura" : "Cierre"} - 💰 Total: ${entry.total}</p>
                </div>
              ))
            ) : (
              <p>❌ No hay historial de caja disponible.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
