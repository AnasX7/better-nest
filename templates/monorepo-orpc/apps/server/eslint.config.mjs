import { nestJsConfig } from '@marifa/eslint-config/nest-js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nestJsConfig,
  {
    ignores: ['.prettierrc.mjs', 'eslint.config.mjs', 'webpack.config.js'],
  },
];
