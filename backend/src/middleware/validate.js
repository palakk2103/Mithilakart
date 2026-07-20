const { AppError } = require('../utils/AppError');

function formatJoiDetails(error) {
  return error.details.map((detail) => ({
    field: detail.path.join('.') || 'body',
    message: detail.message.replace(/"/g, ''),
  }));
}

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return next(AppError.validation('Validation failed', formatJoiDetails(error)));
    }

    req[source] = value;
    return next();
  };
}

function validateQuery(schema) {
  return validate(schema, 'query');
}

function validateParams(schema) {
  return validate(schema, 'params');
}

function validateBody(schema) {
  return validate(schema, 'body');
}

module.exports = {
  validate,
  validateQuery,
  validateParams,
  validateBody,
  formatJoiDetails,
};
