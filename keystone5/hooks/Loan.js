const {
  createItem,
  getItem,
  getItems,
  updateItems,
} = require('@keystonejs/server-side-graphql-client');
const {
  EVENT_TYPES: {LOAN_CREATED, LOAN_DUE_1W},
} = require('../helpers/constants');

module.exports = (keystone) => ({
  list: {
    afterChange: async ({operation, updatedItem}) => {
      try {
        const request = await getItem({
          keystone,
          listKey: 'LoanRequest',
          itemId: updatedItem.loanRequest.toString(),
          returnFields: 'id, borrower {id}',
        });

        if (operation === 'create') {
          const terms = await getItem({
            keystone,
            listKey: 'LoanTerm',
            itemId: updatedItem.loanTerms.toString(),
            returnFields: 'durationInDays',
          });

          await createItem({
            keystone,
            listKey: 'Event',
            item: {
              type: LOAN_CREATED,
              borrower: {connect: {id: request.borrower.id.toString()}},
              request: {connect: {id: request.id.toString()}},
              loan: {connect: {id: updatedItem.id.toString()}},
            },
            returnFields: `id`,
          });

          const date = new Date(updatedItem.createdAt);
          date.setDate(date.getDate() + terms.durationInDays - 7);

          await createItem({
            keystone,
            listKey: 'Event',
            item: {
              type: LOAN_DUE_1W,
              targetDate: date.toISOString(),
              borrower: {connect: {id: request.borrower.id.toString()}},
              request: {connect: {id: request.id.toString()}},
              loan: {connect: {id: updatedItem.id.toString()}},
            },
            returnFields: `id`,
          });
        } else if (operation === 'update' && updatedItem.lender) {
          const existingEvents = await getItems({
            keystone,
            listKey: 'Event',
            where: {
              loan: {
                id: updatedItem.id.toString(),
              },
            },
            returnFields: 'id',
          });

          if (!existingEvents || existingEvents.length === 0) {
            console.error(
              `Could not set lender for loan id ${updatedItem.id.toString()} - events not found`,
            );
          } else {
            await updateItems({
              keystone,
              listKey: 'Event',
              items: existingEvents.map((event) => ({
                id: event.id,
                data: {
                  lender: {connect: {id: updatedItem.lender.toString()}},
                },
              })),
              returnFields: 'id',
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
  field: {},
});
