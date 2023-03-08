import { ConfigBuilderFactory } from '../../lib/factories/config-builder-factory';
import { expect } from 'chai';

describe('configuration factory tests', function () {
  it('gets happn-builder', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnBuilder();
    expect(builder.builderType).to.equal('happn');
  });

  it('gets happn-cluster-builder', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnClusterBuilder();

    expect(builder.builderType).to.equal('happn-cluster');
  });

  it('gets happner-builder', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnerBuilder();

    expect(builder.builderType).to.equal('happner');
  });

  it('gets happner-cluster-builder', async () => {
    const builderFactory = ConfigBuilderFactory.create();
    const builder = builderFactory.getHappnerClusterBuilder();

    expect(builder.builderType).to.equal('happner-cluster');
  });
});
