const {v4: uuidv4} = require('uuid');
const {updateItem} = require('@keystonejs/server-side-graphql-client');
const {sendEmailValidationToken} = require('../helpers/email');

module.exports = async (keystone, user) => {
  if (user) {
    const emailValidationToken = uuidv4();

    await updateItem({
      keystone,
      listKey: 'User',
      item: {
        id: user.id,
        data: {
          emailValidationToken,
        },
      },
      returnFields: 'id',
    });
    await sendEmailValidationToken(user, emailValidationToken);

    return {success: true};
  }

  return {success: false};
};
