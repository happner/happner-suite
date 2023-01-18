"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
class PublisherConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withAcknowledgeTimeout(acknowledge) {
        this.set('config.publicationOptions.acknowledgeTimeout', acknowledge, BaseBuilder.Types.NUMERIC);
        return this;
    }
    withTimeout(timeout) {
        this.set('config.timeout', timeout, BaseBuilder.Types.NUMERIC);
        return this;
    }
}
exports.PublisherConfigBuilder = PublisherConfigBuilder;
