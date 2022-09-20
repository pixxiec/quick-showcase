const {updateItem} = require('@keystonejs/server-side-graphql-client');

module.exports = (keystone, adapter) => async (_, {token}) => {
  try {
    const user = await adapter.findOne({emailValidationToken: token});

    if (user) {
      await updateItem({
        keystone,
        listKey: 'User',
        item: {
          id: user.id,
          data: {
            emailValidationToken: null,
          },
        },
        returnFields: 'id',
      });

      return {success: true};
    }

    return {success: false};
  } catch (error) {
    console.error(`Invalid email validation token "${token}":`, error);
    return {success: false};
  }
};
