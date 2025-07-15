import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, Trash2, MailOpen, Plus, User, Clock, CheckCircle, Home } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type Message = {
  id: number;
  sender: string;
  recipient: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export default function Messages() {
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
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });

  // Fetch sent messages
  const { data: sentMessages = [] } = useQuery({
    queryKey: ["/api/messages/sent"],
    enabled: !!user,
  });

  // Fetch all users for recipient selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (messageData: { recipient: string; subject: string; body: string }) => {
      return await apiRequest("/api/messages", {
        method: "POST",
        body: messageData,
      });
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
      return await apiRequest(`/api/messages/${messageId}/read`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  // Delete message mutation
  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
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

  const renderMessageList = (messageList: Message[], isSent = false) => (
    <div className="space-y-2">
      {messageList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {!message.isRead && !isSent && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {isSent ? message.recipient : message.sender}
                    </span>
                  </div>
                  {message.isRead && !isSent && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {format(new Date(message.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
              <div className="mt-2">
                <div className="font-medium text-sm">
                  {message.subject || "No subject"}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
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
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select a message to view details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedMessage.subject || "No subject"}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>From: {selectedMessage.sender}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(selectedMessage.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!selectedMessage.isRead && selectedMessage.recipient === user?.username && (
                <Badge variant="secondary">Unread</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                disabled={deleteMessage.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="whitespace-pre-wrap text-gray-700">
            {selectedMessage.body}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-gray-600">Team communication and announcements</p>
          </div>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient">To</Label>
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u: any) => u.username !== user?.username)
                      .map((u: any) => (
                        <SelectItem key={u.username} value={u.username}>
                          {u.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject (optional)"
                />
              </div>
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="mt-4">
              <div className="h-[calc(100vh-320px)] overflow-y-auto">
                {renderMessageList(messages)}
              </div>
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              <div className="h-[calc(100vh-320px)] overflow-y-auto">
                {renderMessageList(sentMessages, true)}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {renderMessageDetail()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}