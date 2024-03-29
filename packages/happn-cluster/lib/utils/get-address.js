/*
  return specific address on specified* NIC
  - if not found or is not suitable* will look for first address on specific NIC
  - if not found or is not suitable* will look through some default nics ('eth0', 'ens33', 'en0', 'en1')
  - if not found or is not suitable* will find the first nic with a suitable address
  * suitable addresses must be IPv4, and must not be a system address (ie: internal or private)
  * if not specified will find the first nic with a suitable* address
*/
module.exports = function (logger, env, os) {
  // env and os are only passed in for testing purposes
  logger = logger || console;
  os = os || require('os');
  env = env || process.env;
  return function (interfaces) {
    // interfaces are only passed in by tests
    interfaces = interfaces || os.networkInterfaces();
    let envInterfaceId = env['NETWORK_INTERFACE_ID'];

    // look for some common interface ids, prioritised by the defined id first
    let networkInterfaceId = [envInterfaceId, 'eth0', 'ens33', 'en0', 'en1'].find(
      (defaultInterface) => {
        return defaultInterface in interfaces;
      }
    );

    if (networkInterfaceId == null) {
      // couldnt find any - see what can be found
      return getFirstAvailableIPv4Address(envInterfaceId, logger, env, interfaces);
    }

    let interfaceItemIndex = parseInt(env['NETWORK_INTERFACE']);
    if (
      isNaN(interfaceItemIndex) || // user did not specify which address on the NIC to use
      interfaceItemIndex >= interfaces[networkInterfaceId].length || // user specified an out of bouunds address
      !isIPv4(interfaces[networkInterfaceId][interfaceItemIndex]) || // user specified a non IPv4 address
      isSystem(interfaces[networkInterfaceId][interfaceItemIndex])
    ) {
      // see what can be matched (as closely to the requirements as possible)
      return getFirstAvailableIPv4Address(networkInterfaceId, logger, env, interfaces);
    }
    // the user was spot-on in determining which NIC and address to use
    return interfaces[networkInterfaceId][interfaceItemIndex].address;
  };
};

function isIPv4(interfaceItem) {
  return [4, 'IPv4'].includes(interfaceItem.family);
}

function isSystem(interfaceItem) {
  return interfaceItem.internal || interfaceItem.address.indexOf('169.254') === 0;
}

function getFirstAvailableIPv4Address(interfaceId, logger, env, interfaces) {
  const configuredInterface = env['NETWORK_INTERFACE_ID'];
  const configuredIndex = env['NETWORK_INTERFACE'];
  const candidates = Object.keys(interfaces)
    .sort()
    .reduce((candidates, interfaceKey) => {
      let found = interfaces[interfaceKey];
      found.forEach((interfaceItem, interfaceItemIndex) => {
        if (isIPv4(interfaceItem) && !isSystem(interfaceItem)) {
          candidates.push({
            nic: interfaceKey,
            index: interfaceItemIndex,
            address: interfaceItem.address,
          });
        }
      });
      return candidates;
    }, []);

  if (candidates.length > 0) {
    let interfaceToUse =
      candidates.find((candidate) => candidate.nic === interfaceId) || candidates[0];
    if (
      configuredInterface != null &&
      (configuredInterface !== interfaceToUse.nic ||
        (configuredIndex != null && configuredIndex !== interfaceToUse.index))
    ) {
      // the user has intentionally configured the nic and index, but they do not match
      // what is on the system, so warn:
      logger.warn(
        `get address for SWIM or cluster: interface with id [${interfaceId}] not found or address index out of bounds - dynamically resolved to address [${interfaceToUse.address}] on NIC [${interfaceToUse.nic}]`
      );
    }
    return interfaceToUse.address;
  }

  throw new Error(`get address for SWIM or cluster: interface with id [${interfaceId}] not found`);
}
