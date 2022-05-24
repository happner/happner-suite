require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  const NODE_MAJOR_VERSION = process.versions.node.split('.')[0];
  const ip4Family = NODE_MAJOR_VERSION < 18 ? 'IPv4' : 4;
  it('tests get-address', () => {
    let logs = [];
    let mockLogger = {
      warn: (msg) => {
        logs.push(msg);
      },
    };
    let getAddress = testGetAddress(mockLogger, {
      NETWORK_INTERFACE_ID: 'eth1',
      NETWORK_INTERFACE: 1,
    });
    test
      .expect(
        getAddress({
          eth1: [
            {
              address: '169.254.0.1',
            },
            {
              address: '169.254.0.2',
            },
          ],
        })
      )
      .to.eql('169.254.0.2');

    getAddress = testGetAddress(mockLogger, {
      NETWORK_INTERFACE_ID: 'eth1',
      NETWORK_INTERFACE: 0,
    });
    test
      .expect(
        getAddress({
          eth1: [
            {
              address: '169.254.0.1',
            },
            {
              address: '169.254.0.2',
            },
          ],
        })
      )
      .to.eql('169.254.0.1');

    getAddress = testGetAddress(
      mockLogger,
      {
        NETWORK_INTERFACE_ID: 'eth1',
        NETWORK_INTERFACE: 0,
      },
      {
        networkInterfaces: () => {
          return {
            eth1: [
              {
                address: '169.254.0.3',
              },
              {
                address: '169.254.0.4',
              },
            ],
          };
        },
      }
    );

    test.expect(getAddress()).to.eql('169.254.0.3');

    getAddress = testGetAddress(
      mockLogger,
      {
        NETWORK_INTERFACE_ID: 'eth1',
        NETWORK_INTERFACE: 1,
      },
      {
        networkInterfaces: () => {
          return {
            eth1: [
              {
                address: '169.254.0.3',
              },
              {
                address: '169.254.0.4',
              },
            ],
          };
        },
      }
    );

    test.expect(getAddress()).to.eql('169.254.0.4');

    getAddress = testGetAddress(
      mockLogger,
      {
        NETWORK_INTERFACE_ID: 'blah',
        NETWORK_INTERFACE: 'not a number',
      },
      {
        networkInterfaces: () => {
          return {
            blah: [
              {
                address: '169.254.0.3',
              },
              {
                address: '169.254.0.4',
              },
            ],
          };
        },
      }
    );

    let errMessage;
    try {
      getAddress();
    } catch (e) {
      errMessage = e.message;
    }

    test
      .expect(errMessage)
      .to.eql('get address for SWIM or cluster: interface with id [blah] not found');

    getAddress = testGetAddress(
      mockLogger,
      {
        NETWORK_INTERFACE_ID: 'blah',
        NETWORK_INTERFACE: 10,
      },
      {
        networkInterfaces: () => {
          return {
            blah: [
              {
                address: '169.254.0.3',
              },
              {
                address: '169.254.0.4',
              },
            ],
          };
        },
      }
    );

    try {
      getAddress();
    } catch (e) {
      errMessage = e.message;
    }

    test
      .expect(errMessage)
      .to.eql('get address for SWIM or cluster: interface with id [blah] not found');

    getAddress = testGetAddress(
      mockLogger,
      {
        NETWORK_INTERFACE_ID: 'eth2',
        NETWORK_INTERFACE: 0,
      },
      {
        networkInterfaces: () => {
          return {
            eth1: [
              {
                address: '169.254.0.3',
              },
              {
                address: '169.254.0.4',
              },
            ],
          };
        },
      }
    );

    let message;
    try {
      getAddress();
    } catch (e) {
      message = e.message;
    }
    test
      .expect(message)
      .to.be('get address for SWIM or cluster: interface with id [eth2] not found');
    const interfaces = require('os').networkInterfaces();
    const testInterface = Object.keys(interfaces).reduce(
      (testInterface, interfaceKey) => {
        let found = interfaces[interfaceKey];
        found.forEach((interfaceItem, interfaceItemIndex) => {
          if (!interfaceItem.internal && interfaceItem.family === ip4Family) {{
            testInterface = {
              id: interfaceKey,
              index: interfaceItemIndex,
              address: interfaceItem.address,
            };
          }
        });
        return testInterface;
      },
      { address: 'not found' }
    );

    getAddress = testGetAddress(mockLogger, {
      NETWORK_INTERFACE_ID: testInterface.id,
      NETWORK_INTERFACE: testInterface.index,
    });

    test.expect(getAddress()).to.eql(testInterface.address);
  });

  function testGetAddress(logger, env, os) {
    return require('../../lib/utils/get-address')(logger, env, os);
  }
});
