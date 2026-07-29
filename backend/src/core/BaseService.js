class BaseService {
  constructor(repository = null) {
    this.repository = repository;
  }
}

module.exports = {
  BaseService,
};
