const {
  Text,
  Slug,
  DateTimeUtc,
  Checkbox,
  Password,
  File,
  Relationship,
} = require('@keystonejs/fields');
const {logging, atTracking, byTracking} = require('@keystonejs/list-plugins');
const ImageFileAdapter = require('../helpers/imageFileAdapter');
const {isAdmin, isAdminOrUser, isAdminOrPermittedUser} = require('../helpers/access');
const {DEFAULT_LOGGING, DEFAULT_AVATAR_DIRECTORY} = require('../helpers/constants');

let isLogging = DEFAULT_LOGGING || false;
if (process.env.LOGGING !== undefined) {
  isLogging = process.env.LOGGING === 'true';
}

module.exports = {
  fields: {
    walletAddress: {
      type: Text,
      isUnique: true,
      access: {
        update: isAdmin,
      },
    },
    lastSignedInAt: {
      type: DateTimeUtc,
      adminConfig: {
        isReadOnly: true,
      },
    },
    username: {
      type: Text,
      isUnique: true,
      // Since the field is unique but not required, we set sparse to true
      // See https://github.com/keystonejs/keystone/issues/3114
      mongooseOptions: {sparse: true},
    },
    email: {
      type: Text,
      isUnique: true,
      mongooseOptions: {sparse: true},
      access: {
        read: isAdminOrUser,
      },
    },
    emailValidationToken: {
      type: Text,
      isUnique: true,
      mongooseOptions: {sparse: true},
      access: isAdmin,
    },
    subscribeToLifecycleNotifications: {
      type: Checkbox,
      default: false,
    },
    subscribeToContractActivity: {
      type: Relationship,
      ref: 'Contract',
      many: true,
    },
    avatar: {
      type: File,
      adapter: new ImageFileAdapter({
        folder: DEFAULT_AVATAR_DIRECTORY,
      }),
    },
    nonce: {
      type: Slug,
      regenerateOnUpdate: true,
      adminConfig: {
        isReadOnly: true,
      },
      generate: () =>
        Array.from(
          {
            length: 7,
          },
          () => Math.floor(Math.random() * 26 + 97),
        )
          .map((i) => String.fromCharCode(i))
          .join(''),
    },
    password: {
      type: Password,
      access: {
        read: isAdmin,
        update: isAdmin,
      },
    },
    resetPassToken: {
      type: Text,
      isUnique: true,
      mongooseOptions: {sparse: true},
      access: () => false,
    },
    isAdmin: {
      type: Checkbox,
      default: false,
      access: {
        update: isAdmin,
      },
    },
    permitted: {
      type: Checkbox,
      default: true,
      access: {
        update: isAdmin,
      },
    },
    crawlerCheckpoints: {
      type: Relationship,
      ref: 'CrawlerCheckpoint.user',
      many: true,
    },
  },
  labelResolver: (item) => {
    let userLabel = '';
    if (item.walletAddress) {
      const wa = item.walletAddress.replace(/(\+?.{8})(.+)(.{4})/g, (match, start, middle, end) => {
        return start + '...' + end;
      });
      userLabel = `${wa} `;
    } else if (item.email) {
      userLabel = `${item.email} `;
    } else {
      userLabel = `${JSON.stringify(item.id)} `;
    }
    if (item.isAdmin) {
      userLabel += `🌎`;
    }
    const dateCreated = new Date(item.createdAt);
    const newUser = new Date(new Date() - 48 * 3600 * 1000);
    if (dateCreated > newUser) {
      userLabel += `🆕`;
    }
    return userLabel;
  },
  plugins: [
    logging((args) => {
      if (isLogging) {
        console.log(`User args: ${JSON.stringify(args)}`);
      }
    }),
    atTracking({}),
    byTracking({}),
  ],
  access: {
    read: isAdminOrPermittedUser,
    update: isAdminOrUser,
    delete: isAdmin,
    auth: true,
  },
};
