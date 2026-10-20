import { definePackage } from "@nullplatform/plugin/package";
import { description, name, version } from "../package.json";
import { connect, svc } from "./resources";

export default definePackage({ name, version, description, components: [svc, connect] });
