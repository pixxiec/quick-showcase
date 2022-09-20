const {
  createItem,
  createItems,
  updateItem,
  updateItems,
  runCustomQuery,
} = require('@keystonejs/server-side-graphql-client');
const gql = require('fake-tag');

const addAssetForWallet = (keystone, adapter) => async (
  _,
  {walletAddress, metadata, url, contractAddress, tokenId, amount, title, imageUrl, description},
) => {
  try {
    const usersContractsAndAssets = await Promise.all([
      runCustomQuery({
        keystone,
        query: gql`
          query($walletAddress: String!) {
            allUsers(where: {walletAddress: $walletAddress}) {
              id
            }
          }
        `,
        variables: {walletAddress: walletAddress.toLowerCase()},
        context: keystone.createContext().sudo(),
      }),
      runCustomQuery({
        keystone,
        query: gql`
          query($contractAddress: String!) {
            allContracts(where: {contractAddress: $contractAddress}) {
              id
            }
          }
        `,
        variables: {contractAddress},
        context: keystone.createContext().sudo(),
      }),
      runCustomQuery({
        keystone,
        query: gql`
          query($url: String!) {
            allAssets(where: {url: $url}) {
              id
            }
          }
        `,
        variables: {url},
        context: keystone.createContext().sudo(),
      }),
    ]);

    if (
      Array.isArray(usersContractsAndAssets) &&
      usersContractsAndAssets.length === 3 &&
      usersContractsAndAssets[0].allUsers &&
      usersContractsAndAssets[1].allContracts &&
      usersContractsAndAssets[2].allAssets &&
      Array.isArray(usersContractsAndAssets[0].allUsers) &&
      Array.isArray(usersContractsAndAssets[1].allContracts) &&
      Array.isArray(usersContractsAndAssets[2].allAssets) &&
      usersContractsAndAssets[0].allUsers.length === 1 &&
      usersContractsAndAssets[1].allContracts.length === 1
    ) {
      const data = {
        userId: {
          connect: {id: usersContractsAndAssets[0].allUsers[0].id},
        },
        metadata,
        url,
        contract: {
          connect: {
            id: usersContractsAndAssets[1].allContracts[0].id,
          },
        },
        tokenId,
        amount,
        title,
        image_url: imageUrl,
        description,
      };
      if (usersContractsAndAssets[2].allAssets.length === 1) {
        const existingAsset = {
          id: usersContractsAndAssets[2].allAssets[0].id,
          data,
        };
        await updateItem({
          keystone,
          listKey: 'Asset',
          item: existingAsset,
          returnFields: 'id',
        });
      } else {
        await createItem({
          keystone,
          listKey: 'Asset',
          item: data,
          returnFields: 'id',
        });
      }

      return {success: true};
    }
  } catch (error) {
    console.log(`error: ${JSON.stringify(error)}`);
    return {success: false};
  }

  return {success: false};
};

// TODO PAWN-807: Organize raw gql in a better way
const getContractQuery = gql`
  query($contractAddress: String!) {
    allContracts(where: {contractAddress_i: $contractAddress}) {
      id
    }
  }
`;

const existingAssetsQuery = gql`
  query($contractAddress: String!, $tokenIds: [String]!) {
    allAssets(where: {contract: {contractAddress_i: $contractAddress}, tokenId_in: $tokenIds}) {
      id
      tokenId
      user {
        id
      }
    }
  }
`;

const existingOwnedAssetsQuery = gql`
  query($contractAddress: String!, $userId: ID!) {
    allAssets(where: {contract: {contractAddress_i: $contractAddress}, user: {id: $userId}}) {
      id
      tokenId
    }
  }
`;

const getUserQuery = gql`
  query($contractAddress: String!, $walletAddress: String!) {
    allUsers(where: {walletAddress: $walletAddress}) {
      id
      walletAddress
      crawlerCheckpoints(where: {contractAddress_i: $contractAddress}) {
        id
        contractAddress
        lastBlockCrawled
      }
    }
  }
`;

