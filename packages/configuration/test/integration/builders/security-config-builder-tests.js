/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const SecurityConfigBuilder = require('../../../lib/builders/security-config-builder');

describe(helper.testName(), function () {
  it('builds a security config object', () => {
    const mockActivateSessionManagement = true;
    const mockAccountLockoutAttempts = 5;
    const mockAccountLockoutEnabled = true;
    const mockAccountLockoutRetryInterval = 2000;
    const mockAdminGroupName = 'adminGroup1';
    const mockAdminGroupPermissionPath1 = '/test';
    const mockAdminGroupPermissionPath1Action1 = 'testAction1';
    const mockAdminGroupPermissionPath1Action2 = 'testAction2';
    const mockAdminPassword = 'password123';
    const mockAdminPublicKey = 'publicKey3445';
    const mockAdminUserName = 'testUser';
    const mockAllowAnonymousAccess = false;
    const mockAuditPath = '/audit/path';
    const mockAuthProvider1Name = 'testProvider';
    const mockAuthProvider1Instance = createTestAuthProvider();

    const mockCookie = 'b654adef8979ceef21123';
    const mockCookieDomain = 'cookie.domain';
    const mockCookieName = 'testCookie';

    const mockDefaultAuthProvider = 'testProvider';
    const mockDefaultNonceTTL = 60000;
    const mockDisableDefaultAdminNetworkConnections = false;

    const mockLogSessionActivity = true;
    const mockLockTokenToLoginType = true;
    const mockLockTokenToUserId = true;
    // const mockLookup = {}; // TODO: check this

    const mockPbkdf2Iterations = 5;
    const mockProfileName = 'testProfile';
    const mockProfileSessionKey = 'type';
    const mockProfileSessionMatchOn = 1;
    const mockProfilePolicyTTL = 1e3;
    const mockProfilePolicyInactivityThreshold = Number.POSITIVE_INFINITY;

    const mockSecure = true;
    const mockSessionActivityTTL = 1e2;
    const mockSessionTokenSecret = 'sessionTokenSecret123';

    const mockUpdateSubscriptionsOnSecurityDirectoryChanged = true;

    const builder = new SecurityConfigBuilder();

    const result = builder
      .withActivateSessionManagement(mockActivateSessionManagement)
      .withAccountLockoutAttempts(mockAccountLockoutAttempts)
      .withAccountLockoutEnabled(mockAccountLockoutEnabled)
      .withAccountLockoutRetryInterval(mockAccountLockoutRetryInterval)
      .withAdminGroupName(mockAdminGroupName)
      .withAdminGroupPermission(mockAdminGroupPermissionPath1, mockAdminGroupPermissionPath1Action1)
      .withAdminGroupPermission(mockAdminGroupPermissionPath1, mockAdminGroupPermissionPath1Action2)
      .withAdminUsername(mockAdminUserName)
      .withAdminPassword(mockAdminPassword)
      .withAdminPublicKey(mockAdminPublicKey)
      .withAllowAnonymousAccess(mockAllowAnonymousAccess)
      .withAuditPath(mockAuditPath)
      .withAuthProvider(mockAuthProvider1Name, mockAuthProvider1Instance)
      .withHttpsCookie(mockCookieName, mockCookieDomain, mockCookie)
      .withDefaultAuthProvider(mockDefaultAuthProvider)
      .withDefaultNonceTTL(mockDefaultNonceTTL)
      .withDisableDefaultAdminNetworkConnections(mockDisableDefaultAdminNetworkConnections)
      .withLogSessionActivity(mockLogSessionActivity)
      .withLockTokenToLoginType(mockLockTokenToLoginType)
      .withLockTokenToUserId(mockLockTokenToUserId)
      .withPbkdf2Iterations(mockPbkdf2Iterations)
      .withProfile(
        mockProfileName,
        mockProfileSessionKey,
        mockProfileSessionMatchOn,
        mockProfilePolicyTTL,
        mockProfilePolicyInactivityThreshold
      )
      .withSecure(mockSecure)
      .withSessionActivityTTL(mockSessionActivityTTL)
      .withSessionTokenSecret(mockSessionTokenSecret)
      .withUpdateSubscriptionsOnSecurityDirectoryChanged(
        mockUpdateSubscriptionsOnSecurityDirectoryChanged
      )
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.config.activateSessionManagement).to.equal(mockActivateSessionManagement);
    helper.expect(result.config.accountLockout.attempts).to.equal(mockAccountLockoutAttempts);
    helper.expect(result.config.accountLockout.enabled).to.equal(mockAccountLockoutEnabled);
    helper.expect(result.config.accountLockout.retryInterval).to.equal(mockAccountLockoutRetryInterval);
    helper.expect(result.config.adminGroup.name).to.equal(mockAdminGroupName);
    helper
      .expect(result.config.adminGroup.permissions[mockAdminGroupPermissionPath1][0])
      .to.equal(mockAdminGroupPermissionPath1Action1);
    helper
      .expect(result.config.adminGroup.permissions[mockAdminGroupPermissionPath1][1])
      .to.equal(mockAdminGroupPermissionPath1Action2);
    helper.expect(result.config.adminUser.username).to.equal(mockAdminUserName);
    helper.expect(result.config.adminUser.password).to.equal(mockAdminPassword);
    helper.expect(result.config.adminUser.publicKey).to.equal(mockAdminPublicKey);
    helper.expect(result.config.allowAnonymousAccess).to.equal(mockAllowAnonymousAccess);
    helper.expect(result.config.auditPaths[0]).to.equal(mockAuditPath);
    helper.expect(result.config.authProviders[mockAuthProvider1Name]).to.equal(mockAuthProvider1Instance);
    helper
      .expect(result.config.authProviders[mockAuthProvider1Name].testFunc())
      .to.equal('test func called');
    helper.expect(result.config.cookieName).to.equal(mockCookieName);
    helper.expect(result.config.cookieDomain).to.equal(mockCookieDomain);
    helper.expect(result.config.httpsCookie).to.equal(mockCookie);
    helper.expect(result.config.defaultAuthProvider).to.equal(mockDefaultAuthProvider);
    helper.expect(result.config.defaultNonceTTL).to.equal(mockDefaultNonceTTL);
    helper
      .expect(result.config.disableDefaultAdminNetworkConnections)
      .to.equal(mockDisableDefaultAdminNetworkConnections);
    helper.expect(result.config.logSessionActivity).to.equal(mockLogSessionActivity);
    helper.expect(result.config.lockTokenToLoginType).to.equal(mockLockTokenToLoginType);
    helper.expect(result.config.lockTokenToUserId).to.equal(mockLockTokenToUserId);
    helper.expect(result.config.pbkdf2Iterations).to.equal(mockPbkdf2Iterations);
    helper.expect(result.config.profiles[0].name).to.equal(mockProfileName);
    helper.expect(result.config.profiles[0].policy.ttl).to.equal(mockProfilePolicyTTL);
    helper
      .expect(result.config.profiles[0].policy.inactivity_threshold)
      .to.equal(mockProfilePolicyInactivityThreshold);
    helper
      .expect(result.config.profiles[0].session[mockProfileSessionKey].$eq)
      .to.equal(mockProfileSessionMatchOn);
    helper.expect(result.config.secure).to.equal(mockSecure);
    helper.expect(result.config.sessionActivityTTL).to.equal(mockSessionActivityTTL);
    helper.expect(result.config.sessionTokenSecret).to.equal(mockSessionTokenSecret);
    helper
      .expect(result.config.updateSubscriptionsOnSecurityDirectoryChanged)
      .to.equal(mockUpdateSubscriptionsOnSecurityDirectoryChanged);
  });

  function createTestAuthProvider() {
    const Provider = class TestAuthProvider {
      testFunc() {
        return 'test func called';
      }
    };
    return new Provider();
  }
});
