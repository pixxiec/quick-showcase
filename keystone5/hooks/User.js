const got = require('got');
const debounce = require('debounce');
const {remove} = require('../helpers/aws');
const {DEFAULT_AVATAR_DIRECTORY} = require('../helpers/constants');
const requestValidateEmail = require('../controllers/requestValidateEmail');

const crawlerUrl = process.env.CRAWLER_URL;

const crawlUser = async (address) => {
  try {
    console.log(`Calling crawler against ${address}`);
    const response = await got(`${crawlerUrl}/${address}`);
    console.log(response.body);
  } catch (error) {
    throw error.response.body;
  }
};

const debouncedCrawlUser = debounce(crawlUser, 10);

module.exports = (keystone) => ({
  list: {
    afterChange: async ({operation, updatedItem}) => {
      try {
        switch (operation) {
          case 'create':
          case 'update':
            if (updatedItem.walletAddress) {
              await debouncedCrawlUser(updatedItem.walletAddress);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.log(`Error crawling user: ${JSON.stringify(error)}`);
      }

      return {...updatedItem};
    },
    afterDelete: async ({existingItem}) => {
      if (existingItem.avatar) {
        await remove(existingItem.avatar.filename, DEFAULT_AVATAR_DIRECTORY);
      }
    },
  },
  field: {
    avatar: {
      beforeChange: async ({existingItem}) => {
        if (existingItem && existingItem.avatar) {
          await remove(existingItem.avatar.filename, DEFAULT_AVATAR_DIRECTORY);
        }
      },
    },
    email: {
      afterChange: async ({existingItem, updatedItem}) => {
        if (updatedItem.email && (!existingItem || existingItem.email !== updatedItem.email)) {
          await requestValidateEmail(keystone, updatedItem);
        }
      },
    },
  },
});
