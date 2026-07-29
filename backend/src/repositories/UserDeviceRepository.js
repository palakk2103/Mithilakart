const { BaseRepository } = require('../core/BaseRepository');
const UserDevice = require('../models/UserDevice');

class UserDeviceRepository extends BaseRepository {
  constructor() {
    super(UserDevice);
  }

  async upsertDevice(data, session = null) {
    const filter = {
      userId: data.userId,
      portal: data.portal,
      deviceId: data.deviceId,
    };

    const update = {
      ...data,
      lastActiveAt: new Date(),
    };

    const query = this.model.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    if (session) {
      query.session(session);
    }

    return query.exec();
  }
}

module.exports = {
  UserDeviceRepository,
};
