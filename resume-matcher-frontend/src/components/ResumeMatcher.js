import React, { useState } from "react";
import axios from "axios";

const ResumeMatcher = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file && !jobDescription) {
      alert("Upload a resume or enter a job description.");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("resumeFile", file);
    formData.append("jobDescription", jobDescription);

    try {
      setLoading(true);
      const response = await axios.post(
        "https://resume-matcher-backend-ovd1.onrender.com/match",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Resume Matcher</h2>
      
      <input type="file" onChange={handleFileChange} accept=".pdf,.docx" style={styles.input} />
      
      <textarea
        placeholder="Paste job description here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        style={styles.textarea}
      />
      
      <button onClick={handleSubmit} disabled={loading} style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}>
        {loading ? "Matching..." : "Match Resume"}
      </button>

      {result && (
        <div style={styles.resultContainer}>
          <h3>Match Result:</h3>
          <p><strong>Match Percentage:</strong> {result.match_percentage}%</p>
          <p><strong>Missing Hard Skills:</strong> {result.missing_hard_skills.join(", ")}</p>
          <p><strong>Missing Soft Skills:</strong> {result.missing_soft_skills.join(", ")}</p>
          <h4>Resume Improvements:</h4>
          <ul>
            {result.resume_improvements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "50px auto",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  header: {
    fontSize: "24px",
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ccc",
    height: "100px",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    width: "100%",
    marginTop: "10px",
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
  },
  resultContainer: {
    marginTop: "20px",
    textAlign: "left",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "5px",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
};

export default ResumeMatcher;
