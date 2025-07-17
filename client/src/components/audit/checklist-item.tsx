import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, AlertTriangle, Tags } from "lucide-react";
import { ChecklistItem } from "@shared/schema";
import { TagInput, TagDisplay, type Tag } from "@/components/ui/tag-input";

interface ChecklistItemProps {
  item: ChecklistItem;
  onUpdate: (id: number, updates: Partial<ChecklistItem>) => void;
  onPhotoUpload: (file: File) => Promise<string>;
}

export default function ChecklistItemComponent({ 
  item, 
  onUpdate, 
  onPhotoUpload 
}: ChecklistItemProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Fetch available tags
  const { data: availableTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags/active"],
    queryFn: async () => {
      const response = await fetch("/api/tags/active", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
  });

  // Convert item.tags (string array of IDs) to Tag objects
  useEffect(() => {
    if (item.tags && availableTags.length > 0) {
      const tagIds = item.tags.map(id => parseInt(id));
      const tags = availableTags.filter(tag => tagIds.includes(tag.id));
      setSelectedTags(tags);
    }
  }, [item.tags, availableTags]);

  const handleResponseChange = (value: string) => {
    const requiresAction = value === "no";
    onUpdate(item.id, { response: value, requiresAction });
  };

  const handleCommentsChange = (comments: string) => {
    onUpdate(item.id, { comments });
  };

  const handleTagsChange = (tags: Tag[]) => {
    setSelectedTags(tags);
    const tagIds = tags.map(tag => tag.id.toString());
    onUpdate(item.id, { tags: tagIds });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const photoUrl = await onPhotoUpload(file);
      onUpdate(item.id, { photoUrl });
    } catch (error) {
      console.error("Photo upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h5 className="font-medium text-slate-900 mb-4">{item.question}</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3">Response</Label>
            <RadioGroup 
              value={item.response || ""} 
              onValueChange={handleResponseChange}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${item.id}-yes`} />
                <Label htmlFor={`${item.id}-yes`} className="text-sm text-slate-700">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${item.id}-no`} />
                <Label htmlFor={`${item.id}-no`} className="text-sm text-slate-700">
                  No
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="na" id={`${item.id}-na`} />
                <Label htmlFor={`${item.id}-na`} className="text-sm text-slate-700">
                  N/A
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3">Photo Evidence</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
              {item.photoUrl ? (
                <div>
                  <img 
                    src={item.photoUrl} 
                    alt="Evidence" 
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm text-slate-600">Evidence photo uploaded</p>
                </div>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-slate-400 mb-2 mx-auto" />
                  <p className="text-sm text-slate-600 mb-2">Click to upload photo</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={uploading}
                    onClick={() => document.getElementById(`photo-${item.id}`)?.click()}
                  >
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                </>
              )}
              <input
                id={`photo-${item.id}`}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Comments</Label>
            <Textarea
              value={item.comments || ""}
              onChange={(e) => handleCommentsChange(e.target.value)}
              rows={3}
              placeholder="Add any observations or notes..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Tags
            </Label>
            <TagInput
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={handleTagsChange}
              placeholder="Add tags to categorize this item..."
              maxTags={5}
            />
          </div>
        </div>

        {item.requiresAction && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <Badge variant="destructive">Action Required</Badge>
            </div>
            <p className="text-sm text-red-700 mt-1">
              This item requires corrective action
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
