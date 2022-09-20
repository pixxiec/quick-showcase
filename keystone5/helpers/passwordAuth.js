const {PasswordAuthStrategy} = require('@keystonejs/auth-password');

module.exports = (keystone) =>
  keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
    config: {
      protectIdentities: process.env.NODE_ENV === 'production',
    },
  });
