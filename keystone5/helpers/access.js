// Access control functions
const jwt = require('jsonwebtoken');
const constants = require('./constants');

const isAdmin = ({authentication: {item: user}, context}) => {
  const isAdminUser = Boolean(user && user.isAdmin);

  if (isAdminUser) {
    return true;
  }

  if (
    process.env.BRIDGE_API_KEY &&
    context &&
    context.req &&
    context.req.headers &&
    context.req.headers['x-api-key'] === process.env.BRIDGE_API_KEY
  ) {
    return true;
  }

  return false;
};

const isUser = ({authentication: {item: user}, existingItem, itemId}) => {
  if (!user) {
    return false;
  }

  if (!existingItem) {
    return {
      id: user.id,
    };
  }

  return user.id === existingItem.id;
};

const isPermittedUser = ({authentication: {item: user}}) => {
  if (!user) {
    return false;
  }

  return user.permitted;
};

const ownsItemViaUser = async ({authentication: {item: user}}) => {
  if (!user) {
    return false;
  }

  return {
    user: {
      id: user.id,
    },
  };
};

const isAdminOrUser = (auth) => isAdmin(auth) || isUser(auth);

const isAdminOrPermittedUser = (auth) => isAdmin(auth) || isPermittedUser(auth);

const isAdminOrOwner = async (auth) => isAdmin(auth) || ownsItemViaUser(auth);

const grant = ({id, walletAddress}) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      {
        payload: {
          id,
          publicAddress: walletAddress,
        },
      },
      process.env.JWT_SECRET || constants.DEFAULT_JWT_SECRET,
      {
        algorithm: process.env.JWT_ALGORITHMS || constants.DEFAULT_JWT_ALGORITHMS,
      },
      (err, token) => {
        if (err) {
          return reject(err);
        }
        if (!token) {
          return new Error('Empty token');
        }
        return resolve(token);
      },
    ),
  );

const nonce = () =>
  Array.from(
    {
      length: 7,
    },
    () => Math.floor(Math.random() * 26 + 97),
  )
    .map((i) => String.fromCharCode(i))
    .join('');

module.exports = {
  isUser,
  isAdmin,
  ownsItemViaUser,
  isAdminOrOwner,
  isAdminOrUser,
  isPermittedUser,
  isAdminOrPermittedUser,
  grant,
  nonce,
};
