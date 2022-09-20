const {createItem} = require('@keystonejs/server-side-graphql-client');
const {
  EVENT_TYPES: {REQUEST_CREATED},
} = require('../helpers/constants');

module.exports = (keystone) => ({
  list: {
    resolveInput: async ({operation, existingItem, resolvedData}) => {
      if (
        operation === 'update' &&
        existingItem.id &&
        existingItem.loanTerms &&
        resolvedData.loanTerms &&
        existingItem.loanTerms !== resolvedData.loanTerms
      ) {
        await createItem({
          keystone,
          listKey: 'LoanTermHistory',
          item: {
            loanTerm: existingItem.loanTerms.toString(),
            loanRequest: existingItem.id.toString(),
          },
          returnFields: `id`,
        });
      }

      return {...resolvedData};
    },
    afterChange: async ({operation, updatedItem}) => {
      if (operation === 'create') {
        await createItem({
          keystone,
          listKey: 'Event',
          item: {
            type: REQUEST_CREATED,
            borrower: {connect: {id: updatedItem.borrower.toString()}},
            request: {connect: {id: updatedItem.id.toString()}},
          },
          returnFields: `id`,
        });
      }
    },
  },
  field: {},
});
