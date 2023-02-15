const WorkingAuthProvider = require("./workingAuth");
module.exports = class WorkingAuthProviderFactory extends require("../../../../../../lib/factories/security-auth-provider-factory") {
    static create() {
        return new WorkingAuthProviderFactory();
    }
    
    createAuthProvider(securityFacade, happnConfig, providerOptions) {
        return WorkingAuthProvider.create(securityFacade, happnConfig, providerOptions);
    }
}