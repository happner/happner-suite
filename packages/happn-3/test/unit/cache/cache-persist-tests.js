const CachePersist = require('../../../lib/services/cache/cache-persist');
const test = require('../../__fixtures/utils/test_helper').create();

describe.skip('', () => {
	let instance;
	let mockName;
	let mockOpts;
	let mockDatastore;
	beforeEach('', () => {
		mockDatastore = {get: test.sinon.stub(), remove: test.sinon.stub(), upsert: test.sinon.stub()};
		instance = new CachePersist('mockName', {dataStore: mockDatastore});

	});
	afterEach('', () => {
		
	});
	context('constructor', () => {
		it('creates new instance', () => {
			test.chai.expect(instance.constructor.name).to.equal("CachePersist");
		});
	});
});