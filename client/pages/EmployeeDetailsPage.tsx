import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  ArrowLeft,
  Edit,
  Save,
  X,
  Upload,
  Trash2,
  Eye,
  DollarSign,
  Plus,
  Image,
  FileText,
  CreditCard,
  Landmark,
  Briefcase,
  CalendarDays,
  UserX,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileToSupabase, uploadBase64ToSupabase } from "@/lib/supabase";
import AppNav from "@/components/Navigation";
import SuccessModal from "@/components/SuccessModal";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  birthDate: string;
  bloodGroup: string;
  mobileNumber: string;
  emergencyMobileNumber: string;
  alternativeMobileNumber: string;
  email: string;
  address: string;
  permanentAddress: string;
  photo?: string;
  joiningDate: string;
  department: string;
  position: string;
  tableNumber: string;
  accountNumber: string;
  ifscCode: string;
  bankPassbook?: string;
  aadhaarNumber: string;
  panNumber: string;
  uanNumber: string;
  uanSkipReason?: string;
  salary: string;
  aadhaarCard?: string;
  panCard?: string;
  passport?: string;
  drivingLicense?: string;
  resume?: string;
  medicalCertificate?: string;
  educationCertificate?: string;
  experienceLetter?: string;
  status: "active" | "inactive";
  deactivationReason?: string;
  resignationLetter?: string;
  deactivationDate?: string;
}

interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  totalWorkingDays: number;
  actualWorkingDays: number;
  basicSalary: number;
  bonus?: number;
  deductions?: number;
  totalSalary: number;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  manager: string;
  employeeCount: number;
}

