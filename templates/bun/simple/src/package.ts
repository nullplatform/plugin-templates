import { definePackage, execute } from "@nullplatform/plugin/package";
import { description, name, version } from "../package.json";
import { handle } from "./handler";

export default definePackage({ name, version, description, components: [execute(handle)] });
