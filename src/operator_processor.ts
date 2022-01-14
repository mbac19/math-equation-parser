import { assert } from "./error_utils";
import {
  BinaryOperator,
  Operator,
  OperatorPrecedenceMap,
  OperatorType,
  UnaryOperator,
} from "./operator";
import { LiteralMathASTNode, MathASTNodeType } from "./math_ast";
import { ParserDef } from "./parser_def";

export type CloseSymbol = "," | ")";

/**
 * A utility class that helps process adding operators.
 */
export class OperatorProcessor {
  private remainingFunctionOperands: number = 0;

  private typeAddedCurrentPass: MathASTNodeType | CloseSymbol | undefined;

  private typeAddedLastPass: MathASTNodeType | CloseSymbol | undefined;

  private isDone: boolean = false;

  private operators: Array<unknown> = [];

  private operatorStack: Array<Operator> = [];

  constructor(private readonly def: ParserDef) {}

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Called by the parser when it is ready to process a new token.
   */
  public startPass() {
    assert(!this.isDone, "Cannot add operator ctors after process is done");
    this.typeAddedLastPass = this.typeAddedCurrentPass;
    this.typeAddedCurrentPass = undefined;
  }

  /**
   * Declare that we are done processing this equation and get the resulting
   * syntax tree, if there are no errors.
   */
  public done() {
    // Loop through, pop, and resolve any operators still left on the stack.
    while (this.operatorStack.length > 0) {
      const payload = this._operatorPayloads.pop();
      assert(
        payload !== "(" && payload !== "StartOfFunction",
        "Invalid equation"
      );
      const numberOfParams = getNumberOfParams(payload);
      const params = this._operators.splice(-numberOfParams, numberOfParams);
      assert.equal(params.length, numberOfParams);
      this._operators.push(createOperator(payload, params));
    }
    assert(this._operators.length === 1, "Invalid equation");
    return this._operators[0];
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  public isUnaryMinus() {
    return (
      this.typeAddedLastPass !== MathASTNodeType.Literal &&
      this.typeAddedLastPass !== ")"
    );
  }

  // ---------------------------------------------------------------------------
  // PUBLIC PROCESSORS
  // ---------------------------------------------------------------------------

  public addVariable(variable: string) {
    this.typeAddedCurrentPass = MathASTNodeType.Variable;
    this._maybeImplicitMultiply();
    this._addOperator(variable);
  }

  public addLiteral(literal: LiteralMathASTNode) {
    this.typeAddedCurrentPass = MathASTNodeType.Literal;
    this._maybeImplicitMultiply();
    this._addOperator(literal);
  }

  public addOperator(operator: Operator) {
    switch (operator.type) {
      case OperatorType.Unary:
        this.addUnaryOperator(operator);
        break;

      case OperatorType.Binary:
        this.addBinaryOperator(operator, false);
        break;

      case OperatorType.Function:
        this.addFunctionOperator(operator);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private addUnaryOperator(operator: UnaryOperator) {
    this.typeAddedCurrentPass = MathASTNodeType.UnaryOperator;
    this._maybeImplicitMultiply();
    this.operatorStack.push(operator);
  }

  /**
   * Adds a binary payload and optionally add it silently. A payload added
   * silently will not record the current pass as adding a binary operator.
   * This is used to process implicit multiplication correctly.
   */
  private addBinaryOperator(operator: BinaryOperator, isSilent: boolean) {
    if (!isSilent) {
      this.typeAddedCurrentPass = MathASTNodeType.BinaryOperator;
    }

    const precedenceValue = getPrecedenceValue(payload);

    let lastPayload = this._operatorPayloads[this._operatorPayloads.length - 1];
    while (
      lastPayload &&
      lastPayload !== "(" &&
      lastPayload !== "StartOfFunction" &&
      // Left Associative
      ((this._config.isLeftAssociative &&
        getPrecedenceValue(lastPayload) >= precedenceValue) ||
        // Right Associative
        getPrecedenceValue(lastPayload) > precedenceValue)
    ) {
      this._operatorPayloads.pop();
      const numberOfParams = getNumberOfParams(lastPayload);
      const params = this._operators.splice(-numberOfParams, numberOfParams);
      const operator = createOperator(lastPayload, params);
      this._operators.push(operator);
      lastPayload = this._operatorPayloads[this._operatorPayloads.length - 1];
    }
    this._operatorPayloads.push(payload);
  }

  _addFunctionPayload(payload) {
    this._typeAddedCurrentPass = "FunctionOperator";
    this._maybeImplicitMultiply();
    this._operatorPayloads.push(payload, "StartOfFunction");
    this._remainingFunctionOperands = getNumberOfParams(payload);
  }

  public addOpenParens() {
    this._typeAddedCurrentPass = "(";
    this._maybeImplicitMultiply();
    this._operatorPayloads.push("(");
  }

  /**
   * The close symbol in the math equation means we've reach the end of some
   * expression (i.e. "," or ")")
   */
  public addCloseSymbol(closeSymbol: CloseSymbol) {
    this.typeAddedCurrentPass = closeSymbol;

    this._maybeImplicitMultiply();
    const isComma = commaOrCloseParens === ",";
    if (isComma) {
      this._remainingFunctionOperands -= 1;
    }
    // Continuously pop until reaching the corresponding parenthesis.
    let operatorPayload = this._operatorPayloads.pop();
    while (
      operatorPayload &&
      operatorPayload !== "(" &&
      operatorPayload !== "StartOfFunction"
    ) {
      const numberOfParams = getNumberOfParams(operatorPayload);
      const params = this._operators.splice(-numberOfParams, numberOfParams);
      const operatorName = operatorPayload.name;
      assert(
        params.length === numberOfParams,
        `Operator ${operatorName} needs ${numberOfParams} params`
      );
      this._operators.push(createOperator(operatorPayload, params));
      this._addedOperatorCurrentPass = true;
      operatorPayload = this._operatorPayloads.pop();
    }
    if (operatorPayload === "StartOfFunction" && !isComma) {
      // We processed everything from the start to the end of the function,
      // need to finish off processing this function call.

      // We encountered 1 more operand in this pass of textToProcess.
      this._remainingFunctionOperands -= 1;

      // StartOfFunction is always preceded by its FunctionOperator
      const functionPayload = this._operatorPayloads.pop();
      const numberOfFunctionParams = getNumberOfParams(functionPayload);
      assert.equal(functionPayload.type, "FunctionOperator");
      const params = this._operators.splice(
        -numberOfFunctionParams,
        numberOfFunctionParams
      );
      assert(
        params.length === numberOfFunctionParams,
        "Corrupt state: Not enough elements in resolvedOperators"
      );
      this._operators.push(createOperator(functionPayload, params));
    }
  }

  _maybeImplicitMultiply() {
    // Check for implicit multiplication.
    const leftTypes = [")", "Literal", "Variable"];
    const rightTypes = [
      "UnaryOperator",
      "FunctionOperator",
      "(",
      "Literal",
      "Variable",
    ];
    if (
      this._config.implicitMultiply &&
      leftTypes.indexOf(this._typeAddedLastPass) >= 0 &&
      rightTypes.indexOf(this._typeAddedCurrentPass) >= 0
    ) {
      this._addBinaryPayload(CoreOperators.Binary.prod, true);
    }
  }

  _addOperator(operator) {
    this._operators.push(operator);
    this._addedOperatorCurrentPass = true;
  }
}

// -----------------------------------------------------------------------------
// PRIVATE HELPERS
// -----------------------------------------------------------------------------

/**
 * Get the precedence value of the operator payload. This is used to decide
 * which operator should be processed first.
 *
 * NOTE: Do not handle function payloads here because functions get processed
 * immediately after the closing parenthesis, so they will never be compared
 * to other operators.
 */
function getPrecedenceValue(operator: Operator): number {
  switch (operator.type) {
    case OperatorType.Binary:
      return OperatorPrecedenceMap[operator.precedence];

    case OperatorType.Unary:
      // Always process unary operators first
      return Infinity;

    default:
      throw Error(
        `getPrecedenceValue has unhandled operator type: ${operator.type}`
      );
  }
}
