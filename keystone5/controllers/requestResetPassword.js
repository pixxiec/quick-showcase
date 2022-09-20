const {v4: uuidv4} = require('uuid');
const {sendResetPassEmail} = require('../helpers/email');

module.exports = (adapter) => async (_, {email}) => {
  const user = await adapter.findOne({email});

  if (user) {
    const resetPassToken = uuidv4();

    await adapter.update(user.id, {resetPassToken});
    await sendResetPassEmail(user, resetPassToken);

    return {success: true};
  }

  return {success: false};
};
