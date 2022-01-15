import { CoreOperators } from "./core_operators";
import { OperatorType } from "./operator";
import {
  makeLiteralNode,
  makeOperatorNode,
  makeVariableNode,
} from "./math_ast";
import { Parser } from "./parser";

describe("Parser", () => {
  it("parses number literals", () => {
    expect(Parser.parse("2")).toEqual(makeLiteralNode(2));
    expect(Parser.parse("1.12")).toEqual(makeLiteralNode(1.12));
    expect(Parser.parse(".12")).toEqual(makeLiteralNode(0.12));
  });

  it("parses the sum operation", () => {
    expect(Parser.parse("2 + 3")).toEqual(
      makeOperatorNode(CoreOperators.sum, [
        makeLiteralNode(2),
        makeLiteralNode(3),
      ])
    );
  });

  it("parses the minus operator", () => {
    expect(Parser.parse("2 - 3")).toEqual(
      makeOperatorNode(CoreOperators.diff, [
        makeLiteralNode(2),
        makeLiteralNode(3),
      ])
    );
  });

  it("parses assuming left associativity", () => {
    expect(Parser.parse("1 + 2 + 3")).toEqual(
      makeOperatorNode(CoreOperators.sum, [
        makeOperatorNode(CoreOperators.sum, [
          makeLiteralNode(1),
          makeLiteralNode(2),
        ]),
        makeLiteralNode(3),
      ])
    );
  });

  it("parses the multiplication operator", () => {
    expect(Parser.parse("2 * 3.1")).toEqual(
      makeOperatorNode(CoreOperators.prod, [
        makeLiteralNode(2),
        makeLiteralNode(3.1),
      ])
    );
  });

  it("parses the division operator", () => {
    expect(Parser.parse(".12 / .48")).toEqual(
      makeOperatorNode(CoreOperators.quot, [
        makeLiteralNode(0.12),
        makeLiteralNode(0.48),
      ])
    );
  });

  it("parses the exponent operator", () => {
    expect(Parser.parse("1.1 ^ 3")).toEqual(
      makeOperatorNode(CoreOperators.exp, [
        makeLiteralNode(1.1),
        makeLiteralNode(3),
      ])
    );
  });

  // it("gives multiplication higher precedence than addition", () => {
  //   expect(Parser.parse("1 + 2 * 3")).toEqual({
  //     type: OperatorType.Binary,
  //     name: "Sum",
  //     left: makeLiteralNode(1),
  //     right: {
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeLiteralNode(2),
  //       right: makeLiteralNode(3),
  //     },
  //   });
  //   expect(Parser.parse("1 * 2 + 3")).toEqual({
  //     type: OperatorType.Binary,
  //     name: "Sum",
  //     left: {
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeLiteralNode(1),
  //       right: makeLiteralNode(2),
  //     },
  //     right: makeLiteralNode(3),
  //   });
  // });
  // it("gives exponent higher precedence than multiplication", () => {
  //   expect(Parser.parse("1 + 2 ^ 3")).toEqual({
  //     type: OperatorType.Binary,
  //     name: "Sum",
  //     left: makeLiteralNode(1),
  //     right: {
  //       type: OperatorType.Binary,
  //       name: "Exponent",
  //       left: makeLiteralNode(2),
  //       right: makeLiteralNode(3),
  //     },
  //   });
  //   expect(Parser.parse("1 ^ 2 + 3")).toEqual({
  //     type: OperatorType.Binary,
  //     name: "Sum",
  //     left: {
  //       type: OperatorType.Binary,
  //       name: "Exponent",
  //       left: makeLiteralNode(1),
  //       right: makeLiteralNode(2),
  //     },
  //     right: makeLiteralNode(3),
  //   });
  // });
  // it("parses variables", () => {
  //   expect(Parser.parse("x")).toEqual(makeVariableNode("x"));
  //   expect(Parser.parse("1 + x")).toEqual({
  //     type: OperatorType.Binary,
  //     name: "Sum",
  //     left: makeLiteralNode(1),
  //     right: makeVariableNode("x"),
  //   });
  // });
  // it("parses parenthesis", () => {
  //   expect(Parser.parse("(1)")).toEqual(makeLiteralNode(1));
  //   expect(Parser.parse("((1))")).toEqual(makeLiteralNode(1));
  // });
  // it("sets precedence on operations within parenthesis", () => {
  //   expect(Parser.parse("(1 + 2) * 3")).toEqual({
  //     type: OperatorType.Binary,
  //     name: "Product",
  //     left: {
  //       type: OperatorType.Binary,
  //       name: "Sum",
  //       left: makeLiteralNode(1),
  //       right: makeLiteralNode(2),
  //     },
  //     right: makeLiteralNode(3),
  //   });
  // });
  // it("throws an error when a binary operation is used incorrectly", () => {
  //   expect(() => Parser.parse("1 *")).toThrow();
  // });
  // it("parses the log operator", () => {
  //   expect(Parser.parse("log(1)")).toEqual({
  //     type: OperatorType.Function,
  //     name: "Log10",
  //     params: [makeLiteralNode(1)],
  //   });
  // });
  // it("parses the pow operator", () => {
  //   expect(Parser.parse("pow(1, 2)")).toEqual({
  //     type: OperatorType.Function,
  //     name: "Exponent",
  //     params: [makeLiteralNode(1), makeLiteralNode(2)],
  //   });
  // });
  // it("parses the sin operator", () => {
  //   expect(Parser.parse("sin(0)")).toEqual({
  //     type: OperatorType.Function,
  //     name: "Sine",
  //     params: [makeLiteralNode(0)],
  //   });
  // });
  // it("parses the cosin operator", () => {
  //   expect(Parser.parse("cosin(0)")).toEqual({
  //     type: OperatorType.Function,
  //     name: "Cosine",
  //     params: [makeLiteralNode(0)],
  //   });
  // });
  // it("parses the tan operator", () => {
  //   expect(Parser.parse("tan(1)")).toEqual({
  //     type: OperatorType.Function,
  //     name: "Tangent",
  //     params: [makeLiteralNode(1)],
  //   });
  // });
  // it("configures to only allow certain variables", () => {
  //   const parser = new Parser({ validVariables: ["x", "y"] });
  //   expect(() => parser.parse("tan(x + y)")).not.toThrow();
  //   expect(() => parser.parse("tan(x + z)")).toThrow();
  // });
  // describe("implicit multiply", () => {
  //   it("works between variable and literal", () => {
  //     expect(Parser.parse("3x")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeLiteralNode(3),
  //       right: makeVariableNode("x"),
  //     });
  //     expect(Parser.parse("x3")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeVariableNode("x"),
  //       right: makeLiteralNode(3),
  //     });
  //   });
  //   it("works between variable and variable", () => {
  //     expect(Parser.parse("xy")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeVariableNode("x"),
  //       right: makeVariableNode("y"),
  //     });
  //   });
  //   it("works between complex operations", () => {
  //     expect(Parser.parse("x^2y^2")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: {
  //         type: OperatorType.Binary,
  //         name: "Exponent",
  //         left: makeVariableNode("x"),
  //         right: makeLiteralNode(2),
  //       },
  //       right: {
  //         type: OperatorType.Binary,
  //         name: "Exponent",
  //         left: makeVariableNode("y"),
  //         right: makeLiteralNode(2),
  //       },
  //     });
  //   });
  //   it("works with parenthesis", () => {
  //     expect(Parser.parse("(1)(2)")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeLiteralNode(1),
  //       right: makeLiteralNode(2),
  //     });
  //     expect(Parser.parse("1(2)")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeLiteralNode(1),
  //       right: makeLiteralNode(2),
  //     });
  //     expect(Parser.parse("(1)2")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Product",
  //       left: makeLiteralNode(1),
  //       right: makeLiteralNode(2),
  //     });
  //   });
  //   it("works with function operators", () => {
  //     expect(Parser.parse("xsin(y)")).toEqual({
  //       type: "BinaryOperator",
  //       name: "Product",
  //       left: makeVariableNode("x"),
  //       right: {
  //         type: "FunctionOperator",
  //         name: "Sine",
  //         params: [makeVariableNode("y")],
  //       },
  //     });
  //   });
  // });
  // it("configures to disable implicit multiply", () => {
  //   const parser = new Parser({ implicitMultiply: false });
  //   expect(() => parser.parse("xy")).toThrow();
  // });
  // it("configures to calculate with right associativity", () => {
  //   const parser = new Parser({ isLeftAssociative: false });
  //   expect(parser.parse("1 + 2 + 3")).toEqual({
  //     type: "BinaryOperator",
  //     name: "Sum",
  //     left: makeLiteralNode(1),
  //     right: {
  //       type: "BinaryOperator",
  //       name: "Sum",
  //       left: makeLiteralNode(2),
  //       right: makeLiteralNode(3),
  //     },
  //   });
  // });
  // it("supports custom unary operators", () => {
  //   const parser = new Parser();
  //   parser.addOperator({
  //     type: OperatorType.Unary,
  //     name: "Blah",
  //     symbol: "$",
  //   });
  //   expect(parser.parse("$1")).toEqual({
  //     type: OperatorType.Unary,
  //     name: "Blah",
  //     param: makeLiteralNode(1),
  //   });
  // });
  // describe("Unary Operators", () => {
  //   it("parses with parenthesis", () => {
  //     const parser = new Parser();
  //     parser.addOperator({
  //       type: OperatorType.Unary,
  //       name: "Blah",
  //       symbol: "$",
  //     });
  //     expect(parser.parse("$(1)")).toEqual({
  //       type: OperatorType.Unary,
  //       name: "Blah",
  //       param: makeLiteralNode(1),
  //     });
  //     expect(parser.parse("($1)")).toEqual({
  //       type: OperatorType.Unary,
  //       name: "Blah",
  //       value: [makeLiteralNode(1)],
  //     });
  //   });
  //   it("parses with highest precedence with binary operators", () => {
  //     const parser = new Parser();
  //     parser.addOperator({
  //       type: OperatorType.Unary,
  //       name: "Blah",
  //       symbol: "$",
  //     });
  //     expect(parser.parse("$1 + 2")).toEqual({
  //       type: OperatorType.Binary,
  //       name: "Sum",
  //       left: {
  //         type: OperatorType.Unary,
  //         name: "Blah",
  //         param: [makeLiteralNode(1)],
  //       },
  //       right: makeLiteralNode(2),
  //     });
  //     expect(parser.parse("1 + $2")).toEqual({
  //       type: "BinaryOperator",
  //       name: "Sum",
  //       left: Literal(1),
  //       right: {
  //         type: "UnaryOperator",
  //         name: "Blah",
  //         param: Literal(2),
  //       },
  //     });
  //     expect(parser.parse("$1 + 2 * 3")).toEqual({
  //       type: "BinaryOperator",
  //       name: "Sum",
  //       left: {
  //         type: "UnaryOperator",
  //         name: "Blah",
  //         param: Literal(1),
  //       },
  //       right: {
  //         type: "BinaryOperator",
  //         name: "Product",
  //         left: Literal(2),
  //         right: Literal(3),
  //       },
  //     });
  //   });
  //   it("parses with more complicated math statements nested inside", () => {
  //     const parser = new Parser();
  //     parser.addOperatorPayload({
  //       type: "UnaryOperator",
  //       name: "Blah",
  //       symbol: "$",
  //     });
  //     expect(parser.parse("$(1 + 2sin(x))")).toEqual({
  //       type: "UnaryOperator",
  //       name: "Blah",
  //       param: {
  //         type: "BinaryOperator",
  //         name: "Sum",
  //         left: Literal(1),
  //         right: {
  //           type: "BinaryOperator",
  //           name: "Product",
  //           left: Literal(2),
  //           right: {
  //             type: "FunctionOperator",
  //             name: "Sine",
  //             params: [Variable("x")],
  //           },
  //         },
  //       },
  //     });
  //   });
  //   it("parses with implicit multiplication", () => {
  //     const parser = new Parser();
  //     parser.addOperatorPayload({
  //       type: "UnaryOperator",
  //       name: "Blah",
  //       symbol: "$",
  //     });
  //     expect(parser.parse("2$1")).toEqual({
  //       type: "BinaryOperator",
  //       name: "Product",
  //       left: Literal(2),
  //       right: {
  //         type: "UnaryOperator",
  //         name: "Blah",
  //         param: Literal(1),
  //       },
  //     });
  //   });
  // });
  // it("parses the unary minus operator", () => {
  //   expect(Parser.parse("-3")).toEqual({
  //     type: "UnaryOperator",
  //     name: "Minus",
  //     param: Literal(3),
  //   });
  // });
  // it("parses the unary minus operator with parenthesis", () => {
  //   expect(Parser.parse("(-3)")).toEqual({
  //     type: "UnaryOperator",
  //     name: "Minus",
  //     param: Literal(3),
  //   });
  //   expect(Parser.parse("-(4)")).toEqual({
  //     type: "UnaryOperator",
  //     name: "Minus",
  //     param: Literal(4),
  //   });
  // });
  // it("parses the unary minus operator adjacent to binary operators", () => {
  //   expect(Parser.parse("4 - -3")).toEqual({
  //     type: "BinaryOperator",
  //     name: "Difference",
  //     left: Literal(4),
  //     right: {
  //       type: "UnaryOperator",
  //       name: "Minus",
  //       param: Literal(3),
  //     },
  //   });
  // });
  // it("parses consecutive unary minus operators", () => {
  //   expect(Parser.parse("--12")).toEqual({
  //     type: "UnaryOperator",
  //     name: "Minus",
  //     param: {
  //       type: "UnaryOperator",
  //       name: "Minus",
  //       param: Literal(12),
  //     },
  //   });
  // });
  // it("parses the unary minus operator acting on a function operator", () => {
  //   expect(Parser.parse("-sin(3.14)")).toEqual({
  //     type: "UnaryOperator",
  //     name: "Minus",
  //     param: {
  //       type: "FunctionOperator",
  //       name: "Sine",
  //       params: [Literal(3.14)],
  //     },
  //   });
  // });
});
