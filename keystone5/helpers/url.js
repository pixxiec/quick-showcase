const { URL } = require('url');

const stringIsAValidUrl = (s, protocols) => {
    try {
        const url = new URL(s);
        const includesProtocol = protocols
            .map((x) => `${x.toLowerCase()}:`)
            .includes(url.protocol);
        const validProtocol = url.protocol ? includesProtocol : false;
        return protocols ? validProtocol : true;
    } catch (err) {
        return false;
    }
};

module.exports = {
    stringIsAValidUrl,
};
