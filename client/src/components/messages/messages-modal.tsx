import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Send, Trash2, Plus, User, Clock, CheckCircle, X } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: number;
  sender: string;
  recipient: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
};

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  zones: string[];
}

interface MessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MessagesModal({ open, onOpenChange }: MessagesModalProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch received messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user && open,
  });

  // Fetch sent messages
  const { data: sentMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/sent"],
    enabled: !!user && open,
  });

  // Fetch all users for recipient selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && open,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (messageData: { recipient: string; subject: string; body: string }) => {
      return await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      setComposeOpen(false);
      setRecipient("");
      setSubject("");
      setBody("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Mark message as read mutation
  const markAsRead = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest("PUT", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  // Delete message mutation
  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      setSelectedMessage(null);
      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!recipient || !body.trim()) {
      toast({
        title: "Error",
        description: "Please select a recipient and enter a message",
        variant: "destructive",
      });
      return;
    }

    sendMessage.mutate({ recipient, subject, body });
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead && message.recipient === user?.username) {
      markAsRead.mutate(message.id);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    deleteMessage.mutate(messageId);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMessage(null);
      setComposeOpen(false);
    }
    onOpenChange(newOpen);
  };

  const renderMessageList = (messageList: Message[], isSent = false) => (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {messageList.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          {isSent ? "No sent messages" : "No messages"}
        </div>
      ) : (
        messageList.map((message) => (
          <Card
            key={message.id}
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedMessage?.id === message.id ? "bg-blue-50 border-blue-200" : ""
            } ${
              !message.isRead && !isSent ? "bg-blue-50/50 border-blue-100" : ""
            }`}
            onClick={() => handleMessageClick(message)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!message.isRead && !isSent && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="font-medium text-sm">
                    {isSent ? message.recipient : message.sender}
                  </span>
                  {message.isRead && !isSent && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {format(new Date(message.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
              <div className="mt-1">
                <div className="font-medium text-xs">
                  {message.subject || "No subject"}
                </div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {message.body}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderMessageDetail = () => {
    if (!selectedMessage) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Select a message to view details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-48">
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">
                {selectedMessage.subject || "No subject"}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>From: {selectedMessage.sender}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(selectedMessage.createdAt), "MMM d, h:mm a")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!selectedMessage.isRead && selectedMessage.recipient === user?.username && (
                <Badge variant="secondary" className="text-xs">Unread</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                disabled={deleteMessage.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        <div className="p-3 overflow-y-auto h-32">
          <div className="whitespace-pre-wrap text-gray-700 text-sm">
            {selectedMessage.body}
          </div>
        </div>
      </div>
    );
  };

  const renderComposeForm = () => (
    <div className="space-y-3">
      <div>
        <Label htmlFor="recipient" className="text-sm">To</Label>
        <Select value={recipient} onValueChange={setRecipient}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {users
              .filter((u: User) => u.username !== user?.username)
              .map((u: User) => (
                <SelectItem key={u.username} value={u.username}>
                  {u.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="subject" className="text-sm">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject (optional)"
          className="h-8"
        />
      </div>
      <div>
        <Label htmlFor="body" className="text-sm">Message</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setComposeOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSendMessage} disabled={sendMessage.isPending}>
          <Send className="w-3 h-3 mr-1" />
          Send
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Messages</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComposeOpen(true)}
              disabled={composeOpen}
            >
              <Plus className="w-3 h-3 mr-1" />
              New Message
            </Button>
          </DialogTitle>
        </DialogHeader>

        {composeOpen ? (
          renderComposeForm()
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inbox">Inbox</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
              <TabsContent value="inbox" className="mt-3">
                {renderMessageList(messages)}
              </TabsContent>
              <TabsContent value="sent" className="mt-3">
                {renderMessageList(sentMessages, true)}
              </TabsContent>
            </Tabs>

            {selectedMessage && (
              <div className="border-t pt-4">
                {renderMessageDetail()}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}