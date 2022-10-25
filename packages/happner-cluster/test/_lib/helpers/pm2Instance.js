const fs = require('happn-commons').fs;
const HappnerCluster = require('../../..');

var fileName = process.argv[2];
let config = JSON.parse(fs.readFileSync(fileName));
HappnerCluster.create(config);
