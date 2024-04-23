import { Component, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

const root = createRoot(document.getElementById("root"), {
  onCaughtError: (error, errorInfo) => {
    console.error("Caught error", error, errorInfo.componentStack);
  },
});

/**
 * Fetch your server component stream from `/rsc`
 * and render results into the root element as they come in.
 */
createFromFetch(fetch("/api/rsc" + window.location.search)).then((comp) => {
  console.log(comp);
  // root.render(createElement(ErrorBoundary, null, comp));
  root.render(comp);
});

// class ErrorBoundary extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false };
//   }

//   static getDerivedStateFromError(error) {
//     // Update state so the next render will show the fallback UI.
//     return { hasError: true };
//   }

//   componentDidCatch(error, errorInfo) {
//     // You can also log the error to an error reporting service
//     console.log("-------------");
//     console.log(error, errorInfo.componentStack);
//     console.log("-------------");
//   }

//   render() {
//     if (this.state.hasError) {
//       // You can render any custom fallback UI
//       return createElement("div", null, "Something went wrong");
//     }

//     return this.props.children;
//   }
// }
