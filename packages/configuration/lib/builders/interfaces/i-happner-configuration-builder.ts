export interface IHappnerConfigurationBuilder {
  withDeferListen(defer: boolean);

  withListenFirst(listenFirst: boolean);

  beginComponent();

  beginEndpoint();

  beginModule();
}
