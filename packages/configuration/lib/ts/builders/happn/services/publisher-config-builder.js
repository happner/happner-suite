"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class PublisherConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withAcknowledgeTimeout(acknowledge) {
        this.set('config.publicationOptions.acknowledgeTimeout', acknowledge, BaseBuilder.Types.BOOLEAN);
        return this;
    }
    withTimeout(timeout) {
        this.set('config.timeout', timeout, BaseBuilder.Types.INTEGER);
        return this;
    }
}
exports.PublisherConfigBuilder = PublisherConfigBuilder;
//# sourceMappingURL=publisher-config-builder.js.map