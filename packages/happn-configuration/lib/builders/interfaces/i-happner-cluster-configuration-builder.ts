import { ICoreBuilder } from './i-core-builder';

export interface IHappnerClusterConfigurationBuilder extends ICoreBuilder {
  withClusterRequestTimeout(timeout: number);

  withClusterResponseTimeout(timeout: number);

  withDomain(domain: string);
}
