"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnerConfigurationBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const happn_configuration_builder_js_1 = require("../happn/happn-configuration-builder.js");
class HappnerConfigurationBuilder extends happn_configuration_builder_js_1.HappnConfigurationBuilder {
    #componentsConfigBuilder;
    #endpointsConfigBuilder;
    #modulesConfigBuilder;
    constructor(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder, componentsConfigBuilder, endpointsConfigBuilder, modulesConfigBuilder) {
        super(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder);
        this.#componentsConfigBuilder = componentsConfigBuilder;
        this.#endpointsConfigBuilder = endpointsConfigBuilder;
        this.#modulesConfigBuilder = modulesConfigBuilder;
    }
    withName(name) {
        this.set('name', name, super.Types.STRING);
        return this;
    }
    withDeferListen(defer) {
        this.set('deferListen', defer, super.Types.BOOLEAN);
        return this;
    }
    withListenFirst(listenFirst) {
        this.set('listenFirst', listenFirst, super.Types.BOOLEAN);
        return this;
    }
    beginComponent() {
        return this.#componentsConfigBuilder.beginComponent();
    }
    build() {
        const happnConfig = super.build();
        const happnerBuilder = new BaseBuilder();
        happnerBuilder.set('endpoints', this.#endpointsConfigBuilder, BaseBuilder.Types.OBJECT);
        happnerBuilder.set('modules', this.#modulesConfigBuilder, BaseBuilder.Types.OBJECT);
        happnerBuilder.set('components', this.#componentsConfigBuilder, BaseBuilder.Types.OBJECT);
        const happnerConfig = happnerBuilder.build();
        return { happn: happnConfig, ...happnerConfig };
    }
}
exports.HappnerConfigurationBuilder = HappnerConfigurationBuilder;
