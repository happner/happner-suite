import { ICoreBuilder } from './i-core-builder';

export interface IHappnerConfigurationBuilder extends ICoreBuilder {
  withDeferListen(defer: boolean);

  withListenFirst(listenFirst: boolean);

  beginComponent();

  beginEndpoint();

  beginModule();
}
