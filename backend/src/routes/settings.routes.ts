import { Router, Request, Response } from 'express';
import { StoreSettings } from '../types';
import { isGemmaConfigured } from '../services/gemma.service';
import { getStoreSettingsFromDb, saveStoreSettingsToDb } from '../db/mongo';

export const settingsRouter = Router();

const defaultSettings: StoreSettings = {
  storeName: 'AeroCraft Solo Commerce',
  sellerName: 'Pranjal Gupta',
  currency: 'USD ($)',
  defaultTone: 'persuasive',
  targetMarket: 'Remote professionals, designers, and EDC enthusiasts',
  aiProviderConfigured: isGemmaConfigured(),
  demoModeActive: !isGemmaConfigured(),
};

settingsRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const persisted = await getStoreSettingsFromDb('default');
    const settings = persisted || defaultSettings;
    res.status(200).json({
      ...settings,
      aiProviderConfigured: isGemmaConfigured(),
      demoModeActive: !isGemmaConfigured(),
    });
  } catch (err: any) {
    res.status(200).json({
      ...defaultSettings,
      aiProviderConfigured: isGemmaConfigured(),
      demoModeActive: !isGemmaConfigured(),
    });
  }
});

settingsRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const current = (await getStoreSettingsFromDb('default')) || defaultSettings;
    const updates = req.body as Partial<StoreSettings>;
    const updatedSettings: StoreSettings = {
      ...current,
      ...updates,
      aiProviderConfigured: isGemmaConfigured(),
      demoModeActive: !isGemmaConfigured(),
    };

    await saveStoreSettingsToDb('default', updatedSettings);

    res.status(200).json({
      message: 'Store settings updated successfully',
      data: updatedSettings,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save store settings',
    });
  }
});
