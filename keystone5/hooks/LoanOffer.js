const {createItem, getItem} = require('@keystonejs/server-side-graphql-client');
const {
  EVENT_TYPES: {OFFER_CREATED},
} = require('../helpers/constants');

module.exports = (keystone) => ({
  list: {
    resolveInput: async ({operation, existingItem, resolvedData}) => {
      if (
        operation === 'update' &&
        existingItem.id !== undefined &&
        resolvedData.loanTerms !== undefined &&
        existingItem.loanTerms !== resolvedData.loanTerms
      ) {
        await createItem({
          keystone,
          listKey: 'LoanTermHistory',
          item: {
            loanTerm: existingItem.loanTerms.toString(),
            loanOffer: existingItem.id.toString(),
          },
          returnFields: `id`,
        });
      }

      return {...resolvedData};
    },
    afterChange: async ({operation, updatedItem}) => {
      if (operation === 'create') {
        let request;

        if (updatedItem.loanRequest) {
          request = await getItem({
            keystone,
            listKey: 'LoanRequest',
            itemId: updatedItem.loanRequest.toString(),
            returnFields: 'id, borrower {id}',
          });
        }

        await createItem({
          keystone,
          listKey: 'Event',
          item: {
            type: OFFER_CREATED,
            lender: {connect: {id: updatedItem.lender.toString()}},
            borrower: request ? {connect: {id: request.borrower.id.toString()}} : undefined,
            request: request ? {connect: {id: request.id.toString()}} : undefined,
            offer: {connect: {id: updatedItem.id.toString()}},
          },
          returnFields: `id`,
        });
      }
    },
  },
  field: {},
});
