let extension;
const readline = require('readline');
class TestHelper {
	constructor() {
		this.assert = require("assert");
		this.axios = require("axios");
        this.commons = require("happn-commons");
        this.async = this.commons.async;
        this.hyperid  = this.commons.hyperid;
        this.newid = this.commons.nanoid;
		this.why = require("why-is-node-running");
        this.semver = require('semver');
		this.delay = require("await-delay");
		this.expect = require("expect.js");
		this.nodeUtils = require("util");
		this.sinon = require("sinon");
		this.path = require("path");
		this.chai = require("chai");
		this.chai.use(require("chai-match"));
		this.chai.use(require("sinon-chai"));
		this.chai.use(require("chai-as-promised"));
		this.should = this.chai.should;
		this.moment = require("moment");
		this._ = this.commons._;
		this.fs = this.commons.fs;
		this.rimraf = this.commons.rimraf;
		this.callsites = require("callsites");
		this.spawn = require("child_process").spawn;
		this.gulp = require("gulp");
		this.karma = require("karma");
		this.bluebird = require("bluebird");
		this.request = this.nodeUtils.promisify(require('request'), { multiArgs: true });
		this.mockfs = require('mock-fs')
		require('chai').should();
	}
	static create() {
		return new TestHelper();
	}
	static extend(child) {
		extension = child;
		return TestHelper;
	}
	static describe(options, handler) {
		if (typeof options === 'function') {
		  handler = options;
		  options = {};
		}
		if (!options.timeout) options.timeout = 5e3;
		if (!options.depth) options.depth = 4;
		const test = new (extension || TestHelper)();
		let doDescribe = options.only ? describe.only : describe;
		if (options.skip) doDescribe = describe.skip;
		return doDescribe(test.testName(options.depth), function() {
		  this.timeout(options.timeout);
		  handler(test);
		}).timeout(options.timeout);
	}
    unlinkFiles (files) {
        files.forEach(file => {
            try {
            this.fs.unlinkSync(file);
            } catch (e) {
            //do nothing
            }
        });
    };
	getTestFile = () =>
		this.callsites()
			.find(
				(call) => (
					!call.getFileName().endsWith("test-helper.js") && 
					!call.getFileName().endsWith("test_helper.js")
				)
			)
			.getFileName();

	testName(depth) {
		const segments = this.getTestFile().split(this.path.sep);
		const calculatedDepth = isNaN(depth) ? 4 : depth;
		return segments
			.slice(segments.length - calculatedDepth)
			.join("/")
			.replace(".js", "");
	}

	async printOpenHandles(delayMs) {
		if (delayMs) await this.delay(delayMs);
		await this.why();
	}

	async printOpenHandlesAfter(delayMs) {
		after(() => {
			this.printOpenHandles(delayMs);
		});
	}

	constructMock(props = [], obj) {
		return props.reduce((mock, prop) => {
			this._.set(mock, prop.path, prop.value);
			return mock;
		}, obj || {});
	}

	log(msg, ...args) {
		console.log(msg);
		if (args.length > 0) {
			console.log(JSON.stringify(args, null, 2));
		}
	}

	async tryMethod(...args) {
		try {
			const instance = args.shift();
			const methodName = args.shift();
			return await instance[methodName].apply(instance, args);
		} catch (e) {
			return e.message;
		}
	}

	tempDirectory() {
		let directoryPath = this.path.resolve(__dirname, "../temp");
		this.fs.ensureDirSync(directoryPath);
		return directoryPath;
	}

	tryNonAsyncMethod(...args) {
		try {
			const instance = args.shift();
			const methodName = args.shift();
			return instance[methodName].apply(instance, args);
		} catch (e) {
			return e.message;
		}
	}

    randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

	compressedUUID() {
		return this.commons.uuid.v4().replace(/\-/g, '');
	}

	async lineCount(filePath) {
		if (!this.fs.existsSync(filePath)) {
		  return 0;
		}
		const reader = readline.createInterface({
		  input: this.fs.createReadStream(filePath),
		  crlfDelay: Infinity
		});
		let lineIndex = 0;
		// eslint-disable-next-line no-unused-vars
		for await (const _line of reader) {
		  lineIndex++;
		}
		return lineIndex;
	  }
}

module.exports = TestHelper;
