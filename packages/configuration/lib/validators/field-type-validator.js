const acorn = require('acorn');

module.exports = class FieldTypeValidator {
  constructor() {}

  // NOTE: that there is a difference between arrow functions and regular functions, in terms of expressions vs declarations....
  // see:
  // https://stackoverflow.com/questions/49564001/unable-to-parse-function-with-esprima-acorn-unexpected-token
  // https://stackoverflow.com/questions/64869666/why-is-it-called-a-function-expression-and-not-a-function-declaration
  validateFunctionArgs(func, argLen) {
    let result = { isValid: null, error: null };

    try {
      const strFunc = func.toString();
      const parsed = acorn.parse(`(${strFunc})`, {
        ecmaVersion: 'latest',
      });
      let node = parsed.body[0].expression;

      result.isValid =
        (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') &&
        node.params.length === argLen;
    } catch (err) {
      result.isValid = false;
      result.error = err.message;
    }

    return result;
  }
};
