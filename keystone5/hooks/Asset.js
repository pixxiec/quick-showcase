const {updateItem} = require('@keystonejs/server-side-graphql-client');
const {purgeAssetImageURL, getStreamsMeta, postStreamsContent} = require('../helpers/cloudflare');
const {headRequest, getRequest} = require('../helpers/axiosClient.js');
const {getMeta, put} = require('../helpers/aws');
const {getMediaUrl} = require('../helpers/ipfs');
const {getContract} = require('../helpers/gql');
const constants = require('../helpers/constants');

const mediaExists = (currentMeta, imageMeta, mediaType) => {
  const doesMediaExist =
    currentMeta &&
    currentMeta.imageSize &&
    imageMeta &&
    imageMeta.imageSize &&
    imageMeta.imageType &&
    currentMeta.imageSize.toString() === imageMeta.imageSize &&
    mediaType === imageMeta.imageType;
  return doesMediaExist;
};

const saveMedia = async (assetId, contractFolder, mediaUrl, mediaMeta) => {
  const result = {
    image_content_type: mediaMeta.imageType,
  };
  try {
    if (mediaMeta.imageType.startsWith('video/')) {
      console.log(`Delivering media to CloudFlare Stream for asset ${assetId}`);
      result['video_url'] = (({
        data: {
          result: {uid},
        },
      }) => uid)(await postStreamsContent({url: mediaUrl.href, meta: {name: assetId}}));
    } else {
      console.log(
        `Downloading the following image for asset ${assetId}: ${JSON.stringify(mediaUrl.href)}`,
      );
      const imageData = (({headers, data}) => ({
        imageType: headers['content-type'],
        data: Buffer.from(data, 'binary'),
      }))(await getRequest(mediaUrl.href, {}, {responseType: 'arraybuffer'}));

      console.log(`Saving media to AWS S3 for asset ${assetId}`);
      await put(assetId, contractFolder, imageData.imageType, imageData.data);
    }
  } catch (error) {
    console.error(`Error saving asset image: ${JSON.stringify(error)}`);
    throw error;
  }
  return result;
};

const updateAsset = async (keystone, assetId, data) => {
  await updateItem({
    keystone,
    listKey: 'Asset',
    item: {
      id: assetId,
      data,
    },
    returnFields: 'id',
  });
};

const processImage = async (
  keystone,
  fileName,
  contractId,
  imageUrl,
  mediaType,
  videoUrl,
  purgeCDN = false,
) => {
  try {
    console.log(
      `Processing image: ${JSON.stringify({
        fileName,
        contractId,
        imageUrl,
      })}`,
    );
    const mediaUrl = getMediaUrl(imageUrl);
    const contract = await getContract(keystone, contractId.toString());
    if (contract.data.allContracts.length === 0) {
      throw new Error('Invalid contract');
    }
    const contractName = contract.data.allContracts[0].contractName;
    console.log(`Using contract ${contractName}`);
    let currentMeta;
    if (videoUrl) {
      console.log(
        `Checking the following video media for asset ${fileName}: ${JSON.stringify(videoUrl)}`,
      );
      currentMeta = (({
        data: {
          result: {size},
        },
      }) => ({imageSize: size}))(await getStreamsMeta(videoUrl));
      purgeCDN = false;
    } else {
      console.log(
        `Checking the ${JSON.stringify(contractName)} contract for asset ${fileName} media`,
      );
      currentMeta = (({ContentType, ContentLength}) => ({
        imageSize: ContentLength,
        imageType: ContentType,
      }))(await getMeta(fileName, contractName));
    }
    const imageMeta = (({headers}) => ({
      imageSize: headers['content-length'],
      imageType: headers['content-type'],
    }))(await headRequest(mediaUrl.href));

    if (mediaExists(currentMeta, imageMeta, mediaType)) {
      console.log(
        `Asset media exists and is a probable match for the media at ${imageUrl}. No further action required.`,
      );
      return;
    }
    const result = await saveMedia(fileName, contractName, mediaUrl, imageMeta);

    await updateAsset(keystone, fileName, result);

    if (purgeCDN) {
      const targetUrl = `${constants.DEFAULT_IMAGES_STORE}/${contractName}/${fileName}`;
      console.log(`Purging cached media at ${targetUrl}`);
      await purgeAssetImageURL(targetUrl);
    }
  } catch (error) {
    console.error(`Error getting asset image: ${JSON.stringify(error)}`);
  }
};

const copyContractDataToAsset = async (keystone, existingItem, updatedItem) => {
  try {
    console.log(`Processing contract for asset: ${JSON.stringify(updatedItem.id)}`);
    const contracts = await getContract(keystone, updatedItem.contract.toString());
    if (contracts.data.allContracts.length > 0) {
      const contract = contracts.data.allContracts[0];
      console.log(`Found contract ${contract.contractName} for asset`);

      // If the updatedItem already has a contractName, then data has already been copied over.
      if (!updatedItem.contractName) {
        const {
          contractName,
          conversionDecimalPlaces,
          contractAddress,
          crawlerImplementation,
          contractIcon,
          isERC20,
          coinGeckoId,
        } = contract;
        const newContractValues = {
          contractName,
          conversionDecimalPlaces,
          contractAddress,
          crawlerImplementation,
          contractIcon,
          isERC20,
          coinGeckoId,
        };

        await updateAsset(keystone, updatedItem.id.toString(), newContractValues);
      }
    }
  } catch (error) {
    console.error(`Error processing asset contract: ${JSON.stringify(error)}`);
  }
};

module.exports = (keystone) => ({
  list: {
    afterChange: async ({operation, existingItem, updatedItem}) => {
      switch (operation) {
        case 'create':
          if (updatedItem.image_url) {
            await processImage(
              keystone,
              updatedItem.id,
              updatedItem.contract,
              updatedItem.image_url,
              updatedItem.image_content_type,
              updatedItem.video_url,
              false,
            );
          }
          break;
        case 'update':
          if (updatedItem.image_url) {
            await processImage(
              keystone,
              updatedItem.id,
              updatedItem.contract,
              updatedItem.image_url,
              updatedItem.image_content_type,
              updatedItem.video_url,
              true,
            );
          }
          break;
        default:
          break;
      }

      if (updatedItem.contract && (!existingItem || !existingItem.crawlerImplementation)) {
        await copyContractDataToAsset(keystone, existingItem, updatedItem);
      }

      return {...updatedItem};
    },
  },
  field: {},
});
