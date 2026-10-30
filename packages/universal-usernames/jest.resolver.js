// cborg (an address-encoder dependency) only exports an "import" condition,
// which Jest's CommonJS resolver never matches. Resolve it as ESM; babel-jest
// then transforms it (see transformIgnorePatterns in jest.config.js).
module.exports = (request, options) => {
  const isCborg = request === 'cborg' || request.startsWith('cborg/');
  return options.defaultResolver(request, isCborg ? { ...options, conditions: ['import'] } : options);
};
