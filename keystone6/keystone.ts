import { config, list } from '@keystone-6/core';
import type { ListSchemaConfig, DatabaseConfig, AdminUIConfig, KeystoneConfig } from '@keystone-6/core/types';
import { text } from '@keystone-6/core/fields';

export default config({
    ui: {
        isDisabled: false,
        isAccessAllowed: async context => true,
        // Optional advanced configuration
        publicPages: ['/welcome'],
        getAdditionalFiles: [
          async (config: KeystoneConfig) => [
            {
              mode: 'write',
              src: `
                /** @jsxRuntime classic */
    /** @jsx jsx */
                import { jsx } from '@keystone-ui/core';
                export default function Welcome() {
                  return (<h1>Welcome to my Keystone system</h1>);
                }`,
              outputPath: 'pages/welcome.js',
            },
            {
              mode: 'copy',
              inputPath: '...',
              outputPath: 'pages/farewell.js',
            }
          ],
        ],
      },
    lists: {
        User: list({
            fields: {
            name: text({ validation: { isRequired: true } }),
            email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
            },
        }),
    },
    db: {
      provider: 'postgresql',
      url: 'postgres://postgres:U9J766xAVG%w7uLX@host:5432/keystone',
      onConnect: async context => { /* ... */ },
      // Optional advanced configuration
      enableLogging: true,
      useMigrations: true,
      idField: { kind: 'uuid' },
      shadowDatabaseUrl: 'postgres://postgres:U9J766xAVG%w7uLX@host:5432/shadowdb'
    },
    /* ... */
  });