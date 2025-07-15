import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Camera, 
  Save,
  Home,
  ArrowLeft,
  Upload
} from "lucide-react";
import Layout from "@/components/layout/layout";

interface AuditQuestion {
  id: string;
  category: string;
  question: string;
  response?: '✓' | '✗' | 'N/A';
  note?: string;
  photo?: string;
}

interface AuditFormData {
  zone: string;
  date: string;
  answers: AuditQuestion[];
  score?: number;
}

const AUDIT_CATEGORIES = [
  { id: '1S', name: 'Sort', description: 'Remove unnecessary items', color: 'bg-red-500' },
  { id: '2S', name: 'Set in Order', description: 'Organize remaining items', color: 'bg-orange-500' },
  { id: '3S', name: 'Shine', description: 'Clean and inspect', color: 'bg-yellow-500' },
  { id: '4S', name: 'Standardize', description: 'Maintain and improve', color: 'bg-green-500' },
  { id: '5S', name: 'Sustain', description: 'Maintain discipline', color: 'bg-blue-500' }
];

export default function AuditForm() {
  const [, params] = useRoute("/audits/new/:zone");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AuditQuestion>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const zone = params?.zone || '';

  // Fetch questions for this zone
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/questions", zone],
    enabled: !!zone,
  });

  // Fetch zone details
  const { data: zones } = useQuery({
    queryKey: ["/api/zones"],
  });

  const zoneDetails = zones?.find((z: any) => z.name === zone);

  const filteredQuestions = questions?.filter((q: any) => 
    q.category === AUDIT_CATEGORIES[currentCategory]?.id
  ) || [];

  const handleResponseChange = (questionId: string, response: '✓' | '✗' | 'N/A') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        id: questionId,
        category: AUDIT_CATEGORIES[currentCategory].id,
        question: filteredQuestions.find(q => q.id === questionId)?.question || '',
        response
      }
    }));
  };

  const handleNoteChange = (questionId: string, note: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        note
      }
    }));
  };

  const handlePhotoUpload = (questionId: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          photo: base64
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const calculateScore = () => {
    const allAnswers = Object.values(answers);
    const validAnswers = allAnswers.filter(a => a.response && a.response !== 'N/A');
    const correctAnswers = validAnswers.filter(a => a.response === '✓');
    
    if (validAnswers.length === 0) return 0;
    return Math.round((correctAnswers.length / validAnswers.length) * 100);
  };

  const calculateCategoryScore = (categoryId: string) => {
    const categoryAnswers = Object.values(answers).filter(a => a.category === categoryId);
    const validAnswers = categoryAnswers.filter(a => a.response && a.response !== 'N/A');
    const correctAnswers = validAnswers.filter(a => a.response === '✓');
    
    if (validAnswers.length === 0) return 0;
    return Math.round((correctAnswers.length / validAnswers.length) * 100);
  };

  const submitAudit = useMutation({
    mutationFn: async (data: AuditFormData) => {
      const auditData = {
        title: `5S Audit - ${zone}`,
        zone,
        auditor: 'current-user', // This will be set by the server
        status: 'completed',
        scheduledDate: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        overallScore: calculateScore(),
        notes: `Audit completed with ${Object.keys(answers).length} questions answered`,
        answers: Object.values(answers)
      };

      return apiRequest(`/api/audits`, {
        method: 'POST',
        body: JSON.stringify(auditData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Audit submitted successfully",
        description: "Your audit has been saved and scored",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setLocation('/audits/history');
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting audit",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (Object.keys(answers).length === 0) {
      toast({
        title: "No responses",
        description: "Please answer at least one question",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitAudit.mutate({
      zone,
      date: new Date().toISOString(),
      answers: Object.values(answers),
      score: calculateScore()
    });
  };

  const progress = ((currentCategory + 1) / AUDIT_CATEGORIES.length) * 100;

  if (questionsLoading) {
    return (
      <Layout title="Loading Audit..." showHomeButton={true}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`5S Audit - ${zone}`} 
      subtitle={`${AUDIT_CATEGORIES[currentCategory]?.name} (${currentCategory + 1}/${AUDIT_CATEGORIES.length})`}
      showHomeButton={false}
    >
      <div className="space-y-6">
        {/* Header with zone info and progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/audits')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
            <div>
              <h3 className="font-semibold text-lg">{zoneDetails?.name}</h3>
              <p className="text-sm text-slate-600">{zoneDetails?.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-600">Overall Score</div>
            <div className="text-2xl font-bold text-primary">{calculateScore()}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Category tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {AUDIT_CATEGORIES.map((category, index) => (
            <Button
              key={category.id}
              variant={currentCategory === index ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentCategory(index)}
              className={`flex-shrink-0 ${
                currentCategory === index 
                  ? 'bg-primary text-white' 
                  : 'hover:bg-slate-100'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${category.color} mr-2`} />
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {calculateCategoryScore(category.id)}%
              </Badge>
            </Button>
          ))}
        </div>

        {/* Current category info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${AUDIT_CATEGORIES[currentCategory]?.color} mr-3`} />
              {AUDIT_CATEGORIES[currentCategory]?.name}
            </CardTitle>
            <p className="text-sm text-slate-600">
              {AUDIT_CATEGORIES[currentCategory]?.description}
            </p>
          </CardHeader>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {filteredQuestions.map((question: any, index: number) => (
            <Card key={question.id} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label className="text-base font-medium">
                        {index + 1}. {question.question}
                      </Label>
                      {question.description && (
                        <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Response options */}
                  <RadioGroup
                    value={answers[question.id]?.response || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value as '✓' | '✗' | 'N/A')}
                  >
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="✓" id={`${question.id}-yes`} />
                        <Label htmlFor={`${question.id}-yes`} className="flex items-center cursor-pointer">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="✗" id={`${question.id}-no`} />
                        <Label htmlFor={`${question.id}-no`} className="flex items-center cursor-pointer">
                          <XCircle className="h-4 w-4 text-red-600 mr-1" />
                          No
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="N/A" id={`${question.id}-na`} />
                        <Label htmlFor={`${question.id}-na`} className="flex items-center cursor-pointer">
                          <MinusCircle className="h-4 w-4 text-gray-600 mr-1" />
                          N/A
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor={`${question.id}-note`}>Notes (optional)</Label>
                    <Textarea
                      id={`${question.id}-note`}
                      placeholder="Add any observations or comments..."
                      value={answers[question.id]?.note || ''}
                      onChange={(e) => handleNoteChange(question.id, e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Photo upload */}
                  <div className="space-y-2">
                    <Label>Photo Evidence (optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`${question.id}-photo`)?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                      <input
                        id={`${question.id}-photo`}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(question.id, file);
                        }}
                      />
                      {answers[question.id]?.photo && (
                        <Badge variant="secondary">
                          <Upload className="h-3 w-3 mr-1" />
                          Photo uploaded
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
            disabled={currentCategory === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-slate-600">
            {currentCategory + 1} of {AUDIT_CATEGORIES.length} categories
          </div>

          {currentCategory < AUDIT_CATEGORIES.length - 1 ? (
            <Button
              onClick={() => setCurrentCategory(currentCategory + 1)}
            >
              Next
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Audit'}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}