// A mapping's JSONata expression, imported as text (`with { type: "text" }`): bundled into the build and the compiled binary.
declare module "*.jsonata" {
  const expression: string;
  export default expression;
}