const documentTypes = [
  { key: "aadhaarCard", label: "Aadhaar Card", icon: CreditCard },
  { key: "panCard", label: "PAN Card", icon: CreditCard },
  { key: "passport", label: "Passport", icon: FileText },
  { key: "drivingLicense", label: "Driving License", icon: CreditCard },
  { key: "resume", label: "Resume/CV", icon: FileText },
  { key: "medicalCertificate", label: "Medical Certificate", icon: FileText },
  {
    key: "educationCertificate",
    label: "Education Certificate",
    icon: FileText,
  },
  { key: "experienceLetter", label: "Experience Letter", icon: FileText },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EmployeeDetailsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"details" | "salary">("details");
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    month: "",
    totalWorkingDays: "",
    actualWorkingDays: "",
    basicSalary: "",
    bonus: "",
    deductions: "",
    paymentDate: "",
    notes: "",
  });
  const [documentPreviewModal, setDocumentPreviewModal] = useState<{
    isOpen: boolean;
    documentUrl: string;
    documentType: string;
    employeeName: string;
  }>({
    isOpen: false,
    documentUrl: "",
    documentType: "",
    employeeName: "",
  });

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
  }>({
    isOpen: false,
    title: "Success!",
    message: "Data saved successfully!",
  });

  useEffect(() => {
    const loadData = async () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      const role = localStorage.getItem("userRole");

      if (!isAuthenticated || (role !== "admin" && role !== "hr")) {
        navigate("/login");
        return;
      }

      try {
        // Load employee data from API
        const [empRes, deptRes, salaryRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/departments"),
          fetch("/api/salary-records"),
        ]);

        let employees: Employee[] = [];
        let dept: Department[] = [];
        let salary: SalaryRecord[] = [];

        if (empRes.ok) {
          const empData = await empRes.json();
          if (empData.success) {
            // Normalize employees: map _id to id
            employees = empData.data.map((emp: any) => ({
              ...emp,
              id: emp._id || emp.id,
            }));
          }
        }
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (deptData.success) {
            // Normalize departments: map _id to id
            dept = deptData.data.map((d: any) => ({
              ...d,
              id: d._id || d.id,
            }));
          }
        }
        if (salaryRes.ok) {
          const salaryData = await salaryRes.json();
          if (salaryData.success) {
            // Normalize salary records: map _id to id
            salary = salaryData.data.map((s: any) => ({
              ...s,
              id: s._id || s.id,
            }));
          }
        }

        setDepartments(dept);
        setSalaryRecords(salary);

        if (employeeId) {
          const found = employees.find(
            (e) => e.id === employeeId || e._id === employeeId,
          );
          if (found) {
            setEmployee(found);
            console.log("Employee loaded:", found);
          } else {
            console.warn("Employee not found with ID:", employeeId);
            toast.error("❌ Employee Not Found", {
              description:
                "This employee record could not be found in the system.",
            });
            navigate("/hr");
          }
        }
      } catch (error) {
        console.error("Failed to load employee details:", error);
      }
    };

    loadData();
  }, [employeeId, navigate]);

  const handleStartEdit = () => {
    if (employee) {
      setIsEditing(true);
      setEditForm({ ...employee });
      setEditPhotoPreview(employee.photo || "");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
    setEditPhotoPreview("");
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditPhotoPreview(result);
        handleEditFormChange("photo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditDocumentUpload =
    (docKey: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          toast.loading(`Uploading ${docKey}...`);
          const fileUrl = await uploadFileToSupabase(
            file,
            `documents/${docKey.toLowerCase().replace(/\s+/g, "-")}`,
          );
          toast.dismiss();
          handleEditFormChange(docKey, fileUrl);
          toast.success("📄 Document Uploaded!", {
            description: "Document has been successfully uploaded.",
          });
        } catch (error) {
          toast.dismiss();
          console.error(`Error uploading ${docKey}:`, error);
          toast.error(`Failed to upload ${docKey}`);
        }
      }
    };

  const handleSaveEmployee = async () => {
    if (!employee) return;

    const pendingTable =
      (editForm.tableNumber as string) ?? employee.tableNumber;
    if (pendingTable) {
      const n = parseInt(pendingTable, 10);
      const employees = JSON.parse(
        localStorage.getItem("hrEmployees") || "[]",
      ) as Employee[];
      const taken = new Set(
        employees
          .filter(
            (e) =>
              e.status === "active" && e.id !== employee.id && e.tableNumber,
          )
          .map((e) => parseInt(e.tableNumber, 10))
          .filter((x) => !Number.isNaN(x)),
      );
      if (Number.isNaN(n) || n < 1 || n > 32 || taken.has(n)) {
        alert(
          "Selected table number is invalid or already assigned to an active employee",
        );
        return;
      }
    }

    try {
      const updatedEmployee = { ...employee, ...editForm };

      // Save to API
      if (employee._id) {
        await fetch(`/api/employees/${employee._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEmployee),
        });
      }

      setEmployee(updatedEmployee);
      setIsEditing(false);
      setEditForm({});
      setSuccessModal({
        isOpen: true,
        title: "✅ Employee Updated!",
        message: `${employee.fullName}'s information has been successfully saved.`,
      });
    } catch (error) {
      console.error("Failed to save employee:", error);
      toast.error("Failed to save employee information");
    }
  };

  const handleAddSalaryRecord = async () => {
    if (
      !employee ||
      !salaryForm.month ||
      !salaryForm.totalWorkingDays ||
      !salaryForm.actualWorkingDays ||
      !salaryForm.basicSalary
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const basicSalary = parseFloat(salaryForm.basicSalary);
    const bonus = parseFloat(salaryForm.bonus) || 0;
    const deductions = parseFloat(salaryForm.deductions) || 0;
    const totalSalary = basicSalary + bonus - deductions;

    const existingRecord = salaryRecords.find(
      (record) =>
        record.employeeId === employee.id && record.month === salaryForm.month,
    );

    if (existingRecord) {
      alert(
        "Salary record already exists for this month. Please edit the existing record.",
      );
      return;
    }

    const newRecord: SalaryRecord = {
      id: Date.now().toString(),
      employeeId: employee.id,
      month: salaryForm.month,
      year: parseInt(salaryForm.month.split("-")[0]),
      totalWorkingDays: parseInt(salaryForm.totalWorkingDays),
      actualWorkingDays: parseInt(salaryForm.actualWorkingDays),
      basicSalary: basicSalary,
      bonus: bonus || undefined,
      deductions: deductions || undefined,
      totalSalary: totalSalary,
      paymentDate: salaryForm.paymentDate || undefined,
      notes: salaryForm.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save to API
      await fetch("/api/salary-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      const updatedRecords = [...salaryRecords, newRecord];
      setSalaryRecords(updatedRecords);
    } catch (error) {
      console.error("Failed to save salary record:", error);
      alert("Failed to save salary record");
      return;
    }

    setSalaryForm({
      month: "",
      totalWorkingDays: "",
      actualWorkingDays: "",
      basicSalary: "",
      bonus: "",
      deductions: "",
      paymentDate: "",
      notes: "",
    });
    setShowSalaryForm(false);
    toast.success("✨ Salary Record Created!", {
      description: `Salary record for ${salaryForm.month} has been added successfully.`,
    });
  };

  const handleDeleteSalaryRecord = (recordId: string) => {
    if (confirm("Are you sure you want to delete this salary record?")) {
      const updatedRecords = salaryRecords.filter(
        (record) => record.id !== recordId,
      );
      setSalaryRecords(updatedRecords);
      // TODO: Call API to delete salary record from MongoDB
    }
  };

  const handleOpenDocumentPreview = (
    documentUrl: string,
    documentType: string,
    employeeName: string,
  ) => {
    setDocumentPreviewModal({
      isOpen: true,
      documentUrl,
      documentType,
      employeeName,
    });
  };

  const getEmployeeSalaryRecords = () => {
    return salaryRecords
      .filter((record) => record.employeeId === employee?.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-deep-900 via-blue-deep-800 to-slate-900">
        <AppNav />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-slate-400">Loading employee details...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-deep-900 via-blue-deep-800 to-slate-900">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {employee.photo && (
              <img
                src={employee.photo}
                alt={employee.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isEditing ? "Edit Employee" : "Employee Details"}
              </h1>
              <p className="text-slate-400">
                {employee.fullName} • {employee.department}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/hr")}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to HR Dashboard
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700 w-fit">
            <Button
              onClick={() => {
                setActiveTab("details");
                setIsEditing(false);
              }}
              variant={activeTab === "details" ? "default" : "ghost"}
              size="sm"
              className={`${activeTab === "details" ? "bg-blue-500 text-white" : "text-slate-300 hover:text-white"}`}
            >
              <User className="h-4 w-4 mr-2" />
              Details
            </Button>
            <Button
              onClick={() => {
                setActiveTab("salary");
                setIsEditing(false);
              }}
              variant={activeTab === "salary" ? "default" : "ghost"}
              size="sm"
              className={`${activeTab === "salary" ? "bg-blue-500 text-white" : "text-slate-300 hover:text-white"}`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Salary
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {activeTab === "details" && (
            <>
              {!isEditing ? (
                <Button
                  onClick={handleStartEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveEmployee}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 space-y-8">
              {/* Photo Section */}
              {isEditing && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                    <Image className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Employee Photo
                    </h3>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800/30 overflow-hidden">
                      {editPhotoPreview || employee.photo ? (
                        <img
                          src={editPhotoPreview || employee.photo}
                          alt="Employee"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Image className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">No Photo</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditPhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {employee.photo ? "Change Photo" : "Add Photo"}
                        </Button>
                      </div>

                      {(editPhotoPreview || employee.photo) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditPhotoPreview("");
                            handleEditFormChange("photo", "");
                          }}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Photo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Full Name", key: "fullName", type: "text" },
                    { label: "Father's Name", key: "fatherName", type: "text" },
                    { label: "Mother's Name", key: "motherName", type: "text" },
                    { label: "Birth Date", key: "birthDate", type: "date" },
                    {
                      label: "Blood Group",
                      key: "bloodGroup",
                      type: "select",
                      options: bloodGroups,
                    },
                    { label: "Email", key: "email", type: "email" },
                    {
                      label: "Mobile Number",
                      key: "mobileNumber",
                      type: "tel",
                    },
                    {
                      label: "Emergency Mobile",
                      key: "emergencyMobileNumber",
                      type: "tel",
                    },
                    {
                      label: "Alternative Number",
                      key: "alternativeMobileNumber",
                      type: "tel",
                    },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-slate-300">{field.label}</Label>
                      {isEditing ? (
                        field.type === "select" ? (
                          <Select
                            value={
                              (editForm[
                                field.key as keyof Employee
                              ] as string) ||
                              (employee[field.key as keyof Employee] as string)
                            }
                            onValueChange={(value) =>
                              handleEditFormChange(field.key, value)
                            }
                          >
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type}
                            value={
                              (editForm[
                                field.key as keyof Employee
                              ] as string) ||
                              (employee[field.key as keyof Employee] as string)
                            }
                            onChange={(e) =>
                              handleEditFormChange(field.key, e.target.value)
                            }
                            className="bg-slate-800/50 border-slate-700 text-white"
                          />
                        )
                      ) : (
                        <p className="text-white p-2 bg-slate-800/30 rounded border border-slate-700">
                          {(employee[field.key as keyof Employee] as string) ||
                            "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Current Address", key: "address" },
                    { label: "Permanent Address", key: "permanentAddress" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-slate-300">{field.label}</Label>
                      {isEditing ? (
                        <Textarea
                          value={
                            (editForm[field.key as keyof Employee] as string) ||
                            (employee[field.key as keyof Employee] as string)
                          }
                          onChange={(e) =>
                            handleEditFormChange(field.key, e.target.value)
                          }
                          className="bg-slate-800/50 border-slate-700 text-white h-20"
                        />
                      ) : (
                        <p className="text-white p-2 bg-slate-800/30 rounded border border-slate-700 min-h-[80px]">
                          {(employee[field.key as keyof Employee] as string) ||
                            "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                  <Briefcase className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Job Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Department",
                      key: "department",
                      type: "select",
                      options: departments.map((d) => d.name),
                    },
                    { label: "Position", key: "position", type: "text" },
                    { label: "Joining Date", key: "joiningDate", type: "date" },
                    {
                      label: "Table Number",
                      key: "tableNumber",
                      type: "select",
                      options: Array.from({ length: 32 }, (_, i) =>
                        String(i + 1),
                      ),
                    },
                    { label: "Salary", key: "salary", type: "text" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-slate-300">{field.label}</Label>
                      {isEditing ? (
                        field.type === "select" ? (
                          <Select
                            value={
                              (editForm[
                                field.key as keyof Employee
                              ] as string) ||
                              (employee[field.key as keyof Employee] as string)
                            }
                            onValueChange={(value) =>
                              handleEditFormChange(field.key, value)
                            }
                          >
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-60 overflow-y-auto">
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type}
                            value={
                              (editForm[
                                field.key as keyof Employee
                              ] as string) ||
                              (employee[field.key as keyof Employee] as string)
                            }
                            onChange={(e) =>
                              handleEditFormChange(field.key, e.target.value)
                            }
                            className="bg-slate-800/50 border-slate-700 text-white"
                          />
                        )
                      ) : (
                        <p className="text-white p-2 bg-slate-800/30 rounded border border-slate-700">
                          {(employee[field.key as keyof Employee] as string) ||
                            "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Banking Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                  <Landmark className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Banking Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Account Number", key: "accountNumber" },
                    { label: "IFSC Code", key: "ifscCode" },
                    { label: "Aadhaar Number", key: "aadhaarNumber" },
                    { label: "PAN Number", key: "panNumber" },
                    { label: "UAN Number", key: "uanNumber" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-slate-300">{field.label}</Label>
                      {isEditing ? (
                        <Input
                          value={
                            (editForm[field.key as keyof Employee] as string) ||
                            (employee[field.key as keyof Employee] as string)
                          }
                          onChange={(e) =>
                            handleEditFormChange(field.key, e.target.value)
                          }
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      ) : (
                        <p className="text-white p-2 bg-slate-800/30 rounded border border-slate-700">
                          {(employee[field.key as keyof Employee] as string) ||
                            "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Status</h3>
                </div>
                <Badge
                  className={
                    employee.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }
                >
                  {employee.status}
                </Badge>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Documents
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentTypes.map((docType) => {
                    const hasDoc = isEditing
                      ? (editForm[docType.key as keyof Employee] as string)
                      : (employee[docType.key as keyof Employee] as string);

                    return (
                      <div
                        key={docType.key}
                        className="p-4 bg-slate-800/30 rounded border border-slate-700 space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <docType.icon className="h-4 w-4 text-purple-400" />
                          <span className="text-slate-300 font-medium">
                            {docType.label}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ml-auto ${
                              hasDoc
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {hasDoc ? "✓" : "✗"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {/* Upload/Change Button */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={
                                isEditing
                                  ? handleEditDocumentUpload(docType.key)
                                  : handleEditDocumentUpload(docType.key)
                              }
                              disabled={!isEditing}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!isEditing}
                              className={`w-full text-xs ${
                                isEditing
                                  ? hasDoc
                                    ? "border-blue-500 text-blue-400 hover:bg-blue-500/20 cursor-pointer"
                                    : "border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400 cursor-pointer"
                                  : "border-slate-700 text-slate-500 cursor-not-allowed opacity-50"
                              }`}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {hasDoc ? "Change" : "Upload"}
                            </Button>
                          </div>

                          {/* Preview Button - only if document exists */}
                          {hasDoc && (
                            <Button
                              onClick={() =>
                                handleOpenDocumentPreview(
                                  hasDoc as string,
                                  docType.label,
                                  employee.fullName,
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="w-full text-xs border-blue-500 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          )}

                          {/* Remove Button - only in edit mode if document exists */}
                          {isEditing && hasDoc && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs border-red-600 text-red-400 hover:bg-red-500/20"
                              onClick={() =>
                                handleEditFormChange(docType.key, "")
                              }
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Salary Tab */}
        {activeTab === "salary" && (
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Salary Management
                  </h3>
                </div>
                <Button
                  onClick={() => setShowSalaryForm(!showSalaryForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salary Record
                </Button>
              </div>

              {showSalaryForm && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <span>Add New Salary Record</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: "Month", key: "month", type: "month" },
                        {
                          label: "Total Working Days",
                          key: "totalWorkingDays",
                          type: "number",
                        },
                        {
                          label: "Actual Working Days",
                          key: "actualWorkingDays",
                          type: "number",
                        },
                        {
                          label: "Basic Salary",
                          key: "basicSalary",
                          type: "number",
                        },
                        {
                          label: "Bonus (Optional)",
                          key: "bonus",
                          type: "number",
                        },
                        {
                          label: "Deductions (Optional)",
                          key: "deductions",
                          type: "number",
                        },
                        {
                          label: "Payment Date (Optional)",
                          key: "paymentDate",
                          type: "date",
                        },
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label className="text-slate-300">
                            {field.label}
                          </Label>
                          <Input
                            type={field.type}
                            value={
                              salaryForm[field.key as keyof typeof salaryForm]
                            }
                            onChange={(e) =>
                              setSalaryForm({
                                ...salaryForm,
                                [field.key]: e.target.value,
                              })
                            }
                            className="bg-slate-800/50 border-slate-700 text-white"
                            placeholder={field.key === "bonus" ? "5000" : ""}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Notes (Optional)</Label>
                      <Textarea
                        value={salaryForm.notes}
                        onChange={(e) =>
                          setSalaryForm({
                            ...salaryForm,
                            notes: e.target.value,
                          })
                        }
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddSalaryRecord}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                      <Button
                        onClick={() => setShowSalaryForm(false)}
                        variant="outline"
                        className="border-slate-600 text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(() => {
                const employeeSalaryRecords = getEmployeeSalaryRecords();
                return employeeSalaryRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-medium mb-2">
                      No Salary Records
                    </h4>
                    <p className="text-slate-400">
                      No salary records found for this employee.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeeSalaryRecords.map((record) => (
                      <Card
                        key={record.id}
                        className="bg-slate-800/30 border-slate-700"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <div>
                                <h4 className="text-white font-medium">
                                  {new Date(
                                    record.month + "-01",
                                  ).toLocaleDateString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </h4>
                                <p className="text-slate-400 text-sm">
                                  {record.actualWorkingDays}/
                                  {record.totalWorkingDays} working days
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-white font-bold text-lg">
                                  ₹{record.totalSalary.toLocaleString()}
                                </p>
                                {record.paymentDate && (
                                  <p className="text-slate-400 text-sm">
                                    Paid: {record.paymentDate}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() =>
                                  handleDeleteSalaryRecord(record.id)
                                }
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Basic Salary</p>
                              <p className="text-white font-medium">
                                ₹{record.basicSalary.toLocaleString()}
                              </p>
                            </div>
                            {record.bonus && record.bonus > 0 && (
                              <div>
                                <p className="text-slate-400">Bonus</p>
                                <p className="text-green-400 font-medium">
                                  +₹{record.bonus.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {record.deductions && record.deductions > 0 && (
                              <div>
                                <p className="text-slate-400">Deductions</p>
                                <p className="text-red-400 font-medium">
                                  -₹{record.deductions.toLocaleString()}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-slate-400">Added On</p>
                              <p className="text-white font-medium">
                                {new Date(
                                  record.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {record.notes && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <p className="text-slate-400 text-sm">Notes:</p>
                              <p className="text-slate-300 text-sm mt-1">
                                {record.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Document Preview Modal */}
        {documentPreviewModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-900 border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span>Document Preview</span>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {documentPreviewModal.documentType} -{" "}
                      {documentPreviewModal.employeeName}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() =>
                      setDocumentPreviewModal({
                        isOpen: false,
                        documentUrl: "",
                        documentType: "",
                        employeeName: "",
                      })
                    }
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center max-h-[70vh] overflow-auto">
                {documentPreviewModal.documentUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    {documentPreviewModal.documentUrl.startsWith(
                      "data:image/",
                    ) ||
                    documentPreviewModal.documentUrl.match(
                      /\.(jpg|jpeg|png|gif|webp)$/i,
                    ) ? (
                      <img
                        src={documentPreviewModal.documentUrl}
                        alt={documentPreviewModal.documentType}
                        className="max-w-full max-h-full object-contain rounded-lg border border-slate-600"
                      />
                    ) : documentPreviewModal.documentUrl.startsWith(
                        "data:application/pdf",
                      ) || documentPreviewModal.documentUrl.match(/\.pdf$/i) ? (
                      <div className="w-full h-full min-h-[500px] bg-slate-800/50 rounded-lg border border-slate-600 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <FileText className="h-16 w-16 text-slate-400 mx-auto" />
                          <div>
                            <p className="text-white font-medium mb-2">
                              PDF Document
                            </p>
                            <p className="text-slate-400 text-sm mb-4">
                              PDF preview not available in browser
                            </p>
                            <Button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = documentPreviewModal.documentUrl;
                                link.download = `${documentPreviewModal.documentType}_${documentPreviewModal.employeeName}.pdf`;
                                link.click();
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[300px] bg-slate-800/50 rounded-lg border border-slate-600 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <FileText className="h-16 w-16 text-slate-400 mx-auto" />
                          <div>
                            <p className="text-white font-medium mb-2">
                              Document File
                            </p>
                            <p className="text-slate-400 text-sm mb-4">
                              Preview not available for this file type
                            </p>
                            <Button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = documentPreviewModal.documentUrl;
                                link.download = `${documentPreviewModal.documentType}_${documentPreviewModal.employeeName}`;
                                link.click();
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download File
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Document Not Available
                    </h3>
                    <p className="text-slate-400">
                      The document file could not be loaded.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
