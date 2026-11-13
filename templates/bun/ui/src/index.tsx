import { defineUI } from "@nullplatform/ui-plugin-sdk";
import { widgets } from "./widgets";

// The plugin's entry: every widget manifest.json contributes, by its `widget`.
defineUI({ widgets });
