import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  HelpCircle, 
  Rocket, 
  Wrench, 
  Info, 
  Mail, 
  Keyboard, 
  Search, 
  Plus, 
  FileText, 
  Settings, 
  MessageSquare,
  Copy,
  User,
  Tag
} from "lucide-react";

interface HelpCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  _count: { articles: number };
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  order: number;
  isPublished: boolean;
  viewCount: number;
  category: HelpCategory;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  status: string;
  submittedByUser?: { firstName: string; lastName: string; email: string };
  assignedToUser?: { firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

const HelpPanel: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('help');
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: [] as string[],
    order: 0,
    isPublished: true
  });

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL'
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [categoriesRes, articlesRes, ticketsRes] = await Promise.all([
        adminApi.getHelpCategories(token),
        adminApi.getHelpArticles(token, selectedCategory, searchTerm),
        adminApi.getSupportTickets(token)
      ]);

      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (articlesRes.data.success) setArticles(articlesRes.data.data);
      if (ticketsRes.data.success) setTickets(ticketsRes.data.data.tickets);
    } catch (error: any) {
      console.error('Error fetching help data:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to fetch help data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleCreateArticle = async () => {
    if (!token) return;
    
    try {
      const response = await adminApi.createHelpArticle(token, articleForm);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Help article created successfully',
        });
        setShowCreateArticle(false);
        setArticleForm({ title: '', content: '', categoryId: '', tags: [], order: 0, isPublished: true });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to create article',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitTicket = async () => {
    if (!token) return;
    
    try {
      const response = await adminApi.submitSupportTicket(token, ticketForm);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Support ticket submitted successfully',
        });
        setShowCreateTicket(false);
        setTicketForm({ subject: '', description: '', priority: 'MEDIUM', category: 'GENERAL' });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to submit ticket',
        variant: 'destructive'
      });
    }
  };

  const copyDiagnostics = async () => {
    try {
      const payload = [
        `User Agent: ${navigator.userAgent}`,
        `Language: ${navigator.language}`,
        `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `Location: ${window.location.href}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n');
      
      await navigator.clipboard.writeText(payload);
      toast({
        title: 'Success',
        description: 'Diagnostics copied to clipboard',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy diagnostics',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading help content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Help & Support Center</h2>
          <p className="text-gray-600">Comprehensive guides, knowledge base, and support system</p>
        </div>
        <HelpCircle className="h-6 w-6 text-green-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="help" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Help Center
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Info
          </TabsTrigger>
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Quick Start
          </TabsTrigger>
        </TabsList>

        {/* Help Center Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category._count.articles})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Dialog open={showCreateArticle} onOpenChange={setShowCreateArticle}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Help Article</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={articleForm.title}
                      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                      placeholder="Article title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={articleForm.categoryId} onValueChange={(value) => setArticleForm({ ...articleForm, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                      placeholder="Article content (markdown supported)"
                      rows={10}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={handleCreateArticle}>Create Article</Button>
                    <Button variant="outline" onClick={() => setShowCreateArticle(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {articles.map(article => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{article.category.name}</Badge>
                        <Badge variant={article.isPublished ? "default" : "secondary"}>
                          {article.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {article.viewCount} views
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(article.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3">{article.content}</p>
                  {article.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {article.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {articles.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No help articles found</p>
                  <p className="text-sm text-gray-400">Create your first help article to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Support Tickets</h3>
            <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={ticketForm.category} onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="BILLING">Billing</SelectItem>
                        <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                        <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      placeholder="Detailed description of the issue or request"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={handleSubmitTicket}>Submit Ticket</Button>
                    <Button variant="outline" onClick={() => setShowCreateTicket(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {tickets.map(ticket => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{ticket.category}</Badge>
                        <Badge 
                          variant={
                            ticket.priority === 'URGENT' ? 'destructive' :
                            ticket.priority === 'HIGH' ? 'default' :
                            ticket.priority === 'MEDIUM' ? 'secondary' : 'outline'
                          }
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge 
                          variant={
                            ticket.status === 'OPEN' ? 'default' :
                            ticket.status === 'IN_PROGRESS' ? 'secondary' :
                            ticket.status === 'RESOLVED' ? 'outline' : 'secondary'
                          }
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                      <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                      {ticket.submittedByUser && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {ticket.submittedByUser.firstName} {ticket.submittedByUser.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{ticket.description}</p>
                </CardContent>
              </Card>
            ))}
            
            {tickets.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No support tickets found</p>
                  <p className="text-sm text-gray-400">Submit a ticket to get help with any issues</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Get system information and diagnostics for troubleshooting.
              </p>
              <div className="flex gap-2">
                <Button onClick={copyDiagnostics} className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy System Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Start Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-green-600" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Use the sidebar to navigate: Bookings, Users, Accommodations, Transportation, Tours.</li>
                <li>Generate and download insights in Reports; filter by date.</li>
                <li>Update system configuration in Settings (URLs, providers, toggles).</li>
                <li>Review KPIs and trends in Analytics; switch time ranges.</li>
                <li>Create help articles and manage support tickets in Help & Support.</li>
              </ol>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={copyDiagnostics}>
                  <Info className="h-4 w-4 mr-2" />
                  Copy Diagnostics
                </Button>
                <a href="mailto:support@ndarehe.com">
                  <Button size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I add a new accommodation, transport, tour, or user?</AccordionTrigger>
                  <AccordionContent>
                    Go to the Dashboard tab and click <b>Add New</b>. Choose the entity and fill in the form. You can also manage entries from their respective pages.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Why can't I see any data on pages?</AccordionTrigger>
                  <AccordionContent>
                    Ensure your backend is running and reachable. Check the system diagnostics in the Help section for connection status.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How can I export reports?</AccordionTrigger>
                  <AccordionContent>
                    Open <b>Reports</b>, select a <b>date range</b>, click <b>Generate Report</b>, then <b>Download CSV</b>.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I configure email/SMS providers?</AccordionTrigger>
                  <AccordionContent>
                    Open <b>Settings</b>, enable providers and enter keys (e.g., Twilio, Stripe, email From). Save changes.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>How do I create help articles?</AccordionTrigger>
                  <AccordionContent>
                    Go to the <b>Help Center</b> tab and click <b>New Article</b>. Fill in the title, content, and select a category.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-green-600" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Hard refresh (Ctrl/Cmd+Shift+R) to clear cached assets.</li>
                <li>Check your API base URL and CORS settings.</li>
                <li>Rate-limited? Wait a minute or reduce rapid requests.</li>
                <li>Verify JWT token presence in requests for protected endpoints.</li>
                <li>Use system diagnostics to check database and system health.</li>
              </ul>
              <Separator className="my-3" />
              <div className="flex items-center text-xs text-gray-500 gap-2">
                <Info className="h-3.5 w-3.5" />
                For persistent issues, copy diagnostics and share with support.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-green-600" />
                Keyboard Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between border rounded p-3">
                <span>Focus search (on listing pages)</span>
                <code className="text-xs bg-gray-100 rounded px-2 py-1">/</code>
              </div>
              <div className="flex items-center justify-between border rounded p-3">
                <span>Clear filters</span>
                <code className="text-xs bg-gray-100 rounded px-2 py-1">Alt + C</code>
              </div>
              <div className="flex items-center justify-between border rounded p-3">
                <span>Open Add New (dashboard)</span>
                <code className="text-xs bg-gray-100 rounded px-2 py-1">Alt + N</code>
              </div>
              <div className="flex items-center justify-between border rounded p-3">
                <span>Generate report</span>
                <code className="text-xs bg-gray-100 rounded px-2 py-1">Alt + G</code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Contact Support</CardTitle>
              <Eye className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <div>Email: <a className="text-green-700 hover:underline" href="mailto:support@ndarehe.com">support@ndarehe.com</a></div>
              <div>Hours: Mon–Fri, 09:00–18:00 (GMT+2)</div>
              <div className="pt-2">
                <Button onClick={() => setShowCreateTicket(true)} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Submit Support Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpPanel;


