module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Convert all errors to warnings
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'warn',
    'no-unused-vars': 'warn',
    'import/no-anonymous-default-export': 'warn',
    '@next/next/no-img-element': 'warn',
    '@next/next/no-html-link-for-pages': 'warn',
    // Add any other specific rules you want to downgrade from error to warning
  },
  // This will downgrade all errors to warnings
  reportUnusedDisableDirectives: 'warn',
  settings: {
    next: {
      rootDir: '.',
    },
  },
  ignorePatterns: [
    'node_modules',
    '.next',
    'out',
    'public'
  ]
}; 