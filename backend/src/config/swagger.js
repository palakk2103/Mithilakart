const config = require('./index');

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Mithilakart API',
    version: config.api.version,
    description: 'Mithilakart backend API — OpenAPI stub (Phase 0 foundation)',
  },
  servers: [
    {
      url: `http://localhost:${config.port}${config.api.basePath}/${config.api.version}`,
      description: 'Local development',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: {
          200: {
            description: 'Server is alive',
          },
        },
      },
    },
    '/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        responses: {
          200: {
            description: 'Dependencies are ready',
          },
          503: {
            description: 'Dependencies are not ready',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

module.exports = {
  openApiSpec,
};
