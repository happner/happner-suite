import BaseBuilder from 'happn-commons/lib/base-builder';
import { Constructor } from '../../types/mixin-types';
import { HealthConfigBuilder } from '../happn/services/health-config-builder';
import { OrchestratorConfigBuilder } from '../happn/services/orchestrator-config-builder';
import { ProxyConfigBuilder } from '../happn/services/proxy-config-builder';
import { ReplicatorConfigBuilder } from '../happn/services/replicator-config-builder';
import constants from '../../constants/config-constants';

const SERVICES_ROOT = constants.HAPPN_SERVICES_ROOT;

export function HappnClusterCoreBuilder<TBase extends Constructor>(Base: TBase) {
  return class HappnClusterBuilder extends Base {
    #healthConfigBuilder: HealthConfigBuilder;
    #orchestratorConfigBuilder: OrchestratorConfigBuilder;
    #proxyConfigBuilder: ProxyConfigBuilder;
    #replicatorConfigBuilder: ReplicatorConfigBuilder;

    constructor(...args: any[]) {
      super(...args);

      const container = args[0];

      this.#healthConfigBuilder = container.healthConfigBuilder;
      this.#orchestratorConfigBuilder = container.orchestratorConfigBuilder;
      this.#proxyConfigBuilder = container.proxyConfigBuilder;
      this.#replicatorConfigBuilder = container.replicatorConfigBuilder;

      this.set(`${SERVICES_ROOT}.health`, this.#healthConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(
        `${SERVICES_ROOT}.orchestrator`,
        this.#orchestratorConfigBuilder,
        BaseBuilder.Types.OBJECT
      );
      this.set(`${SERVICES_ROOT}.proxy`, this.#proxyConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(
        `${SERVICES_ROOT}.replicator`,
        this.#replicatorConfigBuilder,
        BaseBuilder.Types.OBJECT
      );
    }

    /*
      HEALTH
       */

    withHealthInterval(interval: number): HappnClusterBuilder {
      this.#healthConfigBuilder.withHealthInterval(interval);
      return this;
    }

    withHealthWarmupLimit(limit: number): HappnClusterBuilder {
      this.#healthConfigBuilder.withHealthWarmupLimit(limit);
      return this;
    }

    /*
    ORCHESTRATOR
     */

    withOrchestratorMinimumPeers(minimum: number): HappnClusterBuilder {
      this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
      return this;
    }

    withOrchestratorReplicatePath(path: string): HappnClusterBuilder {
      this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
      return this;
    }

    withOrchestratorStableReportInterval(interval: number): HappnClusterBuilder {
      this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
      return this;
    }

    withOrchestratorStabiliseTimeout(timeout: number): HappnClusterBuilder {
      this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
      return this;
    }

    /*
    PROXY
     */

    withProxyAllowSelfSignedCerts(allow: boolean): HappnClusterBuilder {
      this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
      return this;
    }

    withProxyCertPath(path: string): HappnClusterBuilder {
      this.#proxyConfigBuilder.withProxyCertPath(path);
      return this;
    }

    withProxyHost(host: string, port: number): HappnClusterBuilder {
      this.#proxyConfigBuilder.withProxyHost(host);
      this.#proxyConfigBuilder.withProxyPort(port);
      return this;
    }

    withProxyKeyPath(path: string): HappnClusterBuilder {
      this.#proxyConfigBuilder.withProxyKeyPath(path);
      return this;
    }

    withProxyTimeout(timeout: number): HappnClusterBuilder {
      this.#proxyConfigBuilder.withProxyTimeout(timeout);
      return this;
    }

    /*
    REPLICATOR
     */

    withReplicatorSecurityChangeSetReplicateInterval(interval: number): HappnClusterBuilder {
      this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
      return this;
    }
  };
}
