module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "pref",
        "test",
        "chore",
        "revert",
        "build",
        "workflow",
      ],
    ],
    "subject-case": [0],
  },
};