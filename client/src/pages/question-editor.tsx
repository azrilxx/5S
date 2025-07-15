import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Edit3, Plus, Trash2, Shield, Save, AlertCircle, Upload, FileText, Brain, Loader2 } from "lucide-react";

interface Question {
  id: number;
  category: string;
  question: string;
  description?: string;
  isRequired: boolean;
  enabledZones: string[];
  createdAt: string;
  updatedAt: string;
}

interface Zone {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
}

const fiveSCategories = [
  { value: "sort", label: "Sort (Seiri)", color: "bg-red-100 text-red-800" },
  { value: "setInOrder", label: "Set in Order (Seiton)", color: "bg-orange-100 text-orange-800" },
  { value: "shine", label: "Shine (Seiso)", color: "bg-yellow-100 text-yellow-800" },
  { value: "standardize", label: "Standardize (Seiketsu)", color: "bg-green-100 text-green-800" },
  { value: "sustain", label: "Sustain (Shitsuke)", color: "bg-blue-100 text-blue-800" },
];

export default function QuestionEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("sort");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResults, setExtractionResults] = useState<{ questions: string[], extractedText: string, totalQuestions: number } | null>(null);

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    enabled: user?.role === 'admin',
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
    enabled: user?.role === 'admin',
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: Omit<Question, "id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error("Failed to create question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: "Question created successfully" });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({ title: "Failed to create question", variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (questionData: Question) => {
      const response = await fetch(`/api/questions/${questionData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error("Failed to update question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: "Question updated successfully" });
      setEditingQuestion(null);
    },
    onError: () => {
      toast({ title: "Failed to update question", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: "Question deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete question", variant: "destructive" });
    },
  });

  const extractPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/questions/extract-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to extract questions from PDF');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setExtractionResults(data);
      setExtractedQuestions(data.questions);
      toast({ 
        title: "PDF processed successfully", 
        description: `Extracted ${data.totalQuestions} questions from PDF` 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to extract questions", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCreateQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const enabledZones = Array.from(formData.getAll("enabledZones")) as string[];
    
    const questionData = {
      category: selectedCategory,
      question: formData.get("question") as string,
      description: formData.get("description") as string,
      isRequired: formData.get("isRequired") === "on",
      enabledZones,
    };
    
    createQuestionMutation.mutate(questionData);
  };

  const handleUpdateQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuestion) return;
    
    const formData = new FormData(e.currentTarget);
    const enabledZones = Array.from(formData.getAll("enabledZones")) as string[];
    
    const questionData = {
      ...editingQuestion,
      question: formData.get("question") as string,
      description: formData.get("description") as string,
      isRequired: formData.get("isRequired") === "on",
      enabledZones,
    };
    
    updateQuestionMutation.mutate(questionData);
  };

  const getCategoryColor = (category: string) => {
    const categoryData = fiveSCategories.find(cat => cat.value === category);
    return categoryData?.color || "bg-gray-100 text-gray-800";
  };

  const handlePdfFileSelect = (file: File) => {
    setPdfFile(file);
    setExtractionResults(null);
    setExtractedQuestions([]);
  };

  const handleExtractQuestions = async () => {
    if (!pdfFile) return;
    extractPdfMutation.mutate(pdfFile);
  };

  const filteredQuestions = questions.filter(q => q.category === selectedCategory);

  if (questionsLoading || zonesLoading) {
    return <div className="p-6">Loading question editor...</div>;
  }

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the question editor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">5S Question Editor</h1>
        <p className="text-gray-600">
          Manage audit questions for each 5S category and configure zone-specific settings
        </p>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">Select 5S Category</Label>
        <div className="flex flex-wrap gap-2">
          {fiveSCategories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className="flex items-center gap-2"
            >
              <div className={`w-3 h-3 rounded-full ${category.color.split(' ')[0]}`} />
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={getCategoryColor(selectedCategory)}>
            {fiveSCategories.find(cat => cat.value === selectedCategory)?.label}
          </Badge>
          <span className="text-sm text-gray-600">
            {filteredQuestions.length} questions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showPdfUpload} onOpenChange={setShowPdfUpload}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Upload className="w-4 h-4 mr-2" />
                Import from PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-600" />
                  AI-Powered PDF Question Extraction
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Upload a PDF document and our AI will automatically extract 5S audit questions from it.
                  </p>
                </div>
                <div>
                  <Label htmlFor="pdf-file">Select PDF File</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePdfFileSelect(file);
                      }
                    }}
                    className="mt-2"
                  />
                </div>
                {pdfFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4" />
                      <span>{pdfFile.name}</span>
                      <span className="text-gray-500">({Math.round(pdfFile.size / 1024)} KB)</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowPdfUpload(false);
                    setPdfFile(null);
                    setExtractionResults(null);
                    setExtractedQuestions([]);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleExtractQuestions}
                    disabled={!pdfFile || extractPdfMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {extractPdfMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Extract Questions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Extracted Questions Results */}
      {extractionResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              AI-Extracted Questions
            </CardTitle>
            <CardDescription>
              {extractionResults.totalQuestions} questions extracted from PDF. Select which ones to add:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Extracted Text Preview:</p>
                <p className="text-sm text-blue-700 mt-1">{extractionResults.extractedText}</p>
              </div>
              <div className="space-y-2">
                {extractionResults.questions.map((question, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`question-${index}`}
                        checked={extractedQuestions.includes(question)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExtractedQuestions([...extractedQuestions, question]);
                          } else {
                            setExtractedQuestions(extractedQuestions.filter(q => q !== question));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={`question-${index}`} className="text-sm font-medium cursor-pointer">
                          {question}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExtractionResults(null);
                    setExtractedQuestions([]);
                    setShowPdfUpload(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Add selected questions to the current category
                    extractedQuestions.forEach(question => {
                      const questionData = {
                        category: selectedCategory,
                        question: question,
                        description: `Extracted from PDF`,
                        isRequired: false,
                        enabledZones: zones.map(z => z.name),
                      };
                      createQuestionMutation.mutate(questionData);
                    });
                    setExtractionResults(null);
                    setExtractedQuestions([]);
                    setShowPdfUpload(false);
                  }}
                  disabled={extractedQuestions.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add {extractedQuestions.length} Selected Questions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Question Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Question</CardTitle>
            <CardDescription>
              Add a new question for the {fiveSCategories.find(cat => cat.value === selectedCategory)?.label} category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <Label htmlFor="question">Question Text</Label>
                <Input id="question" name="question" required placeholder="Enter the audit question..." />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" placeholder="Additional context or instructions..." />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isRequired" name="isRequired" />
                <Label htmlFor="isRequired">Required Question</Label>
              </div>
              <div>
                <Label>Enabled Zones</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`zone-${zone.id}`}
                        name="enabledZones"
                        value={zone.name}
                        defaultChecked
                      />
                      <Label htmlFor={`zone-${zone.id}`} className="text-sm">
                        {zone.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={createQuestionMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            Manage questions for {fiveSCategories.find(cat => cat.value === selectedCategory)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No questions found for this category.</p>
                <p className="text-sm">Click "Add Question" to create your first question.</p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{question.question}</h3>
                        {question.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {question.description && (
                        <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {question.enabledZones.map((zone) => (
                          <Badge key={zone} variant="outline" className="text-xs">
                            {zone}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuestion(question)}
                        title="Edit question"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestionMutation.mutate(question.id)}
                        title="Delete question"
                        disabled={deleteQuestionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit Question</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateQuestion} className="space-y-4">
                <div>
                  <Label htmlFor="edit-question">Question Text</Label>
                  <Input
                    id="edit-question"
                    name="question"
                    defaultValue={editingQuestion.question}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingQuestion.description}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isRequired"
                    name="isRequired"
                    defaultChecked={editingQuestion.isRequired}
                  />
                  <Label htmlFor="edit-isRequired">Required Question</Label>
                </div>
                <div>
                  <Label>Enabled Zones</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {zones.map((zone) => (
                      <div key={zone.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-zone-${zone.id}`}
                          name="enabledZones"
                          value={zone.name}
                          defaultChecked={editingQuestion.enabledZones.includes(zone.name)}
                        />
                        <Label htmlFor={`edit-zone-${zone.id}`} className="text-sm">
                          {zone.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={updateQuestionMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateQuestionMutation.isPending ? "Updating..." : "Update Question"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingQuestion(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}