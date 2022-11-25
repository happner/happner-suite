const forge = require("node-forge");

module.exports = class SelfSignedCertUtils {
  static create() {
    return new SelfSignedCertUtils();
  }
  makeNumberPositive(hexString) {
    let mostSiginficativeHexDigitAsInt = parseInt(hexString[0], 16);
    if (mostSiginficativeHexDigitAsInt < 8) return hexString;
    mostSiginficativeHexDigitAsInt -= 8;
    return mostSiginficativeHexDigitAsInt.toString() + hexString.substring(1);
  }

  randomSerialNumber() {
    return this.makeNumberPositive(forge.util.bytesToHex(forge.random.getBytesSync(20)));
  }

  createCA() {
    const keypair = forge.pki.rsa.generateKeyPair(2048);

    const cert = forge.pki.createCertificate();

    cert.publicKey = keypair.publicKey;
    cert.privateKey = keypair.privateKey;
    cert.serialNumber = this.randomSerialNumber();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setYear(cert.validity.notAfter.getFullYear() + 100);

    const attributes = [
      {
        shortName: "C",
        value: "ZA",
      },
      {
        shortName: "ST",
        value: "Western Cape",
      },
      {
        shortName: "L",
        value: "Cape Town",
      },
      {
        shortName: "CN",
        value: "Cert Gen Root CA",
      },
    ];

    const extensions = [
      {
        name: "basicConstraints",
        cA: true,
      },
      {
        name: "keyUsage",
        keyCertSign: true,
        cRLSign: true,
      },
    ];

    cert.setSubject(attributes);
    cert.setIssuer(attributes);
    cert.setExtensions(extensions);

    // Self-sign certificate
    cert.sign(keypair.privateKey, forge.md.sha512.create());

    return { cert: cert, privateKey: keypair.privateKey };
  }

  createCertificate(hostname, duration = 100) {
    hostname = hostname || "happner-framework.com";
    const CA = this.createCA();
    const hostKeys = forge.pki.rsa.generateKeyPair(2048);

    const cert = forge.pki.createCertificate();
    const csr = this.createCSR(hostname, hostKeys);

    cert.publicKey = csr.publicKey;
    cert.serialNumber = this.randomSerialNumber();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setYear(cert.validity.notAfter.getFullYear() + duration);

    const extensions = [
      {
        name: "basicConstraints",
        cA: false,
      },
      {
        name: "nsCertType",
        server: true,
      },
      {
        name: "subjectKeyIdentifier",
      },
      {
        name: "authorityKeyIdentifier",
        authorityCertIssuer: true,
        serialNumber: CA.cert.serialNumber,
      },
      {
        name: "keyUsage",
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
      },
      {
        name: "extKeyUsage",
        serverAuth: true,
      },
      {
        name: "subjectAltName",
        altNames: [
          {
            type: 2, // 2 is DNS type
            value: hostname,
          },
        ],
      },
    ];

    cert.setSubject(csr.subject.attributes);
    cert.setIssuer(CA.cert.subject.attributes);
    cert.setExtensions(extensions);

    // Self-sign certificate
    cert.sign(CA.privateKey, forge.md.sha512.create());

    const pemHostCert = forge.pki.certificateToPem(cert);
    const pemHostKey = forge.pki.privateKeyToPem(hostKeys.privateKey);

    return {
      cert: pemHostCert,
      key: pemHostKey,
    };
  }

  createCSR(hostname, hostKeys) {
    // Create a Certification Signing Request (CSR)
    const csr = forge.pki.createCertificationRequest();

    csr.publicKey = hostKeys.publicKey;

    const subject = [
      {
        shortName: "C",
        value: "ZA",
      },
      {
        shortName: "ST",
        value: "Western Cape",
      },
      {
        shortName: "L",
        value: "Cape Town",
      },
      {
        shortName: "O",
        value: "whatever",
      },
      {
        shortName: "OU",
        value: "whatever",
      },
      {
        shortName: "CN",
        value: "whatever",
      },
    ];

    const attributes = [
      {
        name: "extensionRequest",
        extensions: [
          {
            name: "subjectAltName",
            altNames: [
              {
                type: 2, // 2 is DNS type
                value: hostname,
              },
            ],
          },
        ],
      },
    ];

    csr.setSubject(subject);
    csr.setAttributes(attributes);

    // Sign the CSR using the host private key
    csr.sign(hostKeys.privateKey, forge.md.sha512.create());

    return csr;
  }
};
