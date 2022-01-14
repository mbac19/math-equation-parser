import { Operator, OperatorType } from "./operator";

const FloatingPointNumberRegExp = /(^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/;

/**
 * A claim token looks at the entire remainder of the math equation that
 * has not yet been parsed, pulls off a set of characters in the front of
 * the equation that it would like to parse, and parse those tokens into
 * something that can be used to create an AST node.
 */
export interface ClaimToken {
  claim: string;
  remainder: string;
}

/**
 * Attempt to parse a number literal from the front of the math equation.
 * Returns the claim token if we were able to parse a literal,
 * otherwise undefined.
 */
export function getLiteralClaimToken(text: string): ClaimToken | undefined {
  const match = text.match(FloatingPointNumberRegExp);

  if (!match) {
    return;
  }

  return { claim: match[0], remainder: text.slice(match[0].length) };
}

/**
 * Attempt to parse a variable from the front of the math equation. Returns the
 * claim token if we were able to parse a variable, otherwise undefined.
 */
export function getVariableClaimToken(
  validVariables: Array<string> | undefined,
  text: string
): ClaimToken | undefined {
  if (!/^[a-zA-Z]/.test(text)) {
    return;
  }

  if (validVariables && validVariables.indexOf(text.charAt(0)) < 0) {
    return { claim: "", remainder: text };
  }
  return { claim: text.charAt(0), remainder: text.slice(1) };
}

/**
 * Attempts to parse an operator from the front of the math equation. Returns
 * the claim token if we were able to parse the operator, otherwise undefined.
 */
export function getOperatorClaimToken(
  operator: Operator,
  text: string
): ClaimToken | undefined {
  switch (operator.type) {
    case OperatorType.Unary: {
      const { symbol } = operator;
      if (text.startsWith(symbol)) {
        return { claim: symbol, remainder: text.slice(symbol.length) };
      }
      return { claim: "", remainder: text };
    }

    case OperatorType.Binary: {
      const { symbol } = operator;
      if (text.startsWith(symbol)) {
        return { claim: symbol, remainder: text.slice(symbol.length) };
      }
      return { claim: "", remainder: text };
    }

    case OperatorType.Function: {
      const { symbol } = operator;
      if (text.startsWith(symbol)) {
        return { claim: symbol, remainder: text.slice(symbol.length) };
      }
      return { claim: "", remainder: text };
    }
  }
}
