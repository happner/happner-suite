// require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
//   const restClient = require('restler');
//   let mesh, adminUser;
//   before('it sets up the mesh', setUpMesh);
//   before('it connects the admin user', connectAdminUser);
//   before('it creates the test user', createTestUser);
//   it('can do an http-rpc with as', async () => {
//     const token = adminUser.token;
//     test
//       .expect(
//         await testHttpRpc(
//           {
//             component: 'test',
//             method: 'doOnBehalfOfAllowed',
//             arguments: { param1: 1, param2: 2 },
//             as: 'testUser',
//           },
//           token
//         )
//       )
//       .to.eql('origin:testUser:1:2');
//   });

//   it('can do an exchange call with as', async () => {
//     test
//       .expect(await adminUser.exchange.test.doOnBehalfOfAllowed.as('testUser')(1, 2))
//       .to.eql('origin:testUser:1:2');
//   });

//   it('can do an exchange $call with as', async () => {
//     test
//       .expect(
//         await adminUser.exchange.$call({
//           component: 'test',
//           method: 'doOnBehalfOfAllowed',
//           arguments: [1, 2],
//           as: 'testUser',
//         })
//       )
//       .to.eql('origin:testUser:1:2');
//   });

//   it('fails to do an exchange call with as', async () => {
//     let errorMessage;
//     try {
//       await adminUser.exchange.test.doOnBehalfOfNotAllowed.as('testUser')(1, 2);
//     } catch (e) {
//       errorMessage = e.message;
//     }
//     test.expect(errorMessage).to.be('unauthorised');
//   });

//   it('can do an exchange call with as in component method', async () => {
//     test
//       .expect(await adminUser.exchange.test.doOnBehalfOfAllowedAs(1, 2))
//       .to.eql('origin:testUser:1:2');
//   });

//   it('fails to do an exchange call with as in component method', async () => {
//     let errorMessage;
//     try {
//       await adminUser.exchange.test.doOnBehalfOfNotAllowedAs(1, 2);
//     } catch (e) {
//       errorMessage = e.message;
//     }
//     test.expect(errorMessage).to.be('unauthorized');
//   });

//   it('fails to do an http-rpc with as', async () => {
//     const token = adminUser.token;
//     test
//       .expect(
//         await testHttpRpc(
//           {
//             component: 'test',
//             method: 'doOnBehalfOfNotAllowed',
//             arguments: { param1: 1, param2: 2 },
//             as: 'testUser',
//           },
//           token
//         )
//       )
//       .to.eql('error:unauthorized');
//   });
//   after('it disconnects the admin user', disconnectAdminUser);
//   after('tears down mesh', stopMesh);
//   async function setUpMesh() {
//     mesh = await test.Mesh.create({
//       name: 'asMesh',
//       port: 12358,
//       secure: true,
//       modules: {
//         test: {
//           instance: {
//             doOnBehalfOfAllowed: async function (param1, param2, $origin) {
//               return `origin:${$origin.username}:${param1}:${param2}`;
//             },
//             doOnBehalfOfNotAllowed: async function (_param1, _param2, $origin) {
//               return `unexpected:${$origin}`;
//             },
//             doOnBehalfOfAllowedAs: async function (param1, param2, $origin, $happn) {
//               return $happn.exchange.test.doOnBehalfOfAllowed.as($origin.username)(param1, param2);
//             },
//             doOnBehalfOfNotAllowedAs: async function (param1, param2, $origin, $happn) {
//               return $happn.exchange.test.doOnBehalfOfNotAllowed.as($origin.username)(
//                 param1,
//                 param2
//               );
//             },
//           },
//         },
//       },
//       components: {
//         test: {},
//       },
//     });
//   }
//   async function stopMesh() {
//     if (mesh) await mesh.stop();
//   }
//   async function connectAdminUser() {
//     adminUser = new test.Mesh.MeshClient({ port: 12358, secure: true });
//     await adminUser.login({
//       username: '_ADMIN',
//       password: 'happn',
//     });
//   }
//   async function disconnectAdminUser() {
//     if (adminUser) await adminUser.disconnect();
//   }
//   async function createTestUser() {
//     const testGroupUser = {
//       name: 'testGroup',
//       permissions: {
//         methods: {
//           '/asMesh/test/doOnBehalfOfAllowed': { authorized: true },
//           '/asMesh/test/doOnBehalfOfAllowedAs': { authorized: true },
//           '/asMesh/test/doOnBehalfOfNotAllowedAs': { authorized: true },
//         },
//       },
//     };
//     await adminUser.exchange.security.upsertGroup(testGroupUser);
//     const upsertedUser = await adminUser.exchange.security.upsertUser({
//       username: 'testUser',
//       password: 'testPassword',
//     });
//     await adminUser.exchange.security.linkGroupName('testGroup', upsertedUser);
//   }
//   async function testHttpRpc(requestInfo, token) {
//     return doRequest(
//       requestInfo.component,
//       requestInfo.method,
//       requestInfo.arguments,
//       requestInfo.as,
//       token
//     );
//   }
//   function doRequest(componentName, methodName, operationArguments, as, token) {
//     var operation = {
//       parameters: operationArguments,
//       as,
//     };
//     return new Promise((resolve, reject) => {
//       restClient
//         .postJson(
//           `http://127.0.0.1:12358/rest/method/${componentName}/${methodName}?happn_token=` + token,
//           operation
//         )
//         .on('complete', function (result) {
//           resolve(result.data);
//         })
//         .on('error', reject);
//     });
//   }
// });
