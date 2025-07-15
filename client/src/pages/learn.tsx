import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, CheckCircle, Clock } from "lucide-react";
import Layout from "@/components/layout/layout";

const lessons = [
  {
    id: 1,
    title: "Sort (Seiri) - Separate needed from unneeded",
    description: "Learn how to identify and remove unnecessary items from the workplace",
    duration: "15 min",
    completed: true,
    category: "5S Fundamentals"
  },
  {
    id: 2,
    title: "Set in Order (Seiton) - Organize for efficiency",
    description: "Understand how to arrange items for optimal workflow and accessibility",
    duration: "20 min",
    completed: true,
    category: "5S Fundamentals"
  },
  {
    id: 3,
    title: "Shine (Seiso) - Clean and inspect",
    description: "Master the art of cleaning as inspection and maintenance",
    duration: "18 min",
    completed: false,
    category: "5S Fundamentals"
  },
  {
    id: 4,
    title: "Standardize (Seiketsu) - Create standards",
    description: "Learn to establish and maintain consistent 5S practices",
    duration: "25 min",
    completed: false,
    category: "5S Fundamentals"
  },
  {
    id: 5,
    title: "Sustain (Shitsuke) - Maintain discipline",
    description: "Build habits and culture to sustain 5S improvements",
    duration: "22 min",
    completed: false,
    category: "5S Fundamentals"
  }
];

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