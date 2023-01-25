const path = require('path');
const MembershipConfigBuilder = require(path.resolve(
  __dirname,
  '../builders/happn/services/membership-config-builder.ts'
));
let mcb = new MembershipConfigBuilder();
