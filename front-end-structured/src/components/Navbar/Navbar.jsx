import { useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import logo from "../../assets/cavideo2.mp4";

export default function Navbar() {
  const { pathname } = useLocation();

  let title = "Security Audit Dashboard";

  if (pathname.startsWith("/gcp")) title = "GCP Security Audit Dashboard";
  if (pathname.startsWith("/aws")) title = "AWS Security Audit Dashboard";

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <video src={logo} className={styles.logo} autoPlay loop muted />
      </div>

      <div className={styles.center}>
        <h1 className={styles.brand}>{title}</h1>
      </div>

      <div className={styles.menu}>
        <a className={styles.link} href="/">Home</a>
      </div>
    </nav>
  );
}
