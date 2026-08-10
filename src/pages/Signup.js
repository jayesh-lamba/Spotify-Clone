import "./Signup.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!email || !password || !confirmPassword) {
            setErrorMsg("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters.");
            return;
        }

        const username = email.split("@")[0] || "User";

        setSubmitting(true);
        const result = await signup(username, email, password);
        setSubmitting(false);

        if (result && result.success) {
            navigate("/");
        } else {
            setErrorMsg(result?.message || "Signup failed. Please try again.");
        }
    };

    return (
        <main className="Signup-page">

            <div className="signup-card">

                {/* =================================
                    LOGO
                ================================= */}

                <div className="signup-logo">
                    ORIVIO
                </div>


                {/* =================================
                    HEADING
                ================================= */}

                <h1>
                    Create your account
                </h1>

                <p className="signup-subtitle">
                    Join Orivio and start listening to your
                    favorite music.
                </p>

                {errorMsg && (
                    <div style={{ color: "#ff6b6b", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>
                        {errorMsg}
                    </div>
                )}


                {/* =================================
                    SIGN UP FORM
                ================================= */}

                <form className="signup-form" onSubmit={handleSubmit}>

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


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />


                    <label>
                        Confirm password
                    </label>

                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />


                    <button
                        type="submit"
                        className="signup-button"
                        disabled={submitting}
                    >
                        {submitting ? "Creating Account..." : "Create Account"}
                    </button>

                </form>


                {/* =================================
                    DIVIDER
                ================================= */}

                <div className="signup-divider">

                    <span></span>

                    <p>OR</p>

                    <span></span>

                </div>


                {/* =================================
                    GOOGLE BUTTON
                ================================= */}

                <button className="google-button" type="button">

                    <i className="fa-brands fa-google"></i>

                    Continue with Google

                </button>


                {/* =================================
                    LOGIN
                ================================= */}

                <p className="login-text">

                    Already have an account?

                    <Link to="/login">
                        Log in
                    </Link>

                </p>

            </div>

        </main>
    );
}

export default Signup;