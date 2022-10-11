/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const FieldTypeValidator = require('../../lib/validators/field-type-validator');

describe(helper.testName(), function () {
  it('validates function as true when param length is correct', () => {
    const validator = new FieldTypeValidator();

    const testFunc1 = (msg, cb) => {
      cb(null, 'test-inbound-layer 1');
    };

    const testFunc2 = function (msg, cb) {
      cb(null, 'test-inbound-layer 2');
    };

    let result1 = validator.validateFunctionArgs(testFunc1, 2);
    let result2 = validator.validateFunctionArgs(testFunc2, 2);
    let result3 = validator.validateFunctionArgs(function testFunction3(msg, cb) {
      cb(null, 'test-inbound-layer 3');
    }, 2);

    helper.expect(result1.isValid).to.equal(true);
    helper.expect(result2.isValid).to.equal(true);
    helper.expect(result3.isValid).to.equal(true);
  });

  it('validates function as false if param length is incorrect', () => {
    const validator = new FieldTypeValidator();

    const testFunc1 = (msg) => {};

    let result1 = validator.validateFunctionArgs(testFunc1, 2);

    helper.expect(result1.isValid).to.equal(false);
  });

  it('validates function as false if not a function', () => {
    const validator = new FieldTypeValidator();

    const invalidFunc = { testField: 'testValue' };

    let result1 = validator.validateFunctionArgs(invalidFunc, 2);

    helper.expect(result1.isValid).to.equal(false);
    helper.expect(result1.error).to.contain('Unexpected token');
  });
});
