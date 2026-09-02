// Gauntlet lint rules. In eslint.config.mjs (flat config):
//   import { forgeConfigs } from './eslint.forge.mjs';
//   export default [ ...yourExistingConfigs, ...forgeConfigs ];
import sonarjs from 'eslint-plugin-sonarjs';

const THRESHOLDS = { complexity: 6, cognitive: 10, lines: 40, depth: 3, params: 4 };

export const forgeConfigs = [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.module.ts', '**/main.ts', '**/*.d.ts'],
    plugins: { sonarjs },
    rules: {
      complexity: ['error', THRESHOLDS.complexity],
      'sonarjs/cognitive-complexity': ['error', THRESHOLDS.cognitive],
      'max-lines-per-function': ['error', { max: THRESHOLDS.lines, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', THRESHOLDS.depth],
      'max-params': ['error', THRESHOLDS.params],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'error',
        { selector: "Literal[value=/^\\/\\*\\s*istanbul ignore/]", message: 'Coverage exclusions are not allowed.' },
      ],
    },
  },
  {
    // Domain layer must not know the framework, the ORM, or HTTP.
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@nestjs/*', 'typeorm', '@prisma/*', 'prisma', '@mikro-orm/*', 'mongoose', 'drizzle-orm', 'axios', 'node-fetch', 'next', 'next/*', 'react', 'react/*'], message: 'domain/ is pure. Use a port in application/ports.' },
            { group: ['**/infrastructure/**', '**/application/**', '**/presentation/**'], message: 'domain/ imports only domain/.' },
          ],
        },
      ],
    },
  },
];

export default forgeConfigs;
