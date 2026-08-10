import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!email || !password) {
            setErrorMsg("Please enter email and password.");
            return;
        }

        setSubmitting(true);
        const result = await login(email, password);
        setSubmitting(false);

        if (result && result.success) {
            navigate("/");
        } else {
            setErrorMsg(result?.message || "Login failed. Please check credentials.");
        }
    };

    return (
        <main className="Login-page">

            <div className="login-card">

                {/* =================================
                    LOGO
                ================================= */}

                <div className="login-logo">
                    ORIVIO
                </div>


                {/* =================================
                    HEADING
                ================================= */}

                <h1>
                    Welcome back
                </h1>

                <p className="login-subtitle">
                    Log in to continue listening to your
                    favorite music.
                </p>

                {errorMsg && (
                    <div style={{ color: "#ff6b6b", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>
                        {errorMsg}
                    </div>
                )}


                {/* =================================
                    LOGIN FORM
                ================================= */}

                <form className="login-form" onSubmit={handleSubmit}>

                    <label>
                        Email address
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />


                    <div className="password-label">

                        <label>
                            Password
                        </label>

                        <a href="/forgot-password" onClick={(e) => e.preventDefault()}>
                            Forgot password?
                        </a>

                    </div>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />


                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={submitting}
                    >
                        {submitting ? "Logging In..." : "Log In"}
                    </button>

                </form>


                {/* =================================
                    DIVIDER
                ================================= */}

                <div className="login-divider">

                    <span></span>

                    <p>OR</p>

                    <span></span>

                </div>


                {/* =================================
                    GOOGLE LOGIN
                ================================= */}

                <button className="google-login-button" type="button">

                    <i className="fa-brands fa-google"></i>

                    Continue with Google

                </button>


                {/* =================================
                    SIGN UP
                ================================= */}

                <p className="signup-text">

                    Don't have an account?

                    <Link to="/signup">
                        Sign Up
                    </Link>

                </p>

            </div>

        </main>
    );
}

export default Login;