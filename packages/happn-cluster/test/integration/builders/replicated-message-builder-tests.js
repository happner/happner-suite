/* eslint-disable no-unused-vars */
require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  const ReplicatedMessageBuilder = require('../../../lib/builders/replicated-message-builder');
  it('is to build a replicated message pojo', function () {
    const peerInfoPojo = ReplicatedMessageBuilder.create()
      .withDataAndMeta(
        {
          test: 'data',
        },
        {
          sessionId: 'sessionId',
          action: '/action@SET',
          path: 'path',
          publicationId: 'test-publicationId',
        }
      )
      .build();
    test.expect(peerInfoPojo).to.eql({
      session: {
        id: 'sessionId',
      },
      request: {
        action: 'action',
        path: 'path',
        data: {
          test: 'data',
        },
        eventId: 'publicationId',
        options: {
          noCluster: true, // don't emit back into cluster
          meta: {},
        },
      },
      response: {
        data: { test: 'data' },
        _meta: {
          sessionId: 'sessionId',
          action: 'action',
          path: 'path',
          publicationId: 'test-publicationId',
        },
        action: 'action',
      },
    });
  });
});
