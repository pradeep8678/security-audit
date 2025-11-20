import styles from "./Navbar.module.css";
import logo from "../../assets/cavideo2.mp4";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      
      {/* LEFT — Logo */}
      <div className={styles.left}>
        <a
          href="https://cloudambassadors.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <video
            src={logo}
            className={styles.logo}
            autoPlay
            loop
            muted
            playsInline
          />
        </a>
      </div>

      {/* CENTER — Brand Title */}
      <div className={styles.center}>
        <h1 className={styles.brand}>GCP Security Audit Dashboard</h1>
      </div>

      {/* RIGHT — Menu Links */}
      <div className={styles.menu}>
        <a className={styles.link}>Dashboard</a>
        <a className={styles.link}>Audits</a>
        <a className={styles.link}>Reports</a>
      </div>

    </nav>
  );
}
