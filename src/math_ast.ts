export type Literal = number;

export type Variable = string;

export enum MathASTNodeType {
  Literal,
  Variable,
  UnaryOperator,
  BinaryOperator,
  FunctionOperator,
}

export interface LiteralMathASTNode {
  type: MathASTNodeType.Literal;
  name: "Literal";
  value: number;
}

export interface VariableMathASTNode {
  type: MathASTNodeType.Variable;
}

export type MathASTNode = LiteralMathASTNode | VariableMathASTNode;

export function makeLiteralNode(value: number): LiteralMathASTNode {
  return {
    type: MathASTNodeType.Literal,
    name: "Literal",
    value,
  };
}
