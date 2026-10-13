/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: { metaObjectReplacement: { env: { VITE_API_URL: 'http://localhost:5000/api/v1' } } }
          }
        ]
      },
      tsconfig: {
        jsx: "react-jsx",
        esModuleInterop: true,
        verbatimModuleSyntax: false
      }
    }]
  }
};
