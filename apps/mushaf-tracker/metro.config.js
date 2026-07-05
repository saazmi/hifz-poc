const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo setup: watch the whole workspace and resolve node_modules from both
// the app and the workspace root.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// Allow importing JSON data files (quran-structure.json) from @hifz/core.
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "json",
];

module.exports = config;
