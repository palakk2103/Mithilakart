const { AdminPlatformSettingsService } = require('../../../src/services/admin/AdminPlatformSettingsService');
const { PlatformConfigService } = require('../../../src/services/platform/PlatformConfigService');

describe('Header Tabs Configuration', () => {
  describe('AdminPlatformSettingsService header tabs', () => {
    let service;
    let platformSettingRepository;
    let commissionRuleRepository;
    let platformConfigService;

    beforeEach(() => {
      platformSettingRepository = {
        findByKey: jest.fn(),
        create: jest.fn(),
        updateById: jest.fn(),
      };
      commissionRuleRepository = {};
      platformConfigService = {
        invalidateCache: jest.fn(),
      };

      service = new AdminPlatformSettingsService({
        platformSettingRepository,
        commissionRuleRepository,
        platformConfigService,
      });
    });

    it('getHeaderTabs returns null if no setting row found', async () => {
      platformSettingRepository.findByKey.mockResolvedValue(null);
      const tabs = await service.getHeaderTabs();
      expect(tabs).toBeNull();
      expect(platformSettingRepository.findByKey).toHaveBeenCalledWith('headerTabsConfig');
    });

    it('getHeaderTabs returns stored array', async () => {
      const mockTabs = [{ id: 'mithilakart', label: 'Home', enabled: true }];
      platformSettingRepository.findByKey.mockResolvedValue({ key: 'headerTabsConfig', value: mockTabs });
      const tabs = await service.getHeaderTabs();
      expect(tabs).toEqual(mockTabs);
    });

    it('updateHeaderTabs validates input is array', async () => {
      await expect(service.updateHeaderTabs('not-an-array', 'admin-1')).rejects.toThrow();
    });

    it('updateHeaderTabs creates setting row if not existing and invalidates cache', async () => {
      platformSettingRepository.findByKey.mockResolvedValue(null);
      const mockTabs = [{ id: 'quickshop', label: 'Quick', enabled: true }];
      platformSettingRepository.create.mockResolvedValue({ key: 'headerTabsConfig', value: mockTabs });

      const result = await service.updateHeaderTabs(mockTabs, 'admin-1');
      expect(platformSettingRepository.create).toHaveBeenCalledWith({
        key: 'headerTabsConfig',
        value: mockTabs,
        updatedBy: 'admin-1',
      });
      expect(platformConfigService.invalidateCache).toHaveBeenCalled();
      expect(result.value).toEqual(mockTabs);
    });

    it('updateHeaderTabs updates existing row', async () => {
      platformSettingRepository.findByKey.mockResolvedValue({ _id: 'setting-id-1', key: 'headerTabsConfig' });
      const mockTabs = [{ id: 'freshgrocery', label: 'Fresh', enabled: true }];
      platformSettingRepository.updateById.mockResolvedValue({ _id: 'setting-id-1', value: mockTabs });

      const result = await service.updateHeaderTabs(mockTabs, 'admin-1');
      expect(platformSettingRepository.updateById).toHaveBeenCalledWith('setting-id-1', {
        value: mockTabs,
        updatedBy: 'admin-1',
      });
      expect(platformConfigService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('PlatformConfigService header tabs', () => {
    let service;
    let platformSettingRepository;
    let deliveryChargeRuleRepository;
    let cacheService;

    beforeEach(() => {
      platformSettingRepository = {
        find: jest.fn(),
      };
      deliveryChargeRuleRepository = {
        findActive: jest.fn().mockResolvedValue([]),
      };
      cacheService = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        del: jest.fn(),
      };

      service = new PlatformConfigService({
        platformSettingRepository,
        deliveryChargeRuleRepository,
        cacheService,
      });
    });

    it('getPublicConfig includes headerTabs when set', async () => {
      const mockTabs = [{ id: 'tab1', label: 'Tab 1', enabled: true }];
      platformSettingRepository.find.mockResolvedValue([
        { key: 'headerTabsConfig', value: mockTabs },
      ]);

      const publicConfig = await service.getPublicConfig();
      expect(publicConfig.headerTabs).toEqual(mockTabs);
    });

    it('getHeaderTabs returns headerTabsConfig', async () => {
      const mockTabs = [{ id: 'tab1', label: 'Tab 1', enabled: true }];
      platformSettingRepository.find.mockResolvedValue([
        { key: 'headerTabsConfig', value: mockTabs },
      ]);

      const tabs = await service.getHeaderTabs();
      expect(tabs).toEqual(mockTabs);
    });
  });
});
