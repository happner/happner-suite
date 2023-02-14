module.exports = class SecurityFacadeFactory {
  static createNewFacade(securityService) {
    const facade = {
      security: securityService.utilsService.buildBoundProxy(
        [
          'authorize',
          'generatePermissionSetKey',
          'generateToken',
          'revokeToken',
          'generateSession',
          'decodeToken',
          'checkTokenUserId',
          'checkRevocations',
          'checkIPAddressWhitelistPolicy',
          'verifyAuthenticationDigest',
          'matchPassword',
          'checkDisableDefaultAdminNetworkConnections',
        ],
        securityService
      ),
      users: securityService.utilsService.buildBoundProxy(
        [
          'getPasswordHash',
          'upsertUser',
          'upsertUserWithoutValidation',
          'deleteUser',
          'getUser',
          'getUserNoGroups',
          'listUsers',
          'listUserNamesByGroup',
          'listUsersByGroup',
          'getGroupMemberships',
          'listPermissions',
          'attachPermissions',
          'removePermission',
          'upsertPermission',
          'upsertPermissions',
          'userBelongsToGroups',
          'getGroupMemberships',
          'getGroupMemberships',
        ],
        securityService.users
      ),
      groups: securityService.utilsService.buildBoundProxy(
        [
          'upsertGroupWithoutValidation',
          'upsertGroup',
          'deleteGroup',
          'listGroups',
          'getGroup',
          'linkGroup',
          'unlinkGroup',
          'listPermissions',
          'upsertPermission',
          'removePermission',
        ],
        securityService.groups
      ),
      log: securityService.utilsService.buildBoundProxy(
        ['info', 'error', 'warn', 'trace', 'debug'],
        securityService.log
      ),
      utils: securityService.utilsService.buildBoundProxy(
        [
          'clone',
          'wildcardMatch',
          'checkPath',
          'removeLast',
          'computeiv',
          'asyncCallback',
          'escapeRegex',
          'wrapImmediate',
          'getMethodNames',
          'buildBoundProxy',
          'coerceArray',
        ],
        securityService.utilsService
      ),
      cache: securityService.utilsService.buildBoundProxy(
        ['getOrCreate', 'clear'],
        securityService.cacheService
      ),
      error: securityService.utilsService.buildBoundProxy(
        [
          'InvalidCredentialsError',
          'ValidationError',
          'SystemError',
          'ResourceNotFoundError',
          'AccessDeniedError',
        ],
        securityService.errorService
      ),
      system: securityService.utilsService.buildBoundProxy(
        ['name', 'getDescription'],
        securityService.systemService
      ),
    };
    return facade;
  }
};
