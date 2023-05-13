const Happn = require('happn-3');
const Constants = require('../constants/all-constants');
const CredentialsBuilder = require('../builders/credentials-builder');
const commons = require('happn-commons');
module.exports = class HappnService extends require('events').EventEmitter {
  #happn;
  #config;
  #database;
  #log;
  #externalPort;
  #localClient;
  #processManagerService;
  #clusterCredentials;
  constructor(config, logger, processManagerService) {
    super();
    this.#config = commons._.clone(config);
    // external port
    this.#externalPort = this.#config?.port;
    // internal inter-cluster port
    this.#config.port = this.#config?.services?.membership?.config?.port || 0;
    this.#log = logger;
    this.#processManagerService = processManagerService;
  }
  static create(config, logger) {
    return new HappnService(config, logger);
  }
  get database() {
    return this.#database;
  }
  get localClient() {
    return this.#localClient;
  }
  get name() {
    return this.#happn.name;
  }
  get adminUsername() {
    return this.#happn.services.security.config.adminUser.username;
  }
  get adminPassword() {
    return this.#happn.services.security.config.adminUser.password;
  }
  get clusterCredentials() {
    return this.#clusterCredentials;
  }
  get secure() {
    return this.#happn.config.secure || this.#happn.services.security.config.secure || false;
  }
  get sessionService() {
    return this.#happn.services.session;
  }
  get securityService() {
    return this.#happn.services.security;
  }
  get subscriptionService() {
    return this.#happn.services.subscription;
  }
  get publisherService() {
    return this.#happn.services.publisher;
  }
  get services() {
    return this.#happn.services;
  }
  async upsertUser(username, password, publicKey, userPermissions, groups) {
    const user = {
      username,
      password,
      publicKey,
      permissions: userPermissions,
    };
    const upsertedUser = await this.#happn.services.security.users.upsertUser(user);
    if (groups?.length > 0) {
      for (let groupName of groups) {
        await this.#happn.services.security.groups.linkGroup({ name: groupName }, upsertedUser);
      }
    }
  }
  async start(membershipService, proxyService) {
    this.#config.services.proxy.instance = proxyService;
    this.#config.services.membership.instance = membershipService;
    // we defer listening so we dont miss authentic and disconnect events
    this.#config.deferListen = true;
    this.#happn = await Happn.service.create(this.#config);
    this.#happn.services.session.on(
      Constants.EVENT_KEYS.HAPPN_SESSION_AUTHENTICATE,
      this.#onConnectionFrom.bind(this)
    );
    this.#happn.services.session.on(
      Constants.EVENT_KEYS.HAPPN_SESSION_DISCONNECT,
      this.#onDisconnectionFrom.bind(this)
    );
    this.#happn.services.security.on(
      Constants.EVENT_KEYS.HAPPN_SECURITY_DATA_CHANGED,
      this.#onSecurityDirectoryChanged.bind(this)
    );

    this.#database = this.#happn.services.data;
    await this.#assignClusterCredentials();
    this.#localClient = await this.#createLocalClient();
    await this.#happn.listen();
    proxyService.setupAddressesAndPorts(this.#externalPort);
    this.emit(Constants.EVENT_KEYS.HAPPN_SERVICE_STARTED);
  }

  async stop() {
    await this.#happn?.stop();
    this.emit(Constants.EVENT_KEYS.HAPPN_SERVICE_STOPPED);
  }

  async #createLocalClient() {
    return await this.#happn.services.session.localClient(this.#clusterCredentials);
  }

  async #assignClusterCredentials() {
    const credentialsBuilder = CredentialsBuilder.create();
    if (this.secure) {
      const membershipConfig = this.#config.services.membership.config;
      if (membershipConfig.clusterUsername) {
        if (
          !membershipConfig.clusterPassword &&
          !(membershipConfig.clusterPublicKey && membershipConfig.clusterPrivateKey)
        ) {
          throw new Error(
            `invalid credentials configuration, requires clusterPassword or keypair config: clusterPublicKey and clusterPrivateKey`
          );
        }

        await this.upsertUser(
          membershipConfig.clusterUsername,
          membershipConfig.clusterPassword,
          membershipConfig.clusterPublicKey,
          {
            '*': {
              actions: ['*'],
            },
          }
        );
        credentialsBuilder.withUsername(membershipConfig.clusterUsername);
        if (membershipConfig.clusterPassword) {
          credentialsBuilder.withPassword(membershipConfig.clusterPassword);
        }
        if (membershipConfig.clusterPublicKey) {
          credentialsBuilder
            .withPublicKey(membershipConfig.clusterPublicKey)
            .withPrivateKey(membershipConfig.clusterPrivateKey);
        }
      } else {
        const adminUserConfig = this.#happn.services.security.config.adminUser;
        credentialsBuilder
          .withUsername(adminUserConfig.username)
          .withPassword(adminUserConfig.password);
      }
    }
    this.#clusterCredentials = credentialsBuilder.build();
  }

  #onConnectionFrom(data) {
    if (!data?.info?.clusterName || data.info.clusterName !== this.clusterName) return;
    this.#log.debug('connect from (<-) %s/%s', data.info.clusterName, data.info.name);
    this.emit('peer-connected', data.info);
  }

  #onDisconnectionFrom(data) {
    if (!data?.info?.clusterName || data.info.clusterName !== this.clusterName) return;
    this.#log.debug('disconnect from (<-) %s/%s', data.info.clusterName, data.info.name);
    this.emit('peer-disconnected', data.info);
  }

  #onSecurityDirectoryChanged(changes) {
    this.emit(Constants.EVENT_KEYS.HAPPN_SECURITY_DIRECTORY_CHANGED, changes);
  }

  async securityDirectoryChanged(whatHappnd, changedData, additionalInfo) {
    try {
      await this.#happn.services.security.dataChanged(whatHappnd, changedData, additionalInfo);
    } catch (e) {
      this.#processManagerService.fatal(`failed updating securit directory change`);
    }
  }
};
