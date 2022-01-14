import { assert } from "./error_utils";
import {
  BinaryOperator,
  FunctionOperator,
  Operator,
  OperatorType,
  UnaryOperator,
} from "./operator";
import { CoreOperators } from "./core_operators";
import { DefaultParserDef, ParserDef } from "./parser_def";
import { getArity } from "./get_arity";
import {
  getLiteralClaimToken,
  getOperatorClaimToken,
  getVariableClaimToken,
} from "./get_claim_token";
import { makeLiteralNode, MathASTNode } from "./math_ast";
import { OperatorProcessor } from "./operator_processor";

const UnaryMinusPayload: UnaryOperator = {
  type: OperatorType.Unary,
  name: "Minus",
  symbol: "-",
};

export default class Parser {
  private readonly def: ParserDef;

  private readonly unaryOperators: Array<UnaryOperator>;

  private readonly binaryOperators: Array<BinaryOperator>;

  private readonly functionOperators: Array<FunctionOperator>;

  static parse(text: string): MathASTNode {
    return new Parser().parse(text);
  }

  constructor(def: Partial<ParserDef> = DefaultParserDef) {
    this.def = { ...DefaultParserDef, ...def };

    const binaryOperators: Array<BinaryOperator> = [];
    const unaryOperators: Array<UnaryOperator> = [];
    const functionOperators: Array<FunctionOperator> = [];

    for (const operator of Object.values(CoreOperators)) {
      switch (operator.type) {
        case OperatorType.Binary:
          binaryOperators.push(operator);
          break;

        case OperatorType.Unary:
          unaryOperators.push(operator);
          break;

        case OperatorType.Function:
          functionOperators.push(operator);
          break;
      }
    }

    this.binaryOperators = binaryOperators;
    this.unaryOperators = unaryOperators;
    this.functionOperators = functionOperators;
  }

  public addOperator(operator: Operator) {
    switch (operator.type) {
      case OperatorType.Function:
        this.functionOperators.push(operator);
        break;

      case OperatorType.Binary:
        this.binaryOperators.push(operator);
        break;

      case OperatorType.Unary:
        this.unaryOperators.push(operator);
        break;
    }
  }

  public parse(text: string): MathASTNode {
    // Start by removing all spaces for easier parsing.
    let textToProcess = text.replace(/\s+/g, "");

    const processor = new OperatorProcessor(this.def);

    // If we are processing a function, then we need to count the number
    // of operands we are expecting for that function.
    while (textToProcess.length) {
      processor.startPass();

      // Check if we found a number literal.
      const literalClaimToken = getLiteralClaimToken(textToProcess);

      if (literalClaimToken !== undefined) {
        // Encountered a literal.
        const value = parseFloat(literalClaimToken.claim);
        const literal = makeLiteralNode(value);
        processor.addLiteral(literal);
        textToProcess = literalClaimToken.remainder;
        continue;
      }

      if (textToProcess.charAt(0) === "(") {
        textToProcess = textToProcess.slice(1);
        processor.addOpenParens();
        continue;
      }

      // Check if this is a end parenthesis or comma
      if (textToProcess.charAt(0) === ")" || textToProcess.charAt(0) === ",") {
        const closeVariable = textToProcess.charAt(0);
        processor.addCloseVariable(closeVariable);
        textToProcess = textToProcess.slice(1);
        continue;
      }

      // Check if this is a unary operator.
      let isUnaryOperator = false;
      for (let payload of this._unaryPayloads) {
        const claimToken = getClaimToken(payload, textToProcess);
        if (claimToken.claim.length > 0) {
          isUnaryOperator = true;
          processor.addPayload(payload);
          textToProcess = claimToken.remainder;
          break;
        }
      }
      if (isUnaryOperator) {
        continue;
      }

      // Check for the unary minus operator.
      const unaryMinusClaimToken = getClaimToken(
        UnaryMinusPayload,
        textToProcess
      );
      if (unaryMinusClaimToken.claim.length > 0 && processor.isUnaryMinus()) {
        processor.addPayload(UnaryMinusPayload);
        textToProcess = unaryMinusClaimToken.remainder;
        continue;
      }

      // Check if this is a binary operator.
      let isBinaryOperator = false;
      for (let payload of this._binaryPayloads) {
        const claimToken = getClaimToken(payload, textToProcess);
        if (claimToken.claim.length > 0) {
          isBinaryOperator = true;
          processor.addPayload(payload);
          textToProcess = claimToken.remainder;
          break;
        }
      }
      if (isBinaryOperator) {
        continue;
      }

      // Check if this is a function operator
      let isFunctionOperator = false;
      for (let payload of this._functionPayloads) {
        const claimToken = getClaimToken(payload, textToProcess);
        if (claimToken.claim.length > 0) {
          isFunctionOperator = true;
          processor.addPayload(payload);
          assert(
            claimToken.remainder.charAt(0) === "(", // Paren after function
            "Invalid Equation"
          );
          textToProcess = claimToken.remainder.slice(1);
          break;
        }
      }
      if (isFunctionOperator) {
        continue;
      }

      // Check if this is a variable.
      const variableClaimToken = getClaimToken(VariablePayload, textToProcess);
      if (variableClaimToken.claim.length > 0) {
        const rawVariable = variableClaimToken.claim;
        const variable = createOperator(VariablePayload, [rawVariable]);
        processor.addVariable(variable);
        textToProcess = variableClaimToken.remainder;
        continue;
      }

      assert(false, `Unexpected token: ${textToProcess.charAt(0)}`);
    }
    return processor.done();
  }
}
