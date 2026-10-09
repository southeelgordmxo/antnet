import React from "react";
import { createRoot } from "react-dom/client";
import { AntNet } from "./components/sites/antnet/antnet";
const route = location.pathname.split("/").filter(Boolean)[0] || "live";
createRoot(document.getElementById("root")!).render(<AntNet view={route} />);
