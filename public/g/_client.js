import { createRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

const root = createRoot(document.getElementById("root"));

createFromFetch(fetch("/api/rsc" + window.location.search)).then((comp) => {
  console.log(comp);
  root.render(comp);
});
