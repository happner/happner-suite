require('../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
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
              address: '190.254.0.1',
              family: 'IPv4',
            },
            {
              address: '190.254.0.2',
              family: 'IPv4',
            },
          ],
        })
      )
      .to.eql('190.254.0.2');

    test
      .expect(
        getAddress({
          eth0: [
            {
              address: '192.254.1.1',
              family: 'IPv4',
            },
          ],
          eth1: [
            {
              address: '192.254.0.1', // this gets selected because the item on index 1 is IPv6
              family: 'IPv4',
            },
            {
              address: '192.254.0.2',
              family: 'IPv6',
            },
          ],
        })
      )
      .to.eql('192.254.0.1');

    test
      .expect(
        getAddress({
          eth0: [
            {
              address: '192.254.1.1', // not selected because not eth1
              family: 'IPv4',
            },
          ],
          eth1: [
            {
              address: '192.254.0.1', // this gets selected because the item on index 1 is a system address
              family: 'IPv4',
            },
            {
              address: '169.254.0.2',
              family: 'IPv4',
            },
          ],
        })
      )
      .to.eql('192.254.0.1');

    test
      .expect(
        getAddress({
          eth0: [
            {
              address: '192.254.1.1', // not selected because not eth1
              family: 'IPv4',
            },
          ],
          eth1: [
            {
              address: '192.254.0.1', // this gets selected because the item on index 1 is marked as internal
              family: 'IPv4',
            },
            {
              address: '129.254.0.2',
              family: 'IPv4',
              internal: true,
            },
          ],
        })
      )
      .to.eql('192.254.0.1');

    getAddress = testGetAddress(mockLogger, {
      NETWORK_INTERFACE_ID: 'eth1',
      NETWORK_INTERFACE: 0,
    });
    test
      .expect(
        getAddress({
          eth1: [
            {
              address: '190.254.0.1',
              family: 'IPv4',
            },
            {
              address: '190.254.0.2',
              family: 'IPv4',
            },
          ],
        })
      )
      .to.eql('190.254.0.1');

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
                address: '190.254.0.3',
                family: 'IPv4',
              },
              {
                address: '190.254.0.4',
                family: 'IPv4',
              },
            ],
          };
        },
      }
    );

    test.expect(getAddress()).to.eql('190.254.0.3');

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
                address: '190.254.0.3',
                family: 'IPv4',
              },
              {
                address: '190.254.0.4',
                family: 'IPv4',
              },
            ],
          };
        },
      }
    );

    test.expect(getAddress()).to.eql('190.254.0.4');

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
                family: 'IPv4',
              },
              {
                address: '169.254.0.4',
                family: 'IPv4',
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
                family: 'IPv4',
              },
              {
                address: '169.254.0.4',
                family: 'IPv4',
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
                family: 'IPv4',
              },
              {
                address: '169.254.0.4',
                family: 'IPv4',
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
          if (!interfaceItem.internal && [4, 'IPv4'].includes(interfaceItem.family)) {
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

  it('tests get-address - defaults', () => {
    testAddressCorrect('eth0', 'ens33');
    testAddressCorrect('ens33', 'eth0');
    testAddressCorrect('en0', 'eth0');
  });

  function testAddressCorrect(specifiedInterfaceId, badInterfaceId) {
    let logs = [];
    let mockLogger = {
      warn: (msg) => {
        logs.push(msg);
      },
    };
    let address = '191.120.100.100';
    let mockConfiguration = [
      mockLogger,
      {
        NETWORK_INTERFACE_ID: specifiedInterfaceId,
      },
      {
        networkInterfaces: () => {
          return {
            [badInterfaceId]: [
              {
                address: 'bad',
                family: 4,
              },
            ],
            [specifiedInterfaceId]: [
              {
                address,
                family: 4,
              },
            ],
          };
        },
      },
    ];
    const getAddress = testGetAddress(...mockConfiguration);
    test
      .expect(getAddress())
      .to.eql(mockConfiguration[2].networkInterfaces()[specifiedInterfaceId][0].address);
  }

  function testGetAddress(logger, env, os) {
    return require('../../lib/utils/get-address')(logger, env, os);
  }
});