const updateAssetsAndCheckpoint = (keystone, adapter) => async (_, params) => {
  const {assets, contractAddress, lastBlockCrawled, walletAddress} = params;

  try {
    // fetch contract
    const {
      allContracts: [contract],
    } = await runCustomQuery({
      keystone,
      query: getContractQuery,
      variables: {contractAddress},
      context: keystone.createContext().sudo(),
    });

    // fetch user with checkpoint for contract
    const {
      allUsers: [user],
    } = await runCustomQuery({
      keystone,
      query: getUserQuery,
      variables: {contractAddress, walletAddress: walletAddress.toLowerCase()},
      context: keystone.createContext().sudo(),
    });

    if (user == null) {
      return {success: false};
    }

    const [checkpoint] = user.crawlerCheckpoints;
    if (checkpoint && checkpoint.lastBlockCrawled >= lastBlockCrawled) {
      console.log(
        `Stale data provided, could not update. Wallet: ${walletAddress} Contract: ${contractAddress}` +
          `Last Block: ${lastBlockCrawled} Current Checkpoint: ${checkpoint.lastBlockCrawled}`,
      );
      return {success: false};
    }

    const tokenIds = assets.map(({tokenID}) => tokenID);
    const {allAssets: existingAssets} = await runCustomQuery({
      keystone,
      query: existingAssetsQuery,
      variables: {contractAddress, tokenIds: tokenIds},
      context: keystone.createContext().sudo(),
    });

    const {allAssets: ownedAssets} = await runCustomQuery({
      keystone,
      query: existingOwnedAssetsQuery,
      variables: {contractAddress, userId: user.id},
      context: keystone.createContext().sudo(),
    });

    const newItems = [];
    const updatedItems = [];

    for (const asset of assets) {
      const existing = existingAssets.find(({tokenId}) => tokenId === asset.tokenID);
      if (existing == null) {
        // Insert missing assets
        newItems.push({data: assetToItem(asset, contract.id, user.id)});
      } else if (existing.user?.id !== user.id) {
        // Take ownership of existing unowned assets
        updatedItems.push(setAssetOwner(existing, user.id));
      }
    }

    // Detach assets that are no longer owned
    for (const owned of ownedAssets) {
      const stillOwned = assets.find(({tokenID}) => tokenID === owned.tokenId);
      if (stillOwned == null) {
        updatedItems.push(disconnectAssetOwner(owned));
      }
    }

    await Promise.all([
      createItems({
        keystone,
        listKey: 'Asset',
        items: newItems,
        returnFields: 'id',
      }),
      updateItems({
        keystone,
        listKey: 'Asset',
        items: updatedItems,
        returnFields: 'id',
      }),
    ]);

    if (checkpoint == null) {
      await createItem({
        keystone,
        listKey: 'CrawlerCheckpoint',
        item: {
          user: {
            connect: {id: user.id},
          },
          contractAddress,
          lastBlockCrawled,
        },
        returnFields: 'id',
      });
    } else {
      await updateItem({
        keystone,
        listKey: 'CrawlerCheckpoint',
        item: {
          id: checkpoint.id,
          data: {lastBlockCrawled},
        },
        returnFields: 'id',
      });
    }

    return {success: true};
  } catch (error) {
    console.error(`Could not update assets for wallet ${walletAddress}:`, error);
    return {success: false};
  }
};

function setAssetOwner(asset, userId) {
  return {
    id: asset.id,
    data: {
      user: {
        connect: {id: userId},
      },
    },
  };
}

function disconnectAssetOwner(asset) {
  return {
    id: asset.id,
    data: {
      user: {
        disconnectAll: true,
      },
    },
  };
}

function assetToItem(asset, contractId, userId) {
  let metadata = '';
  let imageUrl = '';
  try {
    if (typeof asset.metadata === 'string') {
      metadata = JSON.parse(asset.metadata);
      imageUrl = metadata.image_url ?? metadata.imageUrl;
      imageUrl = typeof imageUrl === 'string' ? imageUrl : '';
    }
  } catch (error) {
    console.error('Could not parse metadata:', asset.metadata);
  }

  return {
    user: {
      connect: {id: userId},
    },
    metadata,
    url: asset.URL,
    contract: {
      connect: {
        id: contractId,
      },
    },
    tokenId: asset.tokenID,
    title: asset.title ?? '',
    image_url: imageUrl,
    description: asset.description ?? '',
  };
}

module.exports = {
  addAssetForWallet,
  updateAssetsAndCheckpoint,
};
