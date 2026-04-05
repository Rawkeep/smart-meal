import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8f6f0 0%, #e8e4d8 100%)",
          fontFamily: "'Outfit', sans-serif",
          padding: "20px",
        }}>
          <div style={{
            textAlign: "center",
            maxWidth: "400px",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "40px 30px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>
              Oops!
            </div>
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "22px",
              color: "#2c2c2c",
              marginBottom: "12px",
              fontWeight: 700,
            }}>
              Etwas ist schiefgelaufen
            </h1>
            <p style={{
              color: "#666",
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}>
              Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "linear-gradient(135deg, #E8943A, #D4782A)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                boxShadow: "0 4px 12px rgba(232,148,58,0.3)",
              }}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
