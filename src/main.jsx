import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeBackdrop } from "./components/ThemeBackdrop.jsx";
import { startThemeWatcher } from "./lib/theme.js";
import "./styles/themes.css";

startThemeWatcher();

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error, info) { this.setState({ error: error?.message + '\n' + info?.componentStack }); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, fontFamily: "monospace", whiteSpace: "pre-wrap", color: "red", background: "#111" }}>
      <strong>App Error:</strong>{"\n"}{this.state.error}
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
  <ThemeBackdrop />
  <App />
  </ErrorBoundary>
);
