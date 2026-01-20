import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <h1 className={styles.heroTitle}>
                    Secure Your Cloud <br /> Infrastructure
                </h1>
                <p className={styles.heroSubtitle}>
                    Complete visibility and security auditing for your cloud environments.
                    Powered by agentic AI to detect risks before they become threats.
                </p>

                {/* Integrated Provider Selection */}
                <div className={styles.providerSection}>
                    <div className={styles.cardRow}>
                        {/* GCP Card */}
                        <div className={styles.card} onClick={() => navigate("/gcp")}>
                            <div className={styles.cardIcon}>☁️</div>
                            <h3 className={styles.cardTitle}>Google Cloud</h3>
                        </div>

                        {/* AWS Card */}
                        <div className={styles.card} onClick={() => navigate("/aws")}>
                            <div className={styles.cardIcon}>🔶</div>
                            <h3 className={styles.cardTitle}>AWS</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>How It Works</h2>

                {/* Architecture Flow Visualization */}
                <div className={styles.architectureFlow}>
                    <div className={styles.flowContainer}>
                        <div className={styles.flowNode}>
                            <span className={styles.flowIcon}>👤</span>
                            <span className={styles.flowTitle}>User Creds</span>
                            <span className={styles.flowDesc}>Viewer Role</span>
                        </div>

                        <div className={styles.flowArrow}></div>

                        <div className={styles.flowNode}>
                            <span className={styles.flowIcon}>🔒</span>
                            <span className={styles.flowTitle}>Encryption</span>
                            <span className={styles.flowDesc}>Secure Tunnel</span>
                        </div>

                        <div className={styles.flowArrow}></div>

                        <div className={styles.flowNode}>
                            <span className={styles.flowIcon}>☁️</span>
                            <span className={styles.flowTitle}>Cloud Platform</span>
                            <span className={styles.flowDesc}>Process & Decrypt</span>
                        </div>
                    </div>

                    <div className={styles.flowContainer} style={{ marginTop: '30px' }}>
                        <div className={styles.flowNode}>
                            <span className={styles.flowIcon}>💻</span>
                            <span className={styles.flowTitle}>User Window</span>
                            <span className={styles.flowDesc}>Decrypt & View</span>
                        </div>

                        <div className={`${styles.flowArrow} ${styles.reverse}`}></div>

                        <div className={styles.flowNode}>
                            <span className={styles.flowIcon}>🛡️</span>
                            <span className={styles.flowTitle}>Encrypted Data</span>
                            <span className={styles.flowDesc}>Return Path</span>
                        </div>

                        {/* Visual connection to completed loop would be complex, keeping linear segments for clarity */}
                    </div>

                    <div className={styles.securityNote}>
                        <span>🔒</span>
                        Nothing is saved at backend. Your details and JSON files are totally safe.
                    </div>
                </div>
            </section>

            {/* Detailed Features Section */}
            <section className={styles.sectionBlock}>
                {/* Feature 1 */}
                <div className={styles.featureDetail}>
                    <div className={styles.featureContent}>
                        <h3>Deep Contextual Scanning</h3>
                        <p>
                            Traditional scanners overwhelm you with noise. Our Agentic AI understands the relationships between your resources
                            to identify true attack paths that matter.
                        </p>
                        <ul className={styles.featureList}>
                            <li><span className={styles.checkIcon}>✓</span> Graph-based relationship mapping</li>
                            <li><span className={styles.checkIcon}>✓</span> Attack path visualization</li>
                            <li><span className={styles.checkIcon}>✓</span> Risk prioritization based on exposure</li>
                        </ul>
                    </div>
                    <div className={styles.featureVisual}>
                        {/* CSS-based Graph Visual */}
                        <div className={styles.graphContainer}>
                            {/* Central Node */}
                            <div className={`${styles.graphNode} ${styles.center}`}></div>

                            {/* Satellite Nodes & Lines */}
                            <div className={styles.graphNode} style={{ top: '20%', left: '20%' }}></div>
                            <div className={styles.graphLine} style={{ top: '50%', left: '50%', width: '120px', transform: 'rotate(-135deg)' }}></div>

                            <div className={styles.graphNode} style={{ top: '20%', right: '20%' }}></div>
                            <div className={styles.graphLine} style={{ top: '50%', left: '50%', width: '120px', transform: 'rotate(-45deg)' }}></div>

                            <div className={styles.graphNode} style={{ bottom: '20%', left: '30%' }}></div>
                            <div className={styles.graphLine} style={{ top: '50%', left: '50%', width: '100px', transform: 'rotate(120deg)' }}></div>

                            <div className={styles.graphNode} style={{ bottom: '30%', right: '10%' }}></div>
                            <div className={styles.graphLine} style={{ top: '50%', left: '50%', width: '140px', transform: 'rotate(20deg)' }}></div>
                        </div>
                    </div>
                </div>

                {/* Feature 2 (Reversed) */}
                <div className={`${styles.featureDetail} ${styles.reversed}`}>
                    <div className={styles.featureContent}>
                        <h3>Automated Compliance</h3>
                        <p>
                            Stay audit-ready 24/7. Automatically map your cloud configuration to major compliance frameworks
                            without manual spreadsheet tracking.
                        </p>
                        <ul className={styles.featureList}>
                            <li><span className={styles.checkIcon}>✓</span> Real-time compliance scoring</li>
                            <li><span className={styles.checkIcon}>✓</span> PDF & Excel Audit Reports</li>
                            <li><span className={styles.checkIcon}>✓</span> Historical trend analysis</li>
                        </ul>
                    </div>
                    <div className={styles.featureVisual}>
                        {/* CSS-based Checklist Visual */}
                        <div className={styles.complianceList}>
                            <div className={styles.complianceItem}>
                                <span className={styles.complianceText}>S3 Bucket Encryption</span>
                                <span className={styles.complianceBadge}>PASS</span>
                            </div>
                            <div className={styles.complianceItem}>
                                <span className={styles.complianceText}>IAM MFA Enabled</span>
                                <span className={styles.complianceBadge}>PASS</span>
                            </div>
                            <div className={styles.complianceItem}>
                                <span className={styles.complianceText}>Clarinet Root Access</span>
                                <span className={styles.complianceBadge}>PASS</span>
                            </div>
                            <div className={styles.complianceItem}>
                                <span className={styles.complianceText}>Security Group Ports</span>
                                <span className={styles.complianceBadge}>PASS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance Standards */}
            <section className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Enterprise-Grade Compliance</h2>
                <div className={styles.complianceGrid}>
                    <div className={styles.complianceCard}>CIS Benchmarks</div>
                    <div className={styles.complianceCard}>NIST 800-53</div>
                    <div className={styles.complianceCard}>SOC 2 Type II</div>
                    <div className={styles.complianceCard}>ISO 27001</div>
                    <div className={styles.complianceCard}>HIPAA</div>
                    <div className={styles.complianceCard}>PCI DSS</div>
                </div>
            </section>

            {/* Testimonials */}
            <section className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Trusted by DevSecOps Teams</h2>
                <div className={styles.testimonialsGrid}>
                    <div className={styles.testimonialCard}>
                        <p className={styles.quote}>"The AI-driven insights have cut our triage time by 70%. It's like having a senior security engineer on the team 24/7."</p>
                        <div className={styles.author}>
                            <div className={styles.authorAvatar}></div>
                            <div>
                                <div className={styles.authorName}>Sarah Jenkins</div>
                                <div className={styles.authorRole}>CTO, TechFlow</div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.testimonialCard}>
                        <p className={styles.quote}>"Finally, a tool that doesn't just list problems but actually helps us fix them with context. The multi-cloud support is seamless."</p>
                        <div className={styles.author}>
                            <div className={styles.authorAvatar}></div>
                            <div>
                                <div className={styles.authorName}>David Chen</div>
                                <div className={styles.authorRole}>Lead DevOps, StreamLine</div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.testimonialCard}>
                        <p className={styles.quote}>"We passed our SOC2 audit in record time thanks to the automated compliance mapping. Essential tool for our stack."</p>
                        <div className={styles.author}>
                            <div className={styles.authorAvatar}></div>
                            <div>
                                <div className={styles.authorName}>Elena Rodriguez</div>
                                <div className={styles.authorRole}>VP Engineering, CloudScale</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                <div className={styles.faqGrid}>
                    {[
                        { q: "Do I need to install an agent?", a: "No, our platform connects via standard cloud APIs using a read-only IAM role. Zero impact on your workloads." },
                        { q: "Is my data secure?", a: "Absolutely. We only store metadata configuration states. Your actual customer data never leaves your environment." },
                        { q: "How fast is the scanning?", a: "Initial scans typically complete in under 2 minutes for average-sized environments. Real-time monitoring detects changes instantly." },
                        { q: "Can I ignore specific rules?", a: "Yes, you can create granular exceptions and suppressions for findings that are known or accepted risks." }
                    ].map((item, index) => (
                        <div
                            key={index}
                            className={`${styles.faqItem} ${openFaq === index ? styles.active : ''}`}
                        >
                            <div className={styles.faqHeader} onClick={() => toggleFaq(index)}>
                                {item.q}
                                <span>{openFaq === index ? '−' : '+'}</span>
                            </div>
                            <div className={styles.faqContent}>
                                <div className={styles.faqInner}>
                                    {item.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerBrand}>
                        <h4>CloudAudit</h4>
                        <p>The next-generation cloud security platform driven by Agentic AI. Secure your multi-cloud infrastructure with confidence.</p>
                    </div>

                    <div className={styles.footerLinks}>
                        <div className={styles.footerColumn}>
                            <h5>Product</h5>
                            <ul>
                                <li><a href="#">Features</a></li>
                                <li><a href="#">Integrations</a></li>
                                <li><a href="#">Pricing</a></li>
                                <li><a href="#">Changelog</a></li>
                            </ul>
                        </div>
                        <div className={styles.footerColumn}>
                            <h5>Resources</h5>
                            <ul>
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">API Reference</a></li>
                                <li><a href="#">Blog</a></li>
                                <li><a href="#">Community</a></li>
                            </ul>
                        </div>
                        <div className={styles.footerColumn}>
                            <h5>Company</h5>
                            <ul>
                                <li><a href="#">About</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Legal</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>&copy; 2026 Cloud Security Audit. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
