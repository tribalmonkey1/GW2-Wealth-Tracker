import React from "react";
import ReactDOM from "react-dom/client";
// Fonts are bundled (no Google Fonts request), so they work offline and every glyph is present.
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/crimson-pro/300.css";
import "@fontsource/crimson-pro/400.css";
import "@fontsource/crimson-pro/600.css";
import "@fontsource/crimson-pro/300-italic.css";
import "@fontsource/crimson-pro/400-italic.css";
import "@fontsource/cinzel-decorative/700.css";
import "@fontsource/pirata-one/400.css";
import "@fontsource/press-start-2p/400.css";
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
