import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { 
  Edit3, Plus, Trash2, Shield, Save, AlertCircle, Upload, FileText, Brain, Loader2, 
  Eye, Download, Upload as UploadIcon, ChevronUp, ChevronDown, GripVertical, 
  CheckCircle, XCircle, Clock, BookOpen, Settings, User, Building
} from "lucide-react";
import { ZONES } from "@/lib/constants";

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
  description?: string;
  isActive: boolean;
}

const FIVE_S_CATEGORIES = [
  { 
    value: "sort", 
    label: "1S - Sort (Seiri)", 
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Remove unnecessary items from the workplace"
  },
  { 
    value: "setInOrder", 
    label: "2S - Set in Order (Seiton)", 
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Arrange necessary items in order"
  },
  { 
    value: "shine", 
    label: "3S - Shine (Seiso)", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Clean and inspect the workplace"
  },
  { 
    value: "standardize", 
    label: "4S - Standardize (Seiketsu)", 
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Maintain and improve the first 3S"
  },
  { 
    value: "sustain", 
    label: "5S - Sustain (Shitsuke)", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Maintain discipline and continuous improvement"
  },
];

export default function QuestionEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("sort");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewZone, setPreviewZone] = useState<string>("");
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResults, setExtractionResults] = useState<{ questions: string[], extractedText: string, totalQuestions: number } | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    category: selectedCategory,
    question: "",
    description: "",
    isRequired: false,
    enabledZones: [] as string[]
  });

  // Access control
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Access Denied</CardTitle>
            <CardDescription>
              Only administrators can access the 5S Question Editor
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Data fetching
  const { data: questions = [], isLoading: questionsLoading, error: questionsError } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Computed values
  const questionsByCategory = useMemo(() => {
    const categorized: Record<string, Question[]> = {};
    FIVE_S_CATEGORIES.forEach(cat => {
      categorized[cat.value] = questions.filter(q => q.category === cat.value);
    });
    return categorized;
  }, [questions]);

  const activeZones = useMemo(() => {
    return zones.filter(zone => zone.isActive);
  }, [zones]);

  const currentCategoryQuestions = questionsByCategory[selectedCategory] || [];

  // Mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: Omit<Question, "id" | "createdAt" | "updatedAt">) => {
      return await apiRequest("POST", "/api/questions", questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setShowCreateForm(false);
      resetForm();
      toast({
        title: "Question Created",
        description: "The question has been successfully created.",
      });
    },
    onError: (error) => {
      console.error("Create question error:", error);
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, ...questionData }: Partial<Question> & { id: number }) => {
      return await apiRequest("PUT", `/api/questions/${id}`, questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setEditingQuestion(null);
      resetForm();
      toast({
        title: "Question Updated",
        description: "The question has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Update question error:", error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Question Deleted",
        description: "The question has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete question error:", error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const extractQuestionsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/questions/extract-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract questions');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setExtractionResults(data);
      setSelectedQuestions(data.questions);
      toast({
        title: "Questions Extracted",
        description: `Successfully extracted ${data.totalQuestions} questions from the PDF.`,
      });
    },
    onError: (error) => {
      console.error("Extract questions error:", error);
      toast({
        title: "Extraction Failed",
        description: "Failed to extract questions from PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      category: selectedCategory,
      question: "",
      description: "",
      isRequired: false,
      enabledZones: []
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      category: question.category,
      question: question.question,
      description: question.description || "",
      isRequired: question.isRequired,
      enabledZones: question.enabledZones
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.question.trim()) {
      toast({
        title: "Validation Error",
        description: "Question text is required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.enabledZones.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one zone.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestionMutation.mutateAsync({
          id: editingQuestion.id,
          ...formData
        });
      } else {
        await createQuestionMutation.mutateAsync(formData);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleZoneToggle = (zoneName: string) => {
    setFormData(prev => ({
      ...prev,
      enabledZones: prev.enabledZones.includes(zoneName)
        ? prev.enabledZones.filter(z => z !== zoneName)
        : [...prev.enabledZones, zoneName]
    }));
  };

  const handleSelectAllZones = () => {
    setFormData(prev => ({
      ...prev,
      enabledZones: activeZones.map(zone => zone.name)
    }));
  };

  const handleDeselectAllZones = () => {
    setFormData(prev => ({
      ...prev,
      enabledZones: []
    }));
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    
    setIsExtracting(true);
    try {
      await extractQuestionsMutation.mutateAsync(pdfFile);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImportSelectedQuestions = async () => {
    if (!selectedQuestions.length) return;

    try {
      const promises = selectedQuestions.map(questionText => 
        createQuestionMutation.mutateAsync({
          category: selectedCategory,
          question: questionText,
          description: "",
          isRequired: false,
          enabledZones: activeZones.map(zone => zone.name)
        })
      );

      await Promise.all(promises);
      
      toast({
        title: "Questions Imported",
        description: `Successfully imported ${selectedQuestions.length} questions.`,
      });
      
      setShowPdfUpload(false);
      setExtractionResults(null);
      setSelectedQuestions([]);
      setPdfFile(null);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const categoryInfo = FIVE_S_CATEGORIES.find(cat => cat.value === selectedCategory);

  if (questionsLoading || zonesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-slate-600">Loading Question Editor...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Error Loading Questions</CardTitle>
            <CardDescription>
              Unable to load questions. Please refresh the page or contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">5S Question Editor</h1>
              <p className="text-slate-600 mt-2">Manage questions for 5S workplace organization audits</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPdfUpload(true)}
                className="flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>AI Extract</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            {FIVE_S_CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="flex flex-col items-center p-3 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <span className="font-medium">{category.label.split(' - ')[0]}</span>
                <span className="text-xs opacity-75">{category.label.split(' - ')[1]}</span>
                <Badge variant="secondary" className="mt-1">
                  {currentCategoryQuestions.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {FIVE_S_CATEGORIES.map((category) => (
            <TabsContent key={category.value} value={category.value}>
              <div className="space-y-6">
                {/* Category Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Badge className={category.color}>
                            {category.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {category.description}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: category.value }));
                          setShowCreateForm(true);
                        }}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Question</span>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Questions List */}
                <div className="space-y-4">
                  {currentCategoryQuestions.length === 0 ? (
                    <Card className="p-12 text-center">
                      <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No Questions Yet</h3>
                      <p className="text-slate-500 mb-4">Create your first question for {category.label}</p>
                      <Button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: category.value }));
                          setShowCreateForm(true);
                        }}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Question</span>
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {currentCategoryQuestions.map((question, index) => (
                        <Card key={question.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-slate-500">
                                    Question {index + 1}
                                  </span>
                                  {question.isRequired && (
                                    <Badge variant="destructive" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle className="text-lg">{question.question}</CardTitle>
                                {question.description && (
                                  <CardDescription className="mt-1">
                                    {question.description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this question? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteQuestionMutation.mutate(question.id)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-slate-500">
                                Applied to {question.enabledZones.length} zones
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {question.enabledZones.slice(0, 3).map((zoneName) => (
                                  <Badge key={zoneName} variant="outline" className="text-xs">
                                    {zoneName}
                                  </Badge>
                                ))}
                                {question.enabledZones.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{question.enabledZones.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Create/Edit Question Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Create New Question"}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion ? "Update the question details below" : "Add a new question to the 5S audit system"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIVE_S_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="question">Question Text *</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter the question text..."
                    required
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add additional context or instructions..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
                  />
                  <Label htmlFor="required" className="flex items-center space-x-2">
                    <span>Required Question</span>
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  </Label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Enabled Zones *</Label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllZones}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAllZones}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48 border rounded-md p-4">
                    <div className="space-y-2">
                      {activeZones.map((zone) => (
                        <div key={zone.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`zone-${zone.id}`}
                            checked={formData.enabledZones.includes(zone.name)}
                            onCheckedChange={() => handleZoneToggle(zone.name)}
                          />
                          <Label htmlFor={`zone-${zone.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span>{zone.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {zone.type}
                              </Badge>
                            </div>
                            {zone.description && (
                              <p className="text-xs text-slate-500 mt-1">{zone.description}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <p className="text-sm text-slate-500 mt-2">
                    {formData.enabledZones.length} of {activeZones.length} zones selected
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingQuestion(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {(createQuestionMutation.isPending || updateQuestionMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingQuestion ? "Update Question" : "Create Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Question Preview</DialogTitle>
              <DialogDescription>
                Preview how questions will appear in audits
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="preview-zone">Select Zone</Label>
                <Select value={previewZone} onValueChange={setPreviewZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a zone to preview" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.name}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {previewZone && (
                <ScrollArea className="h-96 border rounded-md p-4">
                  <div className="space-y-6">
                    {FIVE_S_CATEGORIES.map((category) => {
                      const categoryQuestions = questions.filter(
                        q => q.category === category.value && q.enabledZones.includes(previewZone)
                      );
                      
                      if (categoryQuestions.length === 0) return null;
                      
                      return (
                        <div key={category.value}>
                          <h3 className={`text-lg font-semibold mb-3 p-2 rounded ${category.color}`}>
                            {category.label}
                          </h3>
                          <div className="space-y-3">
                            {categoryQuestions.map((question, index) => (
                              <Card key={question.id} className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-sm font-medium text-slate-500">
                                        {index + 1}.
                                      </span>
                                      {question.isRequired && (
                                        <Badge variant="destructive" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="font-medium">{question.question}</p>
                                    {question.description && (
                                      <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Upload Dialog */}
        <Dialog open={showPdfUpload} onOpenChange={setShowPdfUpload}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI-Powered Question Extraction</DialogTitle>
              <DialogDescription>
                Upload a PDF document to automatically extract 5S questions using AI
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {!extractionResults ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pdf-file">PDF Document</Label>
                    <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <input
                        id="pdf-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Label htmlFor="pdf-file" className="cursor-pointer">
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="w-12 h-12 text-slate-400" />
                          <p className="text-sm text-slate-600">
                            {pdfFile ? pdfFile.name : "Click to upload PDF or drag and drop"}
                          </p>
                          <p className="text-xs text-slate-500">PDF files only, up to 10MB</p>
                        </div>
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="target-category">Target Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target category" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIVE_S_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPdfUpload(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePdfUpload}
                      disabled={!pdfFile || isExtracting}
                    >
                      {isExtracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Extract Questions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">
                      Extraction Successful!
                    </h3>
                    <p className="text-sm text-green-700">
                      Found {extractionResults.totalQuestions} questions. Select the ones you want to import:
                    </p>
                  </div>

                  <ScrollArea className="h-64 border rounded-md p-4">
                    <div className="space-y-2">
                      {extractionResults.questions.map((question, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Checkbox
                            id={`extracted-${index}`}
                            checked={selectedQuestions.includes(question)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedQuestions(prev => [...prev, question]);
                              } else {
                                setSelectedQuestions(prev => prev.filter(q => q !== question));
                              }
                            }}
                          />
                          <Label htmlFor={`extracted-${index}`} className="flex-1 cursor-pointer">
                            <p className="text-sm">{question}</p>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">
                      {selectedQuestions.length} of {extractionResults.totalQuestions} questions selected
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setExtractionResults(null);
                          setSelectedQuestions([]);
                          setPdfFile(null);
                        }}
                      >
                        Extract New PDF
                      </Button>
                      <Button
                        onClick={handleImportSelectedQuestions}
                        disabled={selectedQuestions.length === 0}
                      >
                        Import Selected Questions
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}