const {updateItem} = require('@keystonejs/server-side-graphql-client');
const dayjs = require('dayjs');
const {getAddress} = require('../helpers/ethereum');
const {nonce} = require('../helpers/access');
const constants = require('../helpers/constants');

module.exports = (keystone, adapter) => async (_, {selectedAddress, signature}, {req}) => {
  const user = await adapter.findOne({
    walletAddress: selectedAddress.toLowerCase(),
  });

  if (user) {
    const noncePhrase = constants.DEFAULT_NONCE_PHRASE;
    const address = getAddress(`${noncePhrase}${user.nonce}`, signature);

    if (
      typeof address !== undefined &&
      address.toLowerCase() === user.walletAddress.toLowerCase()
    ) {
      await updateItem({
        keystone,
        listKey: 'User',
        item: {
          id: user.id,
          data: {
            nonce: nonce(),
            lastSignedInAt: dayjs().toISOString(),
          },
        },
        returnFields: 'id',
      });

      const token = await keystone._sessionManager.startAuthedSession(req, {
        item: user,
        list: {
          key: 'User',
        },
      });
      return {
        token,
      };
    }
  }

  return {
    token: null,
  };
};
