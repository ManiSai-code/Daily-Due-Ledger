import { Request, Response } from 'express';
import { getDashboardStatsService } from '../services/dashboardService';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getDashboardStatsService();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};