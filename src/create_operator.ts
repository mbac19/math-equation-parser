import { assert } from "./error_utils";

export function createOperator(payload, params) {
  switch (payload.type) {
    case "Literal":
      assert(
        params.length === 1 && typeof params[0] === "number",
        `Invalid literal parameters: ${params.toString()}`
      );
      return {
        type: "Literal",
        name: "Literal",
        value: params[0],
      };

    case "Variable":
      assert(
        params.length === 1 && typeof params[0] === "string",
        `Invalid variable parameters: ${params.toString()}`
      );
      return {
        type: "Variable",
        name: "Variable",
        variable: params[0],
      };

    case "UnaryOperator":
      assert(
        params.length === 1,
        "Unary Operator should have exactly 1 parameter"
      );
      return {
        type: "UnaryOperator",
        name: payload.name,
        param: params[0],
      };

    case "BinaryOperator":
      assert(
        params.length === 2,
        "Binary Operator should have exactly 2 parameters"
      );
      return {
        type: "BinaryOperator",
        name: payload.name,
        left: params[0],
        right: params[1],
      };

    case "FunctionOperator":
      assert(
        params.length === payload.numberOfParams,
        `Expected Function Operator to have ${payload.numberOfParams} params`
      );
      return {
        type: "FunctionOperator",
        name: payload.name,
        params,
      };

    default:
      throw Error(`createOperator not implemented for payload ${payload.type}`);
  }
}
