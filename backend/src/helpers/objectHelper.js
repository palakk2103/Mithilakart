function pickDefined(object) {
  return Object.entries(object).reduce((accumulator, [key, value]) => {
    if (value !== undefined && value !== null) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function omitUndefined(object) {
  return pickDefined(object);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, source) {
  const output = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });

  return output;
}

module.exports = {
  pickDefined,
  omitUndefined,
  isPlainObject,
  deepMerge,
};
