const getMediaUrl = (mediaUrl) => {
  let oUrl = new URL(mediaUrl);

  if (oUrl.protocol.toLowerCase() === 'ipfs:') {
    let path = '/';
    if (oUrl.hostname !== 'ipfs') {
      path += `ipfs/`;
    }
    path += `${oUrl.hostname}${oUrl.pathname}`;
    oUrl = new URL(path, 'https://ipfs.io/');
  }

  return oUrl;
};

module.exports = {
  getMediaUrl,
};
