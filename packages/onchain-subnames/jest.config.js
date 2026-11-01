module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
