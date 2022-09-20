const S3 = require('aws-sdk/clients/s3');
const constants = require('./constants');

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const bucket = process.env.S3_BUCKET || constants.DEFAULT_S3_BUCKET;

const getMeta = (assetId, contractFolder) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: `${contractFolder}/${assetId}`,
    };
    s3.headObject(params, (error, data) => {
      if (error) {
        if (error.code === 'NotFound') {
          console.log(
            `Token media not found for asset ${assetId} in contract folder ${contractFolder}`,
          );
          resolve({ContentType: undefined, ContentLength: 0});
        } else {
          console.error(
            `Error finding the file on S3: ${JSON.stringify(error)}; params: ${JSON.stringify(
              params,
            )}`,
          );
          reject(error);
        }
      } else {
        resolve(data);
      }
    });
  });
};

const save = async (filename, directory, fileType, buffer, options = {}) => {
  const params = {
    Bucket: bucket,
    Key: `${directory}/${filename}`,
    Body: buffer,
    ContentType: fileType,
    ACL: 'public-read',
    ...options,
  };

  return s3
    .upload(params, (error) => {
      if (error) {
        console.error(`Error writing the file to S3: ${JSON.stringify(error)}`);
        throw error;
      }
    })
    .promise();
};

const put = async (filename, directory, fileType, buffer, options = {}) => {
  const params = {
    Bucket: bucket,
    Key: `${directory}/${filename}`,
    Body: buffer,
    ContentType: fileType,
    ACL: 'public-read',
    ...options,
  };

  return s3
    .putObject(params, (error) => {
      if (error) {
        console.error(`Error writing the file to S3: ${JSON.stringify(error)}`);
        throw error;
      }
    })
    .promise();
};

const remove = async (filename, directory, options = {}) => {
  return s3
    .deleteObject({
      Bucket: bucket,
      Key: `${directory}/${filename}`,
      ...options,
    })
    .promise();
};

module.exports = {
  getMeta,
  save,
  remove,
  put,
};
