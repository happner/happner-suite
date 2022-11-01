# util-crypto

Happn cryptograpy utilities

crypto
------
- using bitpays bitcore-lib and bitcore-ecies
 - https://github.com/bitpay/bitcore-lib
 - https://github.com/bitpay/bitcore-ecies

- need gulp installed
- need to go to each node module and npm install, then run gulp test
 - gulp test runs tests in node and in browser using karma

to build browser code:
node ./node_modules/gulp/bin/gulp.js --gulpfile "./gulp-crypto.js"

to test browser code:
./node_modules/karma/bin/karma start karma.crypto.conf.js
