// Claude-enhanced with 5S multimedia embeds (safe mode enabled)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, CheckCircle, Clock, Video, AlertCircle } from "lucide-react";
import Layout from "@/components/layout/layout";

const lessons = [
  {
    id: 1,
    title: "Sort (Seiri) - Separate needed from unneeded",
    description: "Learn how to identify and remove unnecessary items from the workplace",
    duration: "15 min",
    completed: true,
    category: "5S Fundamentals",
    videoId: "Pu29athsH0E", // What is 5S Methodology?
    keyPoints: [
      "Separate necessary from unnecessary items in the workplace",
      "Use red tag system to identify questionable items",
      "Remove all unnecessary items to reduce clutter and distractions"
    ],
    detailedContent: {
      objective: "Eliminate unnecessary items from the workplace to reduce waste and improve efficiency",
      steps: ["Assessment of all items", "Categorization (necessary/unnecessary)", "Red tag system implementation", "Proper disposal process"],
      benefits: ["Reduced search time", "Improved workspace efficiency", "Better safety through reduced clutter"]
    }
  },
  {
    id: 2,
    title: "Set in Order (Seiton) - Organize for efficiency",
    description: "Understand how to arrange items for optimal workflow and accessibility",
    duration: "20 min",
    completed: true,
    category: "5S Fundamentals",
    videoId: "bLadn_zOx2Q", // Boosts Efficiency
    keyPoints: [
      "Arrange necessary items in logical, accessible locations",
      "Create visual workplace with clear labels and marking",
      "Position frequently used items closest to work areas"
    ],
    detailedContent: {
      objective: "Organize remaining necessary items for optimal workflow and easy access",
      steps: ["Location planning", "Visual management system", "Storage organization", "Standardized placement"],
      benefits: ["Reduced search time", "Improved safety", "Enhanced productivity", "Better quality control"]
    }
  },
  {
    id: 3,
    title: "Shine (Seiso) - Clean and inspect",
    description: "Master the art of cleaning as inspection and maintenance",
    duration: "18 min",
    completed: false,
    category: "5S Fundamentals",
    videoId: "GW_LTbKUBsg", // 5S in Factory & Office: How to Make Your Workplace Excellent
    keyPoints: [
      "Clean workplace to reveal hidden problems and defects",
      "Use cleaning as inspection opportunity for equipment",
      "Establish regular cleaning schedules and standards"
    ],
    detailedContent: {
      objective: "Clean and inspect workplace to maintain standards and identify problems early",
      steps: ["Deep cleaning process", "Inspection during cleaning", "Problem detection", "Maintenance scheduling"],
      benefits: ["Improved safety", "Better equipment reliability", "Enhanced productivity", "Quality improvements"]
    }
  },
  {
    id: 4,
    title: "Standardize (Seiketsu) - Create standards",
    description: "Learn to establish and maintain consistent 5S practices",
    duration: "25 min",
    completed: false,
    category: "5S Fundamentals",
    // No video for this topic
    keyPoints: [
      "Develop standard operating procedures for 5S activities",
      "Create visual standards and documentation systems",
      "Ensure consistency across all work areas and shifts"
    ],
    detailedContent: {
      objective: "Create systematic approach to maintain first 3S steps consistently",
      steps: ["Standardize previous 3 steps", "Create common systems", "Document workflows", "Visual standards"],
      benefits: ["Consistent operations", "Reduced variability", "Foundation for continuous improvement"]
    }
  },
  {
    id: 5,
    title: "Sustain (Shitsuke) - Maintain discipline",
    description: "Build habits and culture to sustain 5S improvements",
    duration: "22 min",
    completed: false,
    category: "5S Fundamentals",
    // No video for this topic
    keyPoints: [
      "Develop self-discipline to maintain 5S without supervision",
      "Create organizational culture that supports 5S practices",
      "Implement regular audits and continuous improvement"
    ],
    detailedContent: {
      objective: "Build sustainable discipline and culture to maintain 5S long-term",
      steps: ["Self-discipline development", "Continuous practice", "Cultural integration", "Regular monitoring"],
      benefits: ["Sustained productivity gains", "Employee pride", "Foundation for kaizen", "Long-term success"]
    }
  }
];

// Safe video embed component - only renders when videoId is provided
const VideoEmbed = ({ videoId, title }: { videoId: string; title: string }) => {
  return (
    <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
        onError={() => {
          console.warn(`Failed to load video: ${videoId}`);
        }}
      />
    </div>
  );
};

export default function Learn() {
  return (
    <Layout 
      title="Learn 5S" 
      subtitle="Master the principles of 5S methodology"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{lesson.category}</Badge>
                  {lesson.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <CardTitle className="text-lg">{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{lesson.description}</p>
                
                {/* Enhanced multimedia content with safe fallback */}
                {lesson.videoId && (
                  <div className="mb-4">
                    <VideoEmbed videoId={lesson.videoId} title={lesson.title} />
                  </div>
                )}
                
                {/* Key learning points */}
                {lesson.keyPoints && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Key Learning Points
                    </h4>
                    <ul className="space-y-1">
                      {lesson.keyPoints.map((point, index) => (
                        <li key={index} className="text-xs text-slate-600 flex items-start">
                          <span className="text-slate-400 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Enhanced detailed content */}
                {lesson.detailedContent && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Objective:</strong> {lesson.detailedContent.objective}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-slate-700">Steps:</strong>
                        <ul className="mt-1 space-y-1">
                          {lesson.detailedContent.steps.map((step, index) => (
                            <li key={index} className="text-slate-600">• {step}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-slate-700">Benefits:</strong>
                        <ul className="mt-1 space-y-1">
                          {lesson.detailedContent.benefits.map((benefit, index) => (
                            <li key={index} className="text-slate-600">• {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Original controls - maintained for backward compatibility */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {lesson.duration}
                  </span>
                  <Button size="sm" variant={lesson.completed ? "outline" : "default"}>
                    <Play className="h-4 w-4 mr-2" />
                    {lesson.completed ? "Review" : "Start"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}