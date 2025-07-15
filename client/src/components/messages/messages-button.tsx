import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import MessagesModal from "./messages-modal";

export default function MessagesButton() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Fetch unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <MessageSquare className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
      <MessagesModal open={open} onOpenChange={setOpen} />
    </>
  );
}