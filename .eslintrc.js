module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "no-console": "warn",
        "no-var": "error",
        "indent": "error",
        "no-multi-spaces": "error",
        "space-in-parens": "error",
        "no-multiple-empty-lines": "error",
        "prefer-const": "error",
        "no-use-before-define": "error",
        'array-callback-return': 'error',
        'block-scoped-var': 'error',
        complexity: 'error',
        'consistent-return': 'error',
        eqeqeq: ['off', 'smart'],
        'guard-for-in': 'error',
        'no-alert': 'error',
        'no-caller': 'error',
        'no-div-regex': 'error',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-extra-label': 'error',
        'no-floating-decimal': 'error',
        'no-implied-eval': 'error',
        'no-iterator': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-loop-func': 'error',
        'no-new': 'error',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-proto': 'error',
        'no-restricted-properties': 'error',
        'no-return-assign': 'error',
        'no-return-await': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'off',
        'no-useless-escape': 'off',
        'no-useless-return': 'error',
        'no-void': 'error',
        'no-with': 'error',
        'require-await': 'off',
        'wrap-iife': 'error',
    
        "sonarjs/no-duplicate-string":"off",
        "sonarjs/cognitive-complexity":"off",
        "sonarjs/no-identical-functions":"off",
    
    },
    "plugins": ["sonarjs"],
    "extends": ["plugin:sonarjs/recommended"]

};
