import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'data/**/*', 'coverage/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
