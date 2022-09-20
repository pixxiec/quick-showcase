const gql = require('fake-tag');
const {nonce} = require('./helpers/access');

module.exports = async (keystone) => {
  // Count existing users
  const {
    data: {
      _allUsersMeta: {count = 0},
    },
  } = await keystone.executeGraphQL({
    context: keystone.createContext().sudo(),
    query: gql`
      query {
        _allUsersMeta {
          count
        }
      }
    `,
  });

  if (count === 0) {
    const walletAddress = '0x...';

    const {errors} = await keystone.executeGraphQL({
      context: keystone.createContext().sudo(),
      query: gql`
        mutation initialUser($walletAddress: String, $nonce: String) {
          createUser(data: {walletAddress: $walletAddress, nonce: $nonce}) {
            id
          }
        }
      `,
      variables: {
        walletAddress,
        nonce: nonce(),
      },
    });

    if (errors) {
      console.log('failed to create initial user:');
      console.log(errors);
    } else {
      console.log(`

      User created:
      wallet: ${walletAddress}
      Please change these details after initial login.
      `);
    }
  }
};
