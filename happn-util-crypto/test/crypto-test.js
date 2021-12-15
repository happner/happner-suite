describe('crypto-test', function() {
  var crypto;
  let expect;
  var cryptoUtil;
  let browserKeys, browserKeys2;
  if (typeof window === 'undefined') {
    let chai = require('chai');
    crypto = require('../lib/crypto');
    cryptoUtil = new crypto();
    expect = chai.expect;
    browserKeys = browserKeys2 = null;
  } else {
    expect = window.expect;
    cryptoUtil = new window.Crypto();
    browserKeys = {
      publicKey:
        '-----BEGIN RSA PUBLIC KEY-----\nMIICCgKCAgEAthnHfaxaj/Nu2pYeSi4evH0ScU8v3F7qKxxwnsyXsJCB/AGR8+vH\nr67nfG0xUbZ5Zt5coColiPXzYQrgYkPfVIolev5nxlUXXM8iaN7h0EIZb52Y/RWH\n4vQTppcpmW/socWnv8jwTM3uz2p2gcKvI8TQ3HwtLf1sCyEcfX3eqg63lTQ8NcnV\nqSrV0liJ7bR1k9dEk9ud/BI6JHEmtGNrKp/eyCP7qfZl+yEBSAdAiJje2zMIX76+\nvwwmyOgaXcQZU4P4df3Vskp/V5YLCs+WJfV8I+eGsQjBZN6DD7fAx+LAChHMGkvo\nzbMGMixN++UTOVp+g+eyww9eFh1qiPBL7VBAeg6EcgWqxaGWWjhEK4Vh0C6OTPUf\nHce13UZCLNXO7WBbedDMZAIhuVTlRU50kJccWBKfh+DkmN9YexJZT6y7afst8Obc\nsGMhZGrAvRdICOJaIfeSvIJGXFlqOCcvyuuhOLGKT0v1krAZ2FtiDj6DEVupAqrg\ngJz5neyUSMKa0DNzGwHy5riOd+KV/tncsvVqrtHiCQHwJQ8DuaWVQ0/xYUw7MvLL\nFMW2W+Q74IUgPHBdtdkgXyQzajyNIrZU5zNRG/5rV25p5wXMOqhmSbx3fPvnG/a3\nhakgOoNDu/fh9wz+hmx3pdw96C+zQmDkyGaq3Qc2zwiUY2zj2aUVUSsCAwEAAQ==\n-----END RSA PUBLIC KEY-----\n',
      privateKey:
        '-----BEGIN RSA PRIVATE KEY-----\nMIIJKQIBAAKCAgEAthnHfaxaj/Nu2pYeSi4evH0ScU8v3F7qKxxwnsyXsJCB/AGR\n8+vHr67nfG0xUbZ5Zt5coColiPXzYQrgYkPfVIolev5nxlUXXM8iaN7h0EIZb52Y\n/RWH4vQTppcpmW/socWnv8jwTM3uz2p2gcKvI8TQ3HwtLf1sCyEcfX3eqg63lTQ8\nNcnVqSrV0liJ7bR1k9dEk9ud/BI6JHEmtGNrKp/eyCP7qfZl+yEBSAdAiJje2zMI\nX76+vwwmyOgaXcQZU4P4df3Vskp/V5YLCs+WJfV8I+eGsQjBZN6DD7fAx+LAChHM\nGkvozbMGMixN++UTOVp+g+eyww9eFh1qiPBL7VBAeg6EcgWqxaGWWjhEK4Vh0C6O\nTPUfHce13UZCLNXO7WBbedDMZAIhuVTlRU50kJccWBKfh+DkmN9YexJZT6y7afst\n8ObcsGMhZGrAvRdICOJaIfeSvIJGXFlqOCcvyuuhOLGKT0v1krAZ2FtiDj6DEVup\nAqrggJz5neyUSMKa0DNzGwHy5riOd+KV/tncsvVqrtHiCQHwJQ8DuaWVQ0/xYUw7\nMvLLFMW2W+Q74IUgPHBdtdkgXyQzajyNIrZU5zNRG/5rV25p5wXMOqhmSbx3fPvn\nG/a3hakgOoNDu/fh9wz+hmx3pdw96C+zQmDkyGaq3Qc2zwiUY2zj2aUVUSsCAwEA\nAQKCAgA0zTbOFvrPgLulACBaTBM3fmCpoFd1Y8Qsqftx4EsftFcsdlwWyUhGhcWz\ni4ngcrOzA0kCXBY0J3Thr6CufZW1UrVZe4kltiinDZyhofcCRxhPB/iDcgnL4hAM\nnwo95nlL0x83+hDLhG75j5o7N/NGwNv7Arqq+i+o7nnvXV8CGnBbACFxS0v72GLV\nsjyUQ15Qdvv4j5a4r6RSSsj5R1acrmyPxfdEKiEZ91ECzK+GrCT6lEqaUJnIlcJt\nQPfcNm9NixexRt/+6aERCX28LcMQ0KSlWI3yqWJCWE7ScOqiSvp6MPzopxgjBQUH\n6VbXcm3nlHjY0IdCDiOu7+qjOGIbOY+7Z8CPuC3X9HhO5gSivSgXYFhb08IvgYlJ\nQ1O7Zksf/ovtgvtsehwk7sXeoVLExAFfVSGrIPECOp8nXL97EQEi8wly8+OrJBqV\nVd62tuv1cZwnvO5/V0gtvHiGutddHVs9UyPlECsTBkRxDpOybUOndbiH6sE+G5BS\nam5a2f8VMjjoGLjQoEFBW6BPqxazcs2IuM4PGMUnTdAq07xYxQ1+GbO8N7Psw/qO\nqQry30k1vQQcoMsFqJqZodXcx0O9la5Gq9vC26BVUr1YtqHOnEtcdBYNs3BuvWFj\nBI3mbBsQymUX02e4ut/IFnmqwJlCTLgAU9StE5Apzr5nTwpkOQKCAQEA2sJWoxmi\nv6hh10oudmFQxf9D3s3ygsR75XE02F4DugU6vat64kUA5NrPXrl1bZ1rodgKUJVS\nu3cIN665ipWNBpzntS+/k5T/HCR0IX9aKxF/Lof2Am3ZjWUNVXjcFav3IoWVqEaV\nR6U1yLFpIKkaPvBjwRnuQ0jzBs5/NErex993ngPDy+WfCfLkSPv2zdiWy0v6Esxt\nGL269vCiU6HmLUJ0eTUacqfQkc8T3NTIPo8R9CCPI5siCvnuemwrKjD7gvSUhiXd\nvtUH9ae22JqRzb9D6iXKlwsi7wHj0cWs/5DykVatV3H0knyhkg5zhVDYK1fUDQLd\n65KQXwxVHOESHQKCAQEA1RnX0vysX0Y+hg+A6Bx5wVO/x8zMd+d14EOD+v4OfQgw\nP6wuvleLIZRcf3ZimCthfSOajXJoFmDfX8z4iTjDaQXeufNjfSQq5s4JyB3M10vN\n9/csYzQbEY3WsTJsr/dVQEJU2wpqd2m9oAeEB3rgSjsyk5E5//roXE1kVKruR2LI\nCxSlVnPA4n0AWBEoDMrctOrqD/GS7X2xRzf7JwOysB4eBRKm+7lR3TyPqZ52zWqO\nX7VIKQRPTbuyQiRvMziWiwG2cX1HQbEDnEPGuaetxgkwvOeKH2z8cKSXP/SKh/GS\nq0rrD1fk5zCvpmrE/jMbMV1k4fDJkjFmplLV69SN5wKCAQBZr/V/NwJvm2RJtOMp\nq6pHEunLjhoQHOhC4E/vKVRTztMPch+WZv3/1enRBy4qu7CmEQHhmebqbtnSonL1\na2z/OhMRSLs9kYeqDRQDq8fXAnxnIlztEAZynuyBj2SEChXvdF8wN4f6cLSFTJ8y\nQcI97aaoQ65Yra7dqomicdO2lFrhUN/UV5cFqCyJ86tzJ4pjXQnw7RkJXLgrh+q1\naRoKkkVYcDogqcasEP8uuZpDc7rDoRmuWmrxnxhz3qcvzBdB0G6YNSwdkg+KWrFv\nSqfed70rYUUW+fzfiqHRnj7YJKAekC/POywvZqODUyNvk/6cfoy0rOk5LMS+Aztd\n9LTNAoIBAQCOD0lSTMD4TpKVujYcBgegupzpq/xOno11MG0GYGD2NwQ7HiSXHTMR\n8p5rFleJy7mUu6xnSPJcoL2oVrMEf0O9en1NBxS2suqqrIXW0w7gI5euCyebBnxZ\nCm4p+Ex+TeqWCOIal2n8KxCPYxNADUkCE06XE0RQAkruZWVSEBUCn7ZttJi39jiK\ng/w7uUwyovXY4ZWhhVCGY7lPmeEi1BNF1v36McIBozwQuTOoRow6SiOZZ/cv6MCZ\nOFwQPcunoLyy9DRUmchr4X5fqMsMrtxoXW4RMGVip7vtt7tgljvXflJhQHNM6jId\ncNZXoWurbhRdpz3+ZQ9rFuWwUR5stWjXAoIBAQCnnzv8zrFOc69Uu4ltRV/vcQY/\n1psTbd4Kq6rIrferjVT7BBwApHc3xODqXx4eHTvELzgtfA9/DzR6CDVNcbABO0S3\nrTomStdpA2Aky6Cmw/4+6zzMcEcFdgCCn5xHeItLYRNTnafreeXMs0LHAPbnHzOj\nc0gtEs4g+z7yjK2feTr1ycymBbnrp3TkEZbhutU4j+py1odMzjxmtj0Ebi39SAlP\nSPlEQTQlcGtEdaNewWM/Iwl/9nOYZx+Bg+CQcjGE73M9dRMNL3+j0kEllVQe9X/G\nHpyyOSZWlP7v0KlVTvxB69FVc2g52DD2h/LKPGxoQ/Io506KKCVsfYGmbVgX\n-----END RSA PRIVATE KEY-----\n'
    };
    browserKeys2 = {
      publicKey:
        '-----BEGIN RSA PUBLIC KEY-----\nMIICCgKCAgEAuL8F4mlYpMOZ10RJn7QeMbh7EZ9lRJTXhVVU/1L70Oo9E2kmrUar\nTtJgp99bf5l0gly8dDEfxU4YzHxYBEtOcMEK4QZKeJfF4zIc8ALIUTzWQFlmMQu1\nN4F7QF/kT3QWiHeTo7329nXjqqeP+gDmiOVAIigBoobOvjStykR4uE3vX6frvDFN\nQBACg1rkHKbmNJF0zr+FDkm8DF8THswvEBg2vWuvVO55CQE4iTIosphfHUhbrf+d\nouqC7cMeJJBlnadN9qk8NaQY0wbVKQKZbpxy56l7WRAtvftaoCL/3uzuiNKi4GLI\nYTMkUaHVzZZbf1zX5g9/bPiVozpZZK43DKaxGlXadV/npqHaXXKnwVNTh3XzI+YE\nnWUV541RCj7wydS2ndd7VK5WQFin0mJAO7KSCwDg49s48EPjSQEczeg1ru126srL\nznRLFNq2mEs3J9a1gpah/KK6/p87LSiiBxkdOnB0leGwbzI0ZILck7NU9kP+cQ+3\nEKTUBMJCP62Q+j0BoC9Op6AH3IxG8FtRr0581QgpN3bZjt6UNL8s3jxgwrkvf8qP\ncwY1IMKdlDK5JdiGdienc1ocQ8pNc7gJBE5O5Ue62bcSCwNctkth1zppcjpwSrJ0\nH9a7rCL9jOodFs+0Z25WtsHUz9IcLty8eN2OE4rO1LX31CsRtD4mc7sCAwEAAQ==\n-----END RSA PUBLIC KEY-----\n',
      privateKey:
        '-----BEGIN RSA PRIVATE KEY-----\n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\n-----END RSA PRIVATE KEY-----\n'
    };
  }

  before('initialize crypto library', function(callback) {
    callback();
  });

  context('external functions', function() {
    it('encrypts data with a public key, and decrypt with a private key', function(done) {
      var message = JSON.stringify({ test: Date.now() });

      let { publicKey, privateKey } = browserKeys ? browserKeys : cryptoUtil.createKeyPair();

      let encryptedData = cryptoUtil.asymmetricEncrypt(privateKey, message);

      let decryptedData = JSON.parse(cryptoUtil.asymmetricDecrypt(publicKey, encryptedData));

      expect(decryptedData.test).to.equal(JSON.parse(message).test);

      done();
    });

    it('encrypts and decrypts a string', function(callback) {
      var testString = 'this is a test';

      var encrypted = cryptoUtil.symmetricEncryptObject(testString, 'testkey');

      expect(encrypted).to.not.equal(testString);

      var decrypted = cryptoUtil.symmetricDecryptObject(encrypted, 'testkey');

      expect(decrypted).to.equal(testString);

      callback();
    });

    it('encrypts and decrypts an object', function(callback) {
      var testObj = { test: 'blah' };

      var encrypted = cryptoUtil.symmetricEncryptObject(testObj, 'testkey');

      var decrypted = cryptoUtil.symmetricDecryptObject(encrypted, 'testkey');

      expect(decrypted.test).to.equal(testObj.test);

      callback();
    });

    it('encrypts and decrypts a string with an iv', function(callback) {
      var iv = cryptoUtil.randomBytes(16);

      var key = 'XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT';

      var testString = 'this is a test';

      var encrypted = cryptoUtil.symmetricEncryptiv(testString, key, iv);

      expect(encrypted).to.not.equal(testString);

      var decrypted = cryptoUtil.symmetricDecryptiv(encrypted, key, iv);

      expect(decrypted).to.equal(testString);

      callback();
    });

    it('encrypts and decrypts an object with an iv', function(callback) {
      var iv = cryptoUtil.randomBytes(16);

      var key = 'XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT';

      var testObj = { test: 'blah' };

      var encrypted = cryptoUtil.symmetricEncryptObjectiv(testObj, key, iv);

      var decrypted = cryptoUtil.symmetricDecryptObjectiv(encrypted, key, iv);

      expect(decrypted.test).to.equal(testObj.test);

      callback();
    });

    it('signs a nonce and verifies it', function(callback) {
      var nonce = cryptoUtil.generateNonce('TESTVALUE');
      var nonce1 = cryptoUtil.generateNonce();
      var nonce2 = cryptoUtil.generateNonce('TESTVALUE');

      expect(nonce).to.equal(nonce2);

      var keyPair = browserKeys ? browserKeys : cryptoUtil.createKeyPair();
      var keyPair1 = browserKeys2 ? browserKeys2 : cryptoUtil.createKeyPair();

      var digest = cryptoUtil.sign(nonce, keyPair.privateKey);
      var digest1 = cryptoUtil.sign(nonce1, keyPair1.privateKey);
      var digest2 = cryptoUtil.sign(nonce2, keyPair.privateKey);

      expect(digest).to.equal(digest2);
      expect(digest).to.not.equal(digest1);

      expect(cryptoUtil.verify(nonce, digest, keyPair.publicKey)).to.equal(true);
      expect(cryptoUtil.verify(nonce1, digest1, keyPair1.publicKey)).to.equal(true);
      expect(cryptoUtil.verify(nonce1, digest, keyPair.publicKey)).to.equal(false);
      expect(cryptoUtil.verify(nonce, digest1, keyPair.publicKey)).to.equal(false);

      callback();
    }).timeout(3000);
  });
});
