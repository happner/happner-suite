"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnerClusterCoreBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
function HappnerClusterCoreBuilder(Base) {
    return class HappnerClusterConfigurationBuilder extends Base {
        constructor(...args) {
            super(...args);
        }
        withClusterRequestTimeout(timeout) {
            this.set('cluster.requestTimeout', timeout, BaseBuilder.Types.NUMERIC);
            return this;
        }
        withClusterResponseTimeout(timeout) {
            this.set('cluster.responseTimeout', timeout, BaseBuilder.Types.NUMERIC);
            return this;
        }
        withDomain(domain) {
            this.set('domain', domain, BaseBuilder.Types.STRING);
            return this;
        }
    };
}
exports.HappnerClusterCoreBuilder = HappnerClusterCoreBuilder;
