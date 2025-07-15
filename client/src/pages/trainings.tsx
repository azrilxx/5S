import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Calendar, Award } from "lucide-react";
import Layout from "@/components/layout/layout";

const trainings = [
  {
    id: 1,
    title: "5S Fundamentals Workshop",
    description: "Complete introduction to 5S methodology with hands-on exercises",
    date: "2025-01-20",
    duration: "4 hours",
    attendees: 25,
    status: "upcoming",
    instructor: "John Smith"
  },
  {
    id: 2,
    title: "Advanced Audit Techniques",
    description: "Deep dive into effective audit strategies and common pitfalls",
    date: "2025-01-15",
    duration: "3 hours",
    attendees: 18,
    status: "completed",
    instructor: "Sarah Johnson"
  },
  {
    id: 3,
    title: "Team Leadership in 5S",
    description: "Leading teams through 5S implementation and cultural change",
    date: "2025-01-25",
    duration: "2 hours",
    attendees: 12,
    status: "upcoming",
    instructor: "Mike Wilson"
  }
];

export default function Trainings() {
  return (
    <Layout 
      title="Trainings" 
      subtitle="Organize and track 5S training sessions"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <Card key={training.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={training.status === "completed" ? "default" : "secondary"}>
                    {training.status}
                  </Badge>
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{training.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{training.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(training.date).toLocaleDateString()} • {training.duration}
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="h-4 w-4 mr-2" />
                    {training.attendees} Attendees
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Award className="h-4 w-4 mr-2" />
                    {training.instructor}
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" className="w-full">
                    {training.status === "completed" ? "View Materials" : "Register"}
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