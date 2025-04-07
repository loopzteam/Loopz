module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start", // Assumes 'npm run build' has been run before
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/login",
        "http://localhost:3000/dashboard",
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        // Core Web Vitals are implicitly checked by 'lighthouse:recommended'
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
