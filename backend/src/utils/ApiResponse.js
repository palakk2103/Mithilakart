class ApiResponse {
  static _requestId(res) {
    return res.locals.requestId;
  }

  static success(res, data = null, meta = null, statusCode = 200) {
    const payload = {
      success: true,
      data,
      requestId: ApiResponse._requestId(res),
    };

    if (meta !== null && meta !== undefined) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  static error(res, statusCode, code, message, details = null) {
    const payload = {
      success: false,
      error: {
        code,
        message,
      },
      requestId: ApiResponse._requestId(res),
    };

    if (details !== null && details !== undefined) {
      payload.error.details = details;
    }

    return res.status(statusCode).json(payload);
  }

  static fromAppError(res, error) {
    return ApiResponse.error(
      res,
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
  }

  static paginated(res, data, paginationMeta, statusCode = 200) {
    const { page, limit, total } = paginationMeta;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return ApiResponse.success(
      res,
      data,
      {
        page,
        limit,
        total,
        totalPages,
      },
      statusCode
    );
  }

  static created(res, data, meta = null) {
    return ApiResponse.success(res, data, meta, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = {
  ApiResponse,
};
