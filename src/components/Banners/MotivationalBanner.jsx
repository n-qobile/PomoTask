import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./MotivationalBanner.module.css";

const MotivationalBanner = ({ isVisible, trigger, taskTitle }) => {
  const [quote, setQuote] = useState("Stay focused and keep pushing forward!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && trigger > 0) {
      fetchQuote();
    }
  }, [isVisible, trigger]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = taskTitle ? { task: taskTitle } : {};
      const apiUrl = import.meta.env.VITE_API_URL || "http://pomotask-back.eu-north-1.elasticbeanstalk.com";
      const response = await axios.get(
        `${apiUrl}/api/motivate`,
        { params }
      );
      if (response.data.success) {
        setQuote(response.data.quote);
      } else {
        throw new Error("Failed to get quote");
      }
    } catch (err) {
      console.error("Failed to fetch motivation quote:", err);
      setError("Failed to load quote");
      // Keep the default quote on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.banner} ${!isVisible ? styles.hide : ""}`}>
      {loading ? (
        <p>Loading quote...</p>
      ) : error ? (
        <p>Failed to load quote</p>
      ) : (
        <p className={styles.quote}>{quote}</p>
      )}
    </div>
  );
};

export default MotivationalBanner;
