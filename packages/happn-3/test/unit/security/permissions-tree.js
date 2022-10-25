/* eslint-disable no-console */
const PermissionsTree = require('../../../lib/services/security/permissions-tree');
const tests = require('../../__fixtures/utils/test_helper').create();

const expect = require('chai').expect;

describe(tests.testName(__filename, 3), function () {
  it('tests create and search', function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario1());
    expect(permissionsTree.tree).to.deep.equal(expectedTreeScenario1());
    expect(permissionsTree.search('/test/permission/1/1/2')).to.deep.equal(
      searchResultsScenario1()
    );
  });

  it('tests short permission path', function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario2());
    expect(permissionsTree.tree).to.deep.equal(expectedTreeScenario2());
    expect(permissionsTree.search('/test/permission/1/1/2')).to.deep.equal(
      searchResultsScenario2()
    );
  });

  it('tests prohibited permission paths', function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario3());
    expect(permissionsTree.tree).to.deep.equal(expectedTreeScenario3());
    expect(permissionsTree.search('/test/permission/1/1/2')).to.deep.equal(
      searchResultsScenario3()
    );
  });

  it('tests building a list from a tree', function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario4());
    let permissions = permissionsTree.wildcardPathSearch('/test/permission/**', 'get');
    expect(permissions).to.eql({
      allowed: [
        '/test/permission/1/2/3',
        '/test/permission/2/1/3',
        '/test/permission/3/4/5',
        '/test/permission/4/6/7',
        '/test/permission/5/6/8',
      ],
      prohibited: [],
    });
  });

  it('tests building a list from a tree, path does not have /', function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario4());
    let permissions = permissionsTree.wildcardPathSearch('test', 'get');
    expect(permissions).to.eql({
      allowed: [],
      prohibited: [],
    });
  });

  it("tests if there's a recursive wildcard in the middle of a request", function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario4());
    const permissions = permissionsTree.wildcardPathSearch('/test/permission/1/**/3', 'get');

    expect(permissions)
      .to.be.instanceOf(Error)
      .with.property('message', 'Recursive wildcards are invalid unless at end of permission path');
  });

  it('tests that a recursive wildcard only returns those matched items, with child paths', function () {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario5());
    const permissions = permissionsTree.wildcardPathSearch('/test/permission/1/**', 'get');

    expect(permissions).to.deep.equal({
      prohibited: ['/test/permission/1/1/3', '/test/permission/1/6', '/test/permission/1/9/5'],
      allowed: [
        '/test/permission/1/2',
        '/test/permission/1/2/3',
        '/test/permission/1/5',
        '/test/permission/1/5/4',
        '/test/permission/1/6/3',
        '/test/permission/1/6/7',
        '/test/permission/1/7',
      ],
    });
  });

  it('tests building a recursive wildcard list with prohibitions', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario6());
    const permissions = permissionsTree.wildcardPathSearch('/test/permission/1/2/**', 'get');

    expect(permissions).to.deep.equal({
      allowed: ['/test/permission/1/2/*'],
      prohibited: [
        '/test/permission/1/2/3/4/5',
        '/test/permission/1/2/3',
        '/test/permission/1/2/6/*',
      ],
    });
  });

  it('tests building a wildcard list with prohibitions', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario6());
    const permissions = permissionsTree.wildcardPathSearch('/test/permission/1/2/*', 'get');

    expect(permissions).to.deep.equal({
      allowed: ['/test/permission/1/2/*'],
      prohibited: [
        '/test/permission/1/2/3/4/5',
        '/test/permission/1/2/3',
        '/test/permission/1/2/6/*',
      ],
    });
  });

  it('tests building a wildcard list with prohibitions [2]', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario7());
    const permissions = permissionsTree.wildcardPathSearch('/TEST/**', 'get');

    expect(permissions).to.deep.equal({
      allowed: ['/TEST/1/2/3', '/TEST/2/3/*', '/TEST/5/6'],
      prohibited: ['/TEST/2/3/4/5'],
    });
  });

  it('tests building a wildcard list with prohibitions where we have root access', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario8());
    const permissions = permissionsTree.wildcardPathSearch('/TEST/*', 'get');
    expect(permissions).to.deep.equal({
      allowed: ['/TEST/*'],
      prohibited: [],
    });
  });

  it('tests building a wildcard list with prohibitions where we have root access, prohibition further down tree', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const permissions = permissionsTree.wildcardPathSearch('/TEST/*', 'on');
    expect(permissions).to.deep.equal({ allowed: ['/TEST/*'], prohibited: ['/TEST/1/2/3'] });
  });

  it('tests spliceActions, branch[branchSegment].action is true', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const actions = ['segment1', 'segment2'];

    permissionsTree.spliceActions(
      {
        mockSegment: {
          action: ['mockAction'],
        },
      },
      'mockSegment',
      actions
    );

    expect(actions).to.eql(['segment1', 'mockAction', 'segment2']);
  });

  it('tests buildPermissionList, returns object if tree has no keys', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const result = permissionsTree.buildPermissionList(null, null, {}, '/path');

    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildPermissionList, returns object with leaf if pathArray is empty and leaf exists', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'leaf',
      prohibit: [],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList([], 'mockAction', tree, '/path');

    expect(result).to.eql({ allowed: ['leaf'], prohibited: [] });
  });

  it('tests buildPermissionList, returns object if pathArray is empty and leaf does not exist', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'leaf',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList([], 'mockAction', tree, '/path');

    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildPermissionList, returns permissions if prohibition ends with *', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      '*': {
        $leaf: 'path*',
        prohibit: ['mockAction'],
        actions: ['mockAction'],
      },
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['test'], 'mockAction', tree, 'path/');
    // await
    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildPermissionList, returns permissions if prohibition start with originalPath', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      '*': {
        $leaf: 'path/',
        prohibit: ['mockAction'],
        actions: ['mockAction'],
      },
      $leaf: 'path',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['test'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: ['path/'], prohibited: ['path/'] });
  });

  it('tests buildPermissionList, returns permissions if leaf && final && final2', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      '*': {
        $leaf: '/path*',
        prohibit: [],
        actions: ['mockAction'],
      },
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['test'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: ['path/'], prohibited: [] });
  });

  it('tests buildPermissionList, returns permissions if pathArray[0] is equal to **', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['**'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: [], prohibited: ['path*'] });
  });

  it('tests buildPermissionList, returns permissions if pathArray[0] is equal to *', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['*'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildPermissionList, returns', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['test'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildPermissionList, returns permissions if pathArray[0] is not a key in tree', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['prohibit'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildPermissionList, returns', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildPermissionList(['prohibit'], 'mockAction', tree, 'path/');

    expect(result).to.eql({ allowed: [], prohibited: [] });
  });

  it('tests buildProhibitions, returns an empty array if tree has no keys', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const result = permissionsTree.buildProhibitions([], 'action');

    expect(result).to.eql([]);
  });

  it('tests buildProhibitions, returns prohibitions, tree.$leaf truthy', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      '*': {
        $leaf: 'path*',
      },
      $leaf: 'path*',
      prohibit: ['mockAction'],
      actions: ['mockAction'],
    };
    const result = permissionsTree.buildProhibitions(tree, 'mockAction');

    expect(result).to.eql(['path*']);
  });

  it('tests buildProhibitions, returns prohibitions', () => {
    const permissionsTree = PermissionsTree.create(flattenedObjectScenario9());
    const tree = {
      prohibit: [],
      actions: ['mockAction'],
      test: { $leaf: 'path*', prohibit: ['mockAction'], actions: ['mockAction'] },
    };
    const result = permissionsTree.buildProhibitions(tree, 'action');

    expect(result).to.eql([]);
  });

  it('tests buildOutWild, returns an object', () => {
    const permissionsTree = PermissionsTree.create({ test: 'test' });
    const result = permissionsTree.buildOutWild({}, 'action');

    expect(result).to.eql({
      allowed: [],
      prohibited: [],
    });
  });

  it('tests buildOutWild, returns an object, checkAllowedLeaf is falsy', () => {
    const permissionsTree = PermissionsTree.create();
    const tree = {
      $leaf: 'path*',
      prohibit: [],
      actions: ['mockAction'],
    };

    const result = permissionsTree.buildOutWild(tree, 'action');

    expect(result).to.eql({
      allowed: [],
      prohibited: [],
    });
  });

  it('tests search, path does not have /', () => {
    const permissionsTree = PermissionsTree.create();
    const tree = {
      $leaf: 'path*',
      prohibit: [],
      actions: ['mockAction'],
    };

    const result = permissionsTree.search('path', tree);

    expect(result).to.eql([]);
  });

  function flattenedObjectScenario9() {
    return {
      '/*': { actions: ['*'] },
      '/TEST/1/2/3': { prohibit: ['on'] },
    };
  }
  function flattenedObjectScenario8() {
    return {
      '/*': { actions: ['*'] },
    };
  }

  function flattenedObjectScenario7() {
    return {
      '/TEST/1/2/3': { actions: ['on', 'get'] },
      '/TEST/2/3/*': { actions: ['on', 'get'] },
      '/TEST/2/3/4/5': { prohibit: ['on', 'get'] },
      '/TEST/5/6': { actions: ['on', 'get'] },
      '/TEST/5/6/*': { prohibit: ['on', 'get'] },
      '/TEST/5/6/7/9': { actions: ['on', 'get'] },
      '/ALLOWED/*': { actions: ['on', 'get'] },
      '/TEMPLATED/{{user.username}}/1/2': { actions: ['on', 'get'] },
    };
  }

  function flattenedObjectScenario6() {
    return {
      '/test/permission/1/2/*': { actions: ['get'] },
      '/test/permission/1/2/4': { actions: ['get'] },
      '/test/permission/1/2/4/5': { actions: ['get'] },
      '/test/permission/1/2/5/6': { actions: ['get'] },
      '/test/permission/1/2/3': { prohibit: ['get'] },
      '/test/permission/1/2/3/4/5': { prohibit: ['get'] },
      '/test/permission/1/2/6/*': { prohibit: ['get'] },
      '/test/permission/1/2/6/4': { actions: ['get'] },
      '/test/permission/1/2/6/4/7/8': { actions: ['get'] },
    };
  }

  function flattenedObjectScenario5() {
    return {
      '/test/permission/1/2': { actions: ['get'] },
      '/test/permission/1/6': { prohibit: ['get'] },
      '/test/permission/1/7': { actions: ['get'] },
      '/test/permission/1/2/3': { actions: ['get'] },
      '/test/permission/1/1/3': { prohibit: ['get'] },
      '/test/permission/1/6/7': { actions: ['get'] },
      '/test/permission/1/6/3': { actions: ['get'] },
      '/test/permission/1/5': { actions: ['get'] },
      '/test/permission/1/5/4': { actions: ['get'] },
      '/test/permission/1/9/5': { prohibit: ['get'] },
    };
  }

  function flattenedObjectScenario4() {
    return {
      '/test/permission/1/2/3': { actions: ['get'] },
      '/test/permission/2/1/3': { actions: ['get'] },
      '/test/permission/3/4/5': { actions: ['get'] },
      '/test/permission/4/6/7': { actions: ['get'] },
      '/test/permission/5/6/8': { actions: ['get'] },
    };
  }

  function flattenedObjectScenario3() {
    return {
      '/test/permission/*': { actions: ['remove'] },
      '/test/*': { actions: ['get'] },
      '/test/permission/*/1/2': { actions: ['set'], prohibit: ['get'] },
      '/test/permission/*/*/2': { prohibit: ['remove'] },
    };
  }

  function flattenedObjectScenario2() {
    return {
      '/test/permission/*': { actions: ['remove'] },
      '/test/*': { actions: ['get'] },
      '/test/permission/*/1/2': { actions: ['set'] },
    };
  }

  function flattenedObjectScenario1() {
    return {
      '/test/permission/1/*/2': { actions: ['remove'] },
      '/test/permission/*/1/2': { actions: ['get'] },
      '/test/permission/*/1/3': { actions: ['set'] },
      '/test/permission/2': { actions: ['set'] },
    };
  }

  function searchResultsScenario1() {
    return ['remove', 'get'].sort();
  }

  function searchResultsScenario2() {
    return ['remove', 'set', 'get'].sort();
  }

  function searchResultsScenario3() {
    return ['remove', 'set', 'get', '!remove', '!get'].sort();
  }

  function expectedTreeScenario3() {
    return {
      test: {
        permission: {
          '*': {
            1: {
              2: {
                $leaf: '/test/permission/*/1/2',
                actions: ['set'],
                prohibit: ['get'],
              },
            },
            $leaf: '/test/permission/*',
            actions: ['remove'],
            '*': {
              2: {
                $leaf: '/test/permission/*/*/2',
                prohibit: ['remove'],
              },
            },
          },
        },
        '*': {
          $leaf: '/test/*',
          actions: ['get'],
        },
      },
    };
  }

  function expectedTreeScenario2() {
    return {
      test: {
        permission: {
          '*': {
            1: {
              2: {
                $leaf: '/test/permission/*/1/2',
                actions: ['set'],
              },
            },
            $leaf: '/test/permission/*',
            actions: ['remove'],
          },
        },
        '*': {
          $leaf: '/test/*',
          actions: ['get'],
        },
      },
    };
  }

  function expectedTreeScenario1() {
    return {
      test: {
        permission: {
          1: {
            '*': {
              2: {
                $leaf: '/test/permission/1/*/2',
                actions: ['remove'],
              },
            },
          },
          2: {
            $leaf: '/test/permission/2',
            actions: ['set'],
          },
          '*': {
            1: {
              2: {
                $leaf: '/test/permission/*/1/2',
                actions: ['get'],
              },
              3: {
                $leaf: '/test/permission/*/1/3',
                actions: ['set'],
              },
            },
          },
        },
      },
    };
  }
});
