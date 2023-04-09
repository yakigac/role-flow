import React from "react";
import { ReactFlowProvider } from "reactflow";
import { SaveRestore } from "./components/SaveRestore";
import "reactflow/dist/style.css";

export default () => (
  <ReactFlowProvider>
    <SaveRestore />
  </ReactFlowProvider>
);
