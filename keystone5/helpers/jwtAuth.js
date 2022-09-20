const {PassportAuthStrategy} = require('@keystonejs/auth-passport');

module.exports = (keystone) =>
  keystone.createAuthStrategy({
    type: PassportAuthStrategy,
    list: 'User',
    config: {
      idField: 'walletAddress',
      loginPath: '/login',
      callbackPath: '/login/callback',

      resolveCreateData: ({createData, serviceProfile}) => ({
        ...createData,
      }),

      onAuthenticated: async (_, req, res) => {
        res.redirect(`${process.env.FRONTEND_URI}/auth/google/success`);
      },

      onError: (errors, req, res) => {
        const error = Array.isArray(errors) ? errors[0] : errors;
        let {message} = error;

        if (error.message === 'Unable to create a passportSession.item<User>') {
          message = 'Email is already registered using password authentication';
        }

        res.redirect(`${process.env.FRONTEND_URI}/auth/google/error?msg=${message}`);
      },
    },
  });
