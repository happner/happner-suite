import { ConfigBuilderFactory } from '../../lib/factories/config-builder-factory';
import { expect } from 'chai';

describe('configuration factory tests', function () {
  it('gets default happn-builder type with version 1.0.0', async () => {
    const versionContext = { happn: '1.0.0' };
    const builderFactory = ConfigBuilderFactory.create(versionContext);
    const builder = builderFactory.getHappnBuilder();
    expect(builder.builderType).to.equal('happn');
  });

  it('gets correct happn-cluster-builder type with version 1.0.0', async () => {
    const versionContext = { happn: '1.0.0', happnCluster: '1.0.0' };
    const builderFactory = ConfigBuilderFactory.create(versionContext);
    const builder = builderFactory.getHappnClusterBuilder<'1.0.0'>();

    expect(builder.builderType).to.equal('happn-cluster');
    expect(builder['withMembershipClusterName']).not.equal(undefined);
  });

  it(
    'expect membership builder functions to be undefined when happn-cluster-builder factory function ' +
      'called with version 1.0.0 but context is version 14.0.0',
    async () => {
      const versionContext = { happn: '1.0.0', happnCluster: '14.0.0' };
      const builderFactory = ConfigBuilderFactory.create(versionContext);

      // at design-time we set the type as 1.0.0 to get intellisense;
      // however this is not version 1.0.0 but version 14.0.0! (see the versionContext above)
      const builder = builderFactory.getHappnClusterBuilder<'1.0.0'>();

      expect(builder.builderType).to.equal('happn-cluster');
      expect(builder['withMembershipClusterName']).equal(undefined);
    }
  );

  it('gets correct happner-builder type with version 1.0.0', async () => {
    const versionContext = { happn: '1.0.0', happner: '1.0.0' };
    const builderFactory = ConfigBuilderFactory.create(versionContext);
    const builder = builderFactory.getHappnerBuilder<'1.0.0'>();

    expect(builder.builderType).to.equal('happner');
  });
});
