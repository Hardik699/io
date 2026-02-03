import { Router, RequestHandler } from "express";
import { SalaryRecord } from "../models/SalaryRecord";

const router = Router();

// Get all salary records
const getSalaryRecords: RequestHandler = async (_req, res) => {
  try {
    const records = await SalaryRecord.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch salary records",
    });
  }
};

// Get salary record by ID
const getSalaryRecordById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SalaryRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found",
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch salary record",
    });
  }
};

// Get salary records by employee ID
const getSalaryRecordsByEmployeeId: RequestHandler = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = req.query.year as string;

    let query: any = { employeeId };
    if (year) {
      query.year = parseInt(year, 10);
    }

    const records = await SalaryRecord.find(query).sort({ month: -1 });

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch salary records by employee",
    });
  }
};

// Get salary records by month and year
const getSalaryRecordsByMonth: RequestHandler = async (req, res) => {
  try {
    const { month, year } = req.params;

    const records = await SalaryRecord.find({
      month,
      year: parseInt(year, 10),
    });

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch salary records by month",
    });
  }
};

// Create salary record
const createSalaryRecord: RequestHandler = async (req, res) => {
  try {
    const recordData = req.body;

    const record = new SalaryRecord(recordData);
    await record.save();

    res.status(201).json({
      success: true,
      data: record,
      message: "Salary record created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create salary record",
    });
  }
};

// Update salary record
const updateSalaryRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await SalaryRecord.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found",
      });
    }

    res.json({
      success: true,
      data: record,
      message: "Salary record updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update salary record",
    });
  }
};

// Delete salary record
const deleteSalaryRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SalaryRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found",
      });
    }

    res.json({
      success: true,
      data: record,
      message: "Salary record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete salary record",
    });
  }
};

router.get("/", getSalaryRecords);
router.get("/employee/:employeeId", getSalaryRecordsByEmployeeId);
router.get("/month/:month/:year", getSalaryRecordsByMonth);
router.get("/:id", getSalaryRecordById);
router.post("/", createSalaryRecord);
router.put("/:id", updateSalaryRecord);
router.delete("/:id", deleteSalaryRecord);

export { router as salaryRecordsRouter };
