export interface IHappnerConfigurationBuilder {
  withName(name: string);

  withDeferListen(defer: boolean);

  withListenFirst(listenFirst: boolean);

  beginComponent();
}
