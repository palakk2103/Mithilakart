const { BaseRepository } = require('../core/BaseRepository');
const CmsPage = require('../models/CmsPage');

class CmsPageRepository extends BaseRepository {
  constructor() {
    super(CmsPage);
  }

  async findPublishedBySlug(slug) {
    return this.findOne({ slug: slug.toLowerCase(), isPublished: true });
  }

  async findBySlug(slug) {
    return this.findOne({ slug: slug.toLowerCase() });
  }
}

module.exports = {
  CmsPageRepository,
};
