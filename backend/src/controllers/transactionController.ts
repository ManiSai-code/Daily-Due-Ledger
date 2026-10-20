import { Request, Response } from 'express';
import { recordPaymentService, getPersonPaymentHistoryService } from '../services/transactionService';

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personId, amount, paymentMethod, notes, paymentDate } = req.body;

    if (!personId || amount === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: personId and amount are required.',
      });
      return;
    }

    const result = await recordPaymentService({
      personId,
      amount: Number(amount),
      paymentMethod,
      notes,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getPersonTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const personId = Array.isArray(req.params.personId)
      ? req.params.personId[0]
      : req.params.personId;

    if (!personId) {
      res.status(400).json({
        success: false,
        error: 'personId parameter is required.',
      });
      return;
    }

    const history = await getPersonPaymentHistoryService(personId);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};