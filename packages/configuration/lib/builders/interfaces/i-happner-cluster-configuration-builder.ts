export interface IHappnerClusterConfigurationBuilder {
  withClusterRequestTimeout(timeout: number);

  withClusterResponseTimeout(timeout: number);

  withDomain(domain: string);
}
