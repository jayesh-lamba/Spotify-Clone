import "./Logout.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Logout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleConfirmLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleCancel = () => {
        navigate("/");
    };

    return (
        <main className="Logout-page">

            <div className="logout-card">

                {/* =================================
                    LOGO
                ================================= */}

                <div className="logout-logo">
                    ORIVIO
                </div>


                {/* =================================
                    ICON
                ================================= */}

                <div className="logout-icon">
                    <i className="fa-solid fa-right-from-bracket"></i>
                </div>


                {/* =================================
                    HEADING
                ================================= */}

                <h1>
                    Log out?
                </h1>

                <p className="logout-description">
                    Are you sure you want to log out of
                    your Orivio account?
                </p>


                {/* =================================
                    BUTTONS
                ================================= */}

                <div className="logout-actions">

                    <button className="confirm-logout" onClick={handleConfirmLogout}>
                        Log Out
                    </button>

                    <button className="cancel-logout" onClick={handleCancel}>
                        Cancel
                    </button>

                </div>

            </div>

        </main>
    );
}

export default Logout;