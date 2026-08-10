import "./Support.css";

function Support() {
    return (
        <main className="Support-page">

            {/* =================================
                HERO
            ================================= */}

            <section className="support-hero">

                <p className="support-label">
                    ORIVIO SUPPORT
                </p>

                <h1>
                    How can we help?
                </h1>

                <p className="support-description">
                    Find answers, solve problems, and get help
                    with your Orivio experience.
                </p>

                <div className="support-search">

                    <i className="fa-solid fa-magnifying-glass"></i>

                    <input
                        type="text"
                        placeholder="Search for help..."
                    />

                </div>

            </section>


            {/* =================================
                QUICK HELP
            ================================= */}

            <section className="quick-help">

                <h2>Quick Help</h2>

                <div className="help-grid">

                    <div className="help-card">

                        <div className="help-icon">
                            <i className="fa-solid fa-user"></i>
                        </div>

                        <h3>Account & Login</h3>

                        <p>
                            Manage your account, login and
                            password problems.
                        </p>

                    </div>


                    <div className="help-card">

                        <div className="help-icon">
                            <i className="fa-solid fa-play"></i>
                        </div>

                        <h3>Playback</h3>

                        <p>
                            Get help with songs, playback and
                            music controls.
                        </p>

                    </div>


                    <div className="help-card">

                        <div className="help-icon">
                            <i className="fa-solid fa-crown"></i>
                        </div>

                        <h3>Premium</h3>

                        <p>
                            Learn about Premium plans,
                            features and subscriptions.
                        </p>

                    </div>


                    <div className="help-card">

                        <div className="help-icon">
                            <i className="fa-solid fa-credit-card"></i>
                        </div>

                        <h3>Payments</h3>

                        <p>
                            Get help with payments,
                            subscriptions and billing.
                        </p>

                    </div>


                    <div className="help-card">

                        <div className="help-icon">
                            <i className="fa-solid fa-mobile-screen"></i>
                        </div>

                        <h3>App & Technical</h3>

                        <p>
                            Troubleshoot app and technical
                            problems.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================
                POPULAR QUESTIONS
            ================================= */}

            <section className="popular-questions">

                <h2>Popular Questions</h2>


                <div className="question-item">

                    <span>
                        Why isn't my music playing?
                    </span>

                    <i className="fa-solid fa-chevron-right"></i>

                </div>


                <div className="question-item">

                    <span>
                        How do I reset my password?
                    </span>

                    <i className="fa-solid fa-chevron-right"></i>

                </div>


                <div className="question-item">

                    <span>
                        How do I cancel Premium?
                    </span>

                    <i className="fa-solid fa-chevron-right"></i>

                </div>


                <div className="question-item">

                    <span>
                        How do I download music?
                    </span>

                    <i className="fa-solid fa-chevron-right"></i>

                </div>


                <div className="question-item">

                    <span>
                        How do I contact Orivio?
                    </span>

                    <i className="fa-solid fa-chevron-right"></i>

                </div>

            </section>


            {/* =================================
                CONTACT SUPPORT
            ================================= */}

            <section className="contact-support">

                <h2>Still need help?</h2>

                <p>
                    Our support team is here to help you.
                </p>

                <div className="contact-options">

                    <div className="contact-card">

                        <i className="fa-solid fa-envelope"></i>

                        <div>
                            <h3>Email Support</h3>

                            <p>
                                Get help from our support team.
                            </p>
                        </div>

                    </div>


                    <div className="contact-card">

                        <i className="fa-solid fa-bug"></i>

                        <div>
                            <h3>Report a Problem</h3>

                            <p>
                                Tell us about an issue you're
                                experiencing.
                            </p>
                        </div>

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Support;