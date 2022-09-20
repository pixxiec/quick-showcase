const {createItem} = require('@keystonejs/server-side-graphql-client');
const {isValid} = require('../helpers/wallet');
const {nonce} = require('../helpers/access');
const constants = require('../helpers/constants');

let allowNewUsers = constants.DEFAULT_ALLOW_NEW_USERS || false;
if (process.env.ALLOW_NEW_USERS !== undefined) {
  allowNewUsers = process.env.ALLOW_NEW_USERS === 'true';
}

module.exports = (keystone, adapter) => async (_, {selectedAddress, networkVersion}, {req}) => {
  let user;
  const address = selectedAddress.toLowerCase();
  const noncePhrase = constants.DEFAULT_NONCE_PHRASE;
  try {
    user = await adapter.findOne({
      walletAddress: address,
    });
  } catch (e) {
    console.log('User not found');
    // If there was an error, the user doesn't exist yet.
  }

  if (isValid(selectedAddress, networkVersion)) {
    if (!user && allowNewUsers) {
      user = await createItem({
        keystone,
        listKey: 'User',
        item: {
          walletAddress: address,
          nonce: nonce(),
          permitted: true,
          isAdmin: false,
        },
        returnFields: 'id nonce',
      });
    }

    if (user) {
      return {nonce: `${noncePhrase}${user.nonce}`};
    }
  }

  return {nonce: null};
};
