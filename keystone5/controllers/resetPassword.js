const {updateItem} = require('@keystonejs/server-side-graphql-client');

module.exports = (keystone, adapter) => async (_, {token, password}) => {
  const user = await adapter.findOne({resetPassToken: token});

  if (user) {
    await updateItem({
      keystone,
      listKey: 'User',
      item: {
        id: user.id,
        data: {
          password,
          resetPassToken: null,
        },
      },
      returnFields: 'id',
    });

    return {success: true};
  }

  return {success: false};
};
