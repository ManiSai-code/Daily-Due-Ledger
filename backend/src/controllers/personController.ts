import { Request, Response } from 'express';
import {
  createPersonService,
  getAllPeopleService,
  getPersonByIdService,
  updateDailyAmountService,
  getDailyAmountHistoryService,
} from '../services/personService';
import { deletePerson } from '../services/personService';
export const createPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, phoneNumber, address, originalAmount, currentDailyAmount, startDate, notes } = req.body;

    if (!fullName || !phoneNumber || !originalAmount || !currentDailyAmount) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, phoneNumber, originalAmount, and currentDailyAmount are required.',
      });
      return;
    }

    const person = await createPersonService({
      fullName,
      phoneNumber,
      address,
      originalAmount: Number(originalAmount),
      currentDailyAmount: Number(currentDailyAmount),
      startDate: startDate ? new Date(startDate) : undefined,
      notes,
    });

    res.status(201).json({
      success: true,
      data: person,
      message: 'Person profile created successfully.',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getAllPeople = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;

    const people = await getAllPeopleService(search, status);

    res.status(200).json({
      success: true,
      count: people.length,
      data: people,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getPersonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Person ID parameter is required.',
      });
      return;
    }

    const person = await getPersonByIdService(id);

    res.status(200).json({
      success: true,
      data: person,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
export const updateDailyAmount = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newDailyAmount, reason } = req.body;

    if (!id || newDailyAmount === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: id and newDailyAmount are required.',
      });
      return;
    }

    const result = await updateDailyAmountService(id, Number(newDailyAmount), reason);

    res.status(200).json({
      success: true,
      message: 'Daily payment amount updated successfully.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getDailyAmountHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Person ID is required.',
      });
      return;
    }

    const history = await getDailyAmountHistoryService(id);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
export const deletePersonHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string; // <--- Cast explicitly to string
    await deletePerson(id);
    res.status(200).json({ success: true, message: 'Person record deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};