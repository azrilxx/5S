import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star, ThumbsUp, AlertCircle } from "lucide-react";
import Layout from "@/components/layout/layout";

const feedbacks = [
  {
    id: 1,
    user: "Alice Johnson",
    role: "Auditor",
    message: "The new audit interface is much more intuitive. Great improvement!",
    rating: 5,
    date: "2025-01-10",
    status: "reviewed"
  },
  {
    id: 2,
    user: "Bob Smith",
    role: "Supervisor",
    message: "Would love to see more detailed analytics in the reports section.",
    rating: 4,
    date: "2025-01-08",
    status: "pending"
  },
  {
    id: 3,
    user: "Carol Davis",
    role: "Team Lead",
    message: "The mobile responsiveness could be improved for tablet users.",
    rating: 3,
    date: "2025-01-05",
    status: "in-progress"
  }
];

export default function Feedback() {
  const [newFeedback, setNewFeedback] = useState("");
  const [rating, setRating] = useState(5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reviewed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reviewed":
        return <ThumbsUp className="h-4 w-4" />;
      case "in-progress":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Layout 
      title="Feedback" 
      subtitle="Share your thoughts and suggestions"
      showHomeButton={true}
    >
      <div className="space-y-6">
        {/* Submit Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Feedback</label>
                <Textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  rows={4}
                />
              </div>
              <Button>Submit Feedback</Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{feedback.user}</span>
                      <Badge variant="outline">{feedback.role}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= feedback.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <Badge className={getStatusColor(feedback.status)}>
                        {getStatusIcon(feedback.status)}
                        <span className="ml-1 capitalize">{feedback.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-2">{feedback.message}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(feedback.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}