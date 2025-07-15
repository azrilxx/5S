import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Calendar } from "lucide-react";
import Layout from "@/components/layout/layout";

const documents = [
  {
    id: 1,
    title: "5S Implementation Guide",
    description: "Complete guide for implementing 5S methodology in your workplace",
    category: "Guidelines",
    lastUpdated: "2025-01-10",
    size: "2.4 MB",
    type: "PDF"
  },
  {
    id: 2,
    title: "Audit Checklist Template",
    description: "Standard checklist template for conducting 5S audits",
    category: "Templates",
    lastUpdated: "2025-01-08",
    size: "156 KB",
    type: "DOC"
  },
  {
    id: 3,
    title: "Action Plan Template",
    description: "Template for creating corrective action plans",
    category: "Templates",
    lastUpdated: "2025-01-05",
    size: "89 KB",
    type: "XLS"
  },
  {
    id: 4,
    title: "Training Materials",
    description: "Comprehensive training materials for 5S education",
    category: "Training",
    lastUpdated: "2025-01-03",
    size: "15.8 MB",
    type: "ZIP"
  },
  {
    id: 5,
    title: "Standard Operating Procedures",
    description: "SOPs for various 5S activities and processes",
    category: "Procedures",
    lastUpdated: "2024-12-28",
    size: "1.2 MB",
    type: "PDF"
  },
  {
    id: 6,
    title: "Best Practices Guide",
    description: "Collection of best practices and success stories",
    category: "Guidelines",
    lastUpdated: "2024-12-20",
    size: "3.7 MB",
    type: "PDF"
  }
];

export default function Documentation() {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Guidelines":
        return "bg-blue-100 text-blue-800";
      case "Templates":
        return "bg-green-100 text-green-800";
      case "Training":
        return "bg-purple-100 text-purple-800";
      case "Procedures":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PDF":
        return "bg-red-100 text-red-800";
      case "DOC":
        return "bg-blue-100 text-blue-800";
      case "XLS":
        return "bg-green-100 text-green-800";
      case "ZIP":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout 
      title="Documentation" 
      subtitle="Access guides, templates, and resources"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(doc.category)}>
                    {doc.category}
                  </Badge>
                  <Badge variant="outline" className={getTypeColor(doc.type)}>
                    {doc.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{doc.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Size</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Updated
                    </span>
                    <span>{new Date(doc.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
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