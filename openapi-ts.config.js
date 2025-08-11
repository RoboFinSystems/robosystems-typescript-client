/** @type {import('@hey-api/openapi-ts').UserConfig} */
module.exports = {
  input: process.env.ROBOSYSTEMS_API_URL + '/openapi.json',
  output: {
    clean: false, // Preserve custom files like query.ts
    path: 'sdk',
  },
  plugins: ['@hey-api/client-fetch'],
}
