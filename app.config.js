import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    azureEndpoint: process.env.AZURE_ENDPOINT,
    openaiKey: process.env.OPENAI_KEY,
    GROK_API_KEY: process.env.GROK_API_KEY,
    GROK_BASE_URL: process.env.GROK_BASE_URL,
  },
  
});
