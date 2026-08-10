import "./Premium.css";

function Premium() {
    return (
        <main className="Premium-page">

            {/* =================================
                HERO SECTION
            ================================= */}

            <section className="premium-hero">

                <div className="premium-hero-content">

                    <p className="premium-label">
                        ORIVIO PREMIUM
                    </p>

                    <h1>
                        Music without limits.
                    </h1>

                    <p className="premium-description">
                        Enjoy your music without ads, interruptions,
                        or limitations.
                    </p>

                    <button className="premium-main-button">
                        Get Premium
                    </button>

                </div>

            </section>


            {/* =================================
                WHY PREMIUM
            ================================= */}

            <section className="why-premium">

                <h2>Why Premium?</h2>

                <div className="benefits-grid">

                    <div className="benefit-card">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-ban"></i>
                        </div>

                        <h3>Ad-free Music</h3>

                        <p>
                            Enjoy your favorite songs without
                            annoying advertisements.
                        </p>

                    </div>


                    <div className="benefit-card">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-download"></i>
                        </div>

                        <h3>Download Music</h3>

                        <p>
                            Download your favorite songs and
                            listen to them offline.
                        </p>

                    </div>


                    <div className="benefit-card">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-headphones"></i>
                        </div>

                        <h3>High Quality Audio</h3>

                        <p>
                            Experience your music with
                            high-quality sound.
                        </p>

                    </div>


                    <div className="benefit-card">

                        <div className="benefit-icon">
                            <i className="fa-solid fa-forward"></i>
                        </div>

                        <h3>Unlimited Skips</h3>

                        <p>
                            Skip songs as much as you want
                            without any restrictions.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================
                PREMIUM PLANS
            ================================= */}

            <section className="premium-plans">

                <div className="plans-heading">

                    <h2>
                        Choose your plan
                    </h2>

                    <p>
                        Pick the plan that works best for you.
                    </p>

                </div>


                <div className="plans-grid">


                    {/* INDIVIDUAL */}

                    <div className="plan-card featured">

                        <div className="popular-badge">
                            Most Popular
                        </div>

                        <h3>Individual</h3>

                        <p className="plan-description">
                            Perfect for one person.
                        </p>

                        <div className="plan-price">
                            ₹119
                            <span>/month</span>
                        </div>

                        <div className="plan-divider"></div>

                        <ul>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Ad-free music
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Offline downloads
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                High quality audio
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Unlimited skips
                            </li>

                        </ul>

                        <button className="plan-button">
                            Get Started
                        </button>

                    </div>


                    {/* DUO */}

                    <div className="plan-card">

                        <h3>Duo</h3>

                        <p className="plan-description">
                            Perfect for two people.
                        </p>

                        <div className="plan-price">
                            ₹149
                            <span>/month</span>
                        </div>

                        <div className="plan-divider"></div>

                        <ul>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Ad-free music
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Offline downloads
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                High quality audio
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Two Premium accounts
                            </li>

                        </ul>

                        <button className="plan-button">
                            Get Started
                        </button>

                    </div>


                    {/* FAMILY */}

                    <div className="plan-card">

                        <h3>Family</h3>

                        <p className="plan-description">
                            Perfect for the whole family.
                        </p>

                        <div className="plan-price">
                            ₹179
                            <span>/month</span>
                        </div>

                        <div className="plan-divider"></div>

                        <ul>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Ad-free music
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Offline downloads
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                High quality audio
                            </li>

                            <li>
                                <i className="fa-solid fa-check"></i>
                                Up to six accounts
                            </li>

                        </ul>

                        <button className="plan-button">
                            Get Started
                        </button>

                    </div>

                </div>

            </section>


            {/* =================================
                FAQ
            ================================= */}

            <section className="premium-faq">

                <h2>Frequently Asked Questions</h2>


                <div className="faq-item">

                    <div className="faq-question">
                        <span>What is Orivio Premium?</span>

                        <i className="fa-solid fa-plus"></i>
                    </div>

                </div>


                <div className="faq-item">

                    <div className="faq-question">
                        <span>Can I cancel anytime?</span>

                        <i className="fa-solid fa-plus"></i>
                    </div>

                </div>


                <div className="faq-item">

                    <div className="faq-question">
                        <span>Can I download music?</span>

                        <i className="fa-solid fa-plus"></i>
                    </div>

                </div>


                <div className="faq-item">

                    <div className="faq-question">
                        <span>
                            What payment methods are supported?
                        </span>

                        <i className="fa-solid fa-plus"></i>
                    </div>

                </div>

            </section>


        </main>
    );
}

export default Premium;