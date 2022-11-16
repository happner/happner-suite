/* eslint-disable no-console */
import { SecurityConfigBuilder } from '../../../../lib/builders/happn/services/security-config-builder';
import { expect } from 'chai';

describe('security configuration builder tests', function () {
  it('builds a security config object', () => {
    const mockActivateSessionManagement = true;
    const mockAccountLockoutAttempts = 5;
    const mockAccountLockoutEnabled = true;
    const mockAccountLockoutRetryInterval = 2000;
    const mockAdminGroupCustomData = 'admin group custom description';
    const mockAdminPassword = 'password123';
    const mockAdminPublicKey = 'publicKey3445';
    const mockAllowAnonymousAccess = false;
    const mockAuthProvider1Name = 'testProvider';
    const mockAuthProvider1Instance = createTestAuthProvider();

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

    const mockSessionActivityTTL = 1e2;
    const mockSessionTokenSecret = 'sessionTokenSecret123';

    const mockUpdateSubscriptionsOnSecurityDirectoryChanged = true;

    const builder = new SecurityConfigBuilder();

    const result = builder
      .withActivateSessionManagement(mockActivateSessionManagement)
      .withAccountLockoutAttempts(mockAccountLockoutAttempts)
      .withAccountLockoutEnabled(mockAccountLockoutEnabled)
      .withAccountLockoutRetryInterval(mockAccountLockoutRetryInterval)
      .withAdminPassword(mockAdminPassword)
      .withAdminPublicKey(mockAdminPublicKey)
      .withAdminGroupCustomData(mockAdminGroupCustomData)
      .withAllowAnonymousAccess(mockAllowAnonymousAccess)
      .withAuthProvider(mockAuthProvider1Name, mockAuthProvider1Instance)
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
      .withSessionActivityTTL(mockSessionActivityTTL)
      .withSessionTokenSecret(mockSessionTokenSecret)
      .withUpdateSubscriptionsOnSecurityDirectoryChanged(
        mockUpdateSubscriptionsOnSecurityDirectoryChanged
      )
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    expect(result.config.activateSessionManagement).to.equal(mockActivateSessionManagement);
    expect(result.config.accountLockout.attempts).to.equal(mockAccountLockoutAttempts);
    expect(result.config.accountLockout.enabled).to.equal(mockAccountLockoutEnabled);
    expect(result.config.accountLockout.retryInterval).to.equal(mockAccountLockoutRetryInterval);
    expect(result.config.adminUser.password).to.equal(mockAdminPassword);
    expect(result.config.adminUser.publicKey).to.equal(mockAdminPublicKey);
    expect(result.config.allowAnonymousAccess).to.equal(mockAllowAnonymousAccess);
    expect(result.config.authProviders[mockAuthProvider1Name]).to.equal(mockAuthProvider1Instance);
    expect(result.config.authProviders[mockAuthProvider1Name].testFunc()).to.equal(
      'test func called'
    );
    expect(result.config.defaultAuthProvider).to.equal(mockDefaultAuthProvider);
    expect(result.config.defaultNonceTTL).to.equal(mockDefaultNonceTTL);
    expect(result.config.disableDefaultAdminNetworkConnections).to.equal(
      mockDisableDefaultAdminNetworkConnections
    );
    expect(result.config.logSessionActivity).to.equal(mockLogSessionActivity);
    expect(result.config.lockTokenToLoginType).to.equal(mockLockTokenToLoginType);
    expect(result.config.lockTokenToUserId).to.equal(mockLockTokenToUserId);
    expect(result.config.pbkdf2Iterations).to.equal(mockPbkdf2Iterations);
    expect(result.config.profiles[0].name).to.equal(mockProfileName);
    expect(result.config.profiles[0].policy.ttl).to.equal(mockProfilePolicyTTL);
    expect(result.config.profiles[0].policy.inactivity_threshold).to.equal(
      mockProfilePolicyInactivityThreshold
    );
    expect(result.config.profiles[0].session[mockProfileSessionKey].$eq).to.equal(
      mockProfileSessionMatchOn
    );
    expect(result.config.sessionActivityTTL).to.equal(mockSessionActivityTTL);
    expect(result.config.sessionTokenSecret).to.equal(mockSessionTokenSecret);
    expect(result.config.updateSubscriptionsOnSecurityDirectoryChanged).to.equal(
      mockUpdateSubscriptionsOnSecurityDirectoryChanged
    );
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
