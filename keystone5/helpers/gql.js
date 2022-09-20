const gql = require('fake-tag');

const getContractQuery = gql`
  query getContracts($id: ID!) {
    allContracts(where: {id: $id}) {
      contractName
      conversionDecimalPlaces
      contractAddress
      crawlerImplementation
      contractIcon
      isERC20
      coinGeckoId
    }
  }
`;

const getContract = async (keystone, contractId) =>
  keystone.executeGraphQL({
    context: keystone.createContext().sudo(),
    query: getContractQuery,
    variables: {
      id: contractId,
    },
  });

module.exports = {
  getContract,
};
