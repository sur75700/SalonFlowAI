module.exports = {
  preset: "jest-expo",
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  testMatch: [
    "<rootDir>/__tests__/**/*.test.[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(" +
      "(jest-)?react-native|" +
      "@react-native(-community)?|" +
      "expo(nent)?|" +
      "@expo(nent)?/.*|" +
      "expo-modules-core|" +
      "@react-navigation/.*|" +
      "react-native-svg" +
    ")/)",
  ],
};
