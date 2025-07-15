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
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Edit3, Plus, Trash2, Shield, Save, AlertCircle } from "lucide-react";

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
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

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