import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid } from "../utils/authUtils";

const PrivateRoute = ({ adminOnly = false }) => {
    const tokenValid = isTokenValid();
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    // Debugging para detectar el problema
    console.log("🔹 Token válido:", tokenValid);
    console.log("🔹 isAdmin:", isAdmin);

    if (!tokenValid) {
        return <Navigate to={adminOnly ? "/login" : "/loginUser"} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;