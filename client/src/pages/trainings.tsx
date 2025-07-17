import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, GraduationCap } from "lucide-react";
import Layout from "@/components/layout/layout";

const externalTrainings = [
  {
    id: 1,
    title: "5S Principles and Implementation",
    description: "Comprehensive 5S training program covering principles and practical implementation strategies",
    url: "https://www.bsigroup.com/en-MY/training-courses/5s-principles-and-implementation/"
  },
  {
    id: 2,
    title: "5S Principles and Awareness Training",
    description: "Professional awareness training to build understanding of 5S methodology and workplace organization",
    url: "https://www.iconictraining.com.my/showproducts/productid/2536040/5s-principles-and-awareness-training/"
  },
  {
    id: 3,
    title: "5S Management Consultant Malaysia",
    description: "Expert 5S training and consultation services for comprehensive workplace transformation",
    url: "https://www.yenpremiumcoach.yenuni.com.my/5s-training-and-consultation/"
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
          {externalTrainings.map((training) => (
            <Card key={training.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
                <CardTitle className="text-lg">{training.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{training.description}</p>
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(training.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Training
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