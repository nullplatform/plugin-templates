import { definePackage } from "@nullplatform/plugin/package";
import { description, name, version } from "../package.json";
import { target } from "./resources";

export default definePackage({ name, version, description, components: [target] });
