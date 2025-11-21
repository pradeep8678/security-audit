import { useNavigate } from "react-router-dom";
import styles from "./ProviderSelect.module.css";

export default function ProviderSelect() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Choose your provider</h2>

      <div className={styles.cardRow}>
        
        {/* GCP */}
        <div className={styles.card} onClick={() => navigate("/gcp")}>
          <h3>Google Cloud Platform</h3>
        </div>

        {/* AWS */}
        <div className={styles.card} onClick={() => navigate("/aws")}>
          <h3>Amazon Web Services</h3>
        </div>

      </div>
    </div>
  );
}
