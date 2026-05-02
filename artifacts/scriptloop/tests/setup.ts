import "@testing-library/jest-dom/vitest";

// Provide minimal env so importing modules that read process.env at top
// level (e.g. r2-server creating an S3Client) doesn't crash. None of these
// are real — tests mock the modules that would otherwise try to use them.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.ELEVENLABS_API_KEY ??= "test-key";
process.env.R2_ACCOUNT_ID ??= "test-account";
process.env.R2_ACCESS_KEY_ID ??= "test-access-key";
process.env.R2_SECRET_ACCESS_KEY ??= "test-secret-key";
process.env.R2_BUCKET_NAME ??= "test-bucket";
process.env.R2_PUBLIC_URL ??= "https://test.example.com";
process.env.VITE_NEON_AUTH_URL ??= "https://auth.test.example.com";
