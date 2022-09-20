const {bufferToHex} = require('ethereumjs-util');
const {recoverPersonalSignature} = require('eth-sig-util');

const getAddress = (noncePhrase, signature) => {
  const nonceBuffer = bufferToHex(Buffer.from(noncePhrase, 'utf8'));
  return recoverPersonalSignature({
    data: nonceBuffer,
    sig: signature,
  });
};

module.exports = {
  getAddress,
};
