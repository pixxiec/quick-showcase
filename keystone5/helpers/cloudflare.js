const CloudFlare = require('cloudflare');
const constants = require('./constants');
const {getRequest, postRequest} = require('./axiosClient.js');

const cloudflarePurgeToken = process.env.CF_PURGE_TOKEN;
const cloudflareZone = process.env.CF_ZONE || constants.DEFAULT_CF_ZONE;
const cloudflareAccount = process.env.CF_ACCOUNT;
const cloudflareToken = process.env.CF_TOKEN;
const cloudflareStreamLoc = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccount}`;
const cloudflareAuthEmail = constants.DEFAULT_CF_AUTH_EMAIL;

const cf = new CloudFlare({
  token: cloudflarePurgeToken,
});

const purgeAssetImageURL = async (targetUrl) => {
  cf.zones.purgeCache(cloudflareZone, {files: [targetUrl]}).then(
    (data) => {
      console.log(`Cloudflare cache purged for: ${targetUrl}`);
      console.log(`Callback:`, data);
    },
    (error) => {
      console.log('Error encountered in purgeAssetImageURL');
      console.error(error);
    },
  );
};

const getStreamsMeta = async (videoId) => {
  try {
    const videoUrl = `${cloudflareStreamLoc}/stream/${videoId}`;

    const requestHeaders = {'X-Auth-Key': cloudflareToken, 'X-Auth-Email': cloudflareAuthEmail};
    const response = await getRequest(videoUrl, requestHeaders);
    if (response.data.errors.length > 0) {
      console.error(`Error getting media metadata: ${JSON.stringify(response.data.errors)}`);
      throw response.data.errors;
    }
    return response;
  } catch (error) {
    console.error(`Error getting media metadata: ${JSON.stringify(error)}`);
    throw error;
  }
};

const postStreamsContent = async (payload) => {
  try {
    const videoUrl = `${cloudflareStreamLoc}/stream/copy`;
    const postHeaders = {'X-Auth-Key': cloudflareToken, 'X-Auth-Email': cloudflareAuthEmail};
    return await postRequest(videoUrl, payload, postHeaders, {}, 30000);
  } catch (error) {
    console.error(`Error posting content to streams: ${JSON.stringify(error)}`);
    throw error;
  }
};

module.exports = {
  purgeAssetImageURL,
  getStreamsMeta,
  postStreamsContent,
};
