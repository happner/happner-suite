const { exec } = require('child_process');

// eslint-disable-next-line no-unused-vars
require('../../__fixtures/utils/test_helper').describe({ timeout: 10e3 }, (test) => {
  it('test to see that the child process does exit if database filename and compactInterval params have been specified', function (done) {
    var procPath = require('path').resolve(
      __dirname,
      '../../__fixtures/test/integration/data/db-compaction.js'
    );

    const ls = exec('node ' + procPath);

    ls.stderr.on('data', (data) => {
      //skip deprecation warning, node v14
      if (data.indexOf('Transform.prototype._transformState is deprecated') > -1) return;
      //eslint-disable-next-line
        console.log('stderr:::', data);
      done(data);
    });

    ls.stdout.on('data', (/*data*/) => {
      //do nothing
    });

    ls.on('close', () => {
      done();
    });
  });
});
