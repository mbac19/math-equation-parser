import { assert, MathSyntaxError } from "./error_utils";
import {
  BinaryOperator,
  FunctionOperator,
  Operator,
  OperatorType,
  UnaryOperator,
} from "./operator";
import { CoreOperators } from "./core_operators";
import { DefaultParserDef, ParserDef } from "./parser_def";
import {
  getLiteralClaimToken,
  getOperatorClaimToken,
  getVariableClaimToken,
} from "./get_claim_token";
import { MathASTNode } from "./math_ast";
import { CloseSymbol, OperatorProcessor } from "./operator_processor";
import { makeVariableNode } from ".";

/**
 * The unary minus operator is a special operator. We keep it separate from
 * other operators and the parser will need to reference it directly.
 */
const UnaryMinusOperator: UnaryOperator = {
  type: OperatorType.Unary,
  name: "Minus",
  symbol: "-",
};

export class Parser {
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
        // TODO: Would like to eventually support other number formats, such
        // as scientific notation.
        const literal = parseFloat(literalClaimToken.claim);
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
        const closeSymbol = textToProcess.charAt(0) as CloseSymbol;
        processor.addCloseSymbol(closeSymbol);
        textToProcess = textToProcess.slice(1);
        continue;
      }

      // Check if this is a unary operator.
      let isUnaryOperator = false;

      for (const operator of this.unaryOperators) {
        const claimToken = getOperatorClaimToken(operator, textToProcess);

        if (claimToken !== undefined) {
          isUnaryOperator = true;
          processor.addOperator(operator);
          textToProcess = claimToken.remainder;
          break; // break out of the inner for loop
        }
      }

      if (isUnaryOperator) {
        continue;
      }

      // Check for the unary minus operator.
      const unaryMinusClaimToken = getOperatorClaimToken(
        UnaryMinusOperator,
        textToProcess
      );

      if (
        unaryMinusClaimToken !== undefined &&
        processor.shouldProcessMinusAsUnary()
      ) {
        processor.addOperator(UnaryMinusOperator);
        textToProcess = unaryMinusClaimToken.remainder;
        continue;
      }

      // Check if this is a binary operator.
      let isBinaryOperator = false;

      for (const operator of this.binaryOperators) {
        const claimToken = getOperatorClaimToken(operator, textToProcess);

        if (claimToken !== undefined) {
          processor.addOperator(operator);
          textToProcess = claimToken.remainder;
          break; // break out of inner for loop.
        }
      }

      if (isBinaryOperator) {
        continue;
      }

      // Check if this is a function operator
      let isFunctionOperator = false;

      for (const operator of this.functionOperators) {
        const claimToken = getOperatorClaimToken(operator, textToProcess);

        if (claimToken !== undefined) {
          isFunctionOperator = true;
          processor.addOperator(operator);

          if (claimToken.remainder.charAt(0) !== "(") {
            throw new MathSyntaxError("Expected '(' after function operator");
          }

          textToProcess = claimToken.remainder.slice(1);
          break; // break out of inner for loop
        }
      }

      if (isFunctionOperator) {
        continue;
      }

      // Check if this is a variable.
      const variableClaimToken = getVariableClaimToken(
        this.def.validVariables,
        textToProcess
      );

      if (variableClaimToken !== undefined) {
        const variable = variableClaimToken.claim;
        const node = makeVariableNode(variable);
        processor.addVariable(variable);
        textToProcess = variableClaimToken.remainder;
        continue;
      }

      throw new MathSyntaxError(`Unexpected token: ${textToProcess.charAt(0)}`);
    }

    return processor.done();
  }
}
