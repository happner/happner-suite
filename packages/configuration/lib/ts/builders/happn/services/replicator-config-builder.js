"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicatorConfigBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
class ReplicatorConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withReplicatorSecurityChangeSetReplicateInterval(interval) {
        this.set(`config.securityChangesetReplicateInterval`, interval, BaseBuilder.Types.INTEGER);
        return this;
    }
}
exports.ReplicatorConfigBuilder = ReplicatorConfigBuilder;
;
//# sourceMappingURL=replicator-config-builder.js.map