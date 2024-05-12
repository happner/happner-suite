let Mesh = require('../../../happner-2');
require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
    it('tests the connecting a client, ensures _mesh.happn.server.server available', async () => {
        const HappnerCluster = require('happner-cluster');

        let client = new Mesh.MeshClient({
            port: 55000,
        });

        let configs = getConfigs();

        let startedMembers = await Promise.all([
            // start the cluster - we have 3 horizontally scalable historian services wrapped in happner - each requiring 2 others to be available
            HappnerCluster.create(configs.at(0)),
            HappnerCluster.create(configs.at(1)),
            HappnerCluster.create(configs.at(2)),
        ]);
        await test.delay(5e3); // wait for stabilise

        await client.login();
        test.expect(await client.exchange.component.exec()).to.be(true);
        await client.disconnect();

        await Promise.all(
            startedMembers.map((member) => {
                return member.stop();
            })
        );
    });

    function getConfigs(){
        const Module = {
            exec: async function ($happn) {
                return $happn._mesh.happn.server.server != null;
            },
        };

        const configs = [{
            happn: {
                port: 0, // listen on any available port
                services: {
                    membership: {
                        config: {
                            deploymentId: 'production-81f8084e-7e09-4cd2-a875-8b3fc5d10711',
                            clusterName: 'my-historian-cluster',
                            serviceName: 'historian',
                            dependencies: {
                                historian: 2,
                            },
                        },
                    },
                },
            },
            components: {
                    component: {
                        accessLevel: 'mesh',
                    },
                },
            }
        ];

        // add 2 more configs with port set to 0
        configs.push(test.commons.clone(configs[0]));
        configs.push(test.commons.clone(configs[0]));

        // client default port, this will be our external facing member
        configs[0].happn.port = 55000;

        // add our module instance (after cloning) and return the config array
        return configs.map(config => {
            config.modules = {
                component: {
                    instance: Module
                }
            };
            return config;
        });
    }
});
