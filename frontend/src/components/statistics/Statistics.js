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
  const [selectedFilter, setSelectedFilter] = useState("day");  // 🔹 Valor por defecto: "día"
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
      const url = `http://localhost:8080/api/statistics/sales?filter=${selectedFilter}`;
      console.log(`🔍 Fetching sales data from: ${url}`);  // 🛠 Depuración

      const response = await customFetch(url);

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
      const url = `http://localhost:8080/api/statistics/top-selling-drinks?filter=${selectedFilter}`;
      console.log(`🔍 Fetching top products from: ${url}`);  // 🛠 Depuración

      const response = await customFetch(url);

      if (!response) {
        console.warn("⚠️ No hay productos vendidos en este periodo.");
        setTopProducts([]);
        return;
      }

      if (!Array.isArray(response)) throw new Error("La respuesta del servidor no es un array");

      setTopProducts(response);
    } catch (err) {
      console.error("❌ Error al obtener productos más vendidos:", err);
      setError("Hubo un error al obtener los productos más vendidos.");
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashRegisterHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8080/api/statistics/cash-register-history?filter=${selectedFilter}`;
      console.log(`🔍 Fetching cash register history from: ${url}`);  // 🛠 Depuración

      const response = await customFetch(url);

      if (!Array.isArray(response)) throw new Error("La respuesta del servidor no es un array");

      console.log("🟢 Historial de caja recibido:", response);
      setCashRegisterHistory(response);
    } catch (err) {
      console.error("❌ Error al obtener historial de caja:", err);
      setError("No se pudo cargar el historial de caja.");
      setCashRegisterHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha correctamente
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    return dateString.replace("T", " ").replace(/-/g, "/");
  };

  const salesChartData = {
    labels: salesData.map((sale) => formatDate(sale.date)),
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

      <div className="statistics-content">
        <h2>📊 Estadísticas</h2>

        {/* Filtros */}
        <div className="filter-container">
          {["day", "week", "month", "year"].map((filter) => (
            <button key={filter} className={selectedFilter === filter ? "active" : ""} onClick={() => setSelectedFilter(filter)}>
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
            <p>❌ No hay ventas en el período seleccionado.</p>
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
          cashRegisterHistory.length > 0 ? (
            <div className="cash-register-list">
              {cashRegisterHistory.map((entry, index) => (
                <div key={index} className="cash-register-card">
                  <p>📅 Apertura: {formatDate(entry.openDate)}</p>
                  <p>📅 Cierre: {formatDate(entry.closeDate)}</p>
                  <p>💰 Total: {entry.totalSales !== "Sin datos" ? `$${entry.totalSales}` : "No se registraron ventas"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>❌ No hay registros de caja en el período seleccionado.</p>
          )
        )}
      </div>
    </div>
  );
};

export default Statistics;
