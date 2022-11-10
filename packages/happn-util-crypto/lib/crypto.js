(function () {
  // begin enclosed

  const crypto = require('crypto-browserify'),
    nodeCrypto = require('crypto'),
    randomBytes = require('randombytes'),
    Buffer = require('buffer').Buffer,
    uuid = require('uuid'),
    SIGN_ALGORITHM = 'RSA-SHA256',
    KEYPAIR_ALGORITHM = 'rsa',
    KEYPAIR_LENGTH = 2048;
  let browser = false;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') browser = true;

  // allow require when module is defined (needed for NW.js)
  if (typeof module !== 'undefined') module.exports = Crypto;
  if (browser) window.Crypto = Crypto;

  function Crypto(opts) {
    if (!opts) opts = {};
    this.sign_algorithm = opts.sign_algorithm || SIGN_ALGORITHM;
    this.keypair_algorithm = opts.keypair_algorithm || KEYPAIR_ALGORITHM;
    this.keypair_length = opts.keypair_length || KEYPAIR_LENGTH;
    this.randomBytes = randomBytes;

    this.symmetricEncrypt = function (data, key, algorithm) {
      if (!algorithm) algorithm = 'aes-256-ctr';

      var cipher = crypto.createCipher(algorithm, key);
      return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    };

    this.symmetricDecrypt = function (encrypted, key, algorithm) {
      if (!algorithm) algorithm = 'aes-256-ctr';

      var decipher = crypto.createDecipher(algorithm, key);
      return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    };

    this.symmetricEncryptObject = function (obj, key, algorithm) {
      return this.symmetricEncrypt(JSON.stringify(obj), key, algorithm);
    };

    this.symmetricDecryptObject = function (encrypted, key, algorithm) {
      return JSON.parse(this.symmetricDecrypt(encrypted, key, algorithm));
    };

    this.symmetricEncryptiv = function (data, key, iv, algorithm) {
      if (!iv) throw new Error('an iv is reuired for this operation');
      if (!algorithm) algorithm = 'aes-256-ctr';

      var cipher = crypto.createCipheriv(algorithm, key, iv);
      return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    };

    this.symmetricDecryptiv = function (encrypted, key, iv, algorithm) {
      if (!iv) throw new Error('an iv is reuired for this operation');
      if (!algorithm) algorithm = 'aes-256-ctr';

      var decipher = crypto.createDecipheriv(algorithm, key, iv);
      return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    };

    this.symmetricEncryptObjectiv = function (obj, key, iv, algorithm) {
      return this.symmetricEncryptiv(JSON.stringify(obj), key, iv, algorithm);
    };

    this.symmetricDecryptObjectiv = function (encrypted, key, iv, algorithm) {
      return JSON.parse(this.symmetricDecryptiv(encrypted, key, iv, algorithm));
    };

    this.asymmetricEncrypt = function (privateKey, message) {
      if (!Buffer.isBuffer(message)) {
        message = Buffer.from(message);
      }
      return crypto.privateEncrypt(privateKey, message);
    };

    this.asymmetricDecrypt = function (publicKey, message) {
      if (!Buffer.isBuffer(message)) {
        message = Buffer.from(message);
      }
      return crypto.publicDecrypt(publicKey, message).toString();
    };

    this.sign = function (hash, privateKey, hashEncoding) {
      if (!hashEncoding) hashEncoding = 'base64';

      if (typeof hash === 'string') hash = Buffer.from(hash, hashEncoding);
      const sign = crypto.createSign(this.sign_algorithm);
      sign.update(hash);
      sign.end();
      return sign.sign(privateKey).toString('base64');
    };

    this.verify = function (hash, signature, publicKey, hashEncoding) {
      if (!hashEncoding) hashEncoding = 'base64';

      if (typeof hash === 'string') hash = Buffer.from(hash, hashEncoding);

      if (typeof signature === 'string') {
        signature = Buffer.from(signature, hashEncoding);
      }
      const verify = crypto.createVerify(this.sign_algorithm);
      verify.update(hash);
      verify.end();
      return verify.verify(publicKey, signature);
    };

    this.createKeyPair = function () {
      return nodeCrypto.generateKeyPairSync(this.keypair_algorithm, {
        modulusLength: this.keypair_length,
        publicKeyEncoding: { format: 'pem', type: 'pkcs1' },
        privateKeyEncoding: { format: 'pem', type: 'pkcs1' },
      });
    };

    this.createHashFromString = function (input, outputEncoding, algorithm) {
      if (!outputEncoding) outputEncoding = 'base64';

      if (!algorithm) algorithm = 'sha256';

      var shasum = crypto.createHash(algorithm);

      return shasum.update(input).digest(outputEncoding);
    };

    this.generateNonce = function (randomValue) {
      if (!randomValue) randomValue = uuid.v4().toString() + uuid.v4().toString();

      return this.createHashFromString(randomValue);
    };

    this.attacheMiddleware = function (app, route) {
      var fs = require('fs');

      if (!route) route = '/happn_util_crypto';

      app.use(route, function (req, res) {
        res.setHeader('Content-Type', 'application/javascript');

        if (this.cached) return res.end(this.cached);

        var path = require('path');
        var _this = this;

        fs.readFile(path.resolve(__dirname, '../build/lib/crypto.js'), function (e, buf) {
          _this.cached = buf.toString();
          res.end(_this.cached);
        });
      });
    };

    this.createCertificateX509 = function (keySize, serialNumber, attrs, validFrom, validPeriod) {
      var forge = require('node-forge');
      var pki = forge.pki;

      // generate a keypair or use one you have already
      var keys = pki.rsa.generateKeyPair(keySize || 2048);

      // create a new certificate
      var cert = pki.createCertificate();

      // fill the required fields
      cert.publicKey = keys.publicKey;
      cert.serialNumber = serialNumber || '01';
      cert.validity.notBefore = validFrom || new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notBefore.getFullYear() + validPeriod || 100
      );

      // use your own attributes here, or supply a csr (check the docs)
      attrs = attrs || [
        {
          name: 'commonName',
          value: 'Default',
        },
        {
          name: 'countryName',
          value: 'Default',
        },
        {
          shortName: 'ST',
          value: 'Default',
        },
        {
          name: 'localityName',
          value: 'Default',
        },
        {
          name: 'organizationName',
          value: 'Default',
        },
        {
          shortName: 'OU',
          value: 'Default',
        },
      ];

      // here we set subject and issuer as the same one
      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // the actual certificate signing
      cert.sign(keys.privateKey);

      // now convert the Forge certificate to PEM format
      return {
        key: pki.privateKeyToPem(keys.privateKey),
        cert: pki.certificateToPem(cert),
      };
    };
  }
})(); // end enclosed
