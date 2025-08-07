import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Phone, Send, X, CheckCircle } from "lucide-react";

interface WhatsAppSupportProps {
  phoneNumber?: string;
  businessHours?: string;
}

const WhatsAppSupport = ({ 
  phoneNumber = "+250 788 123 456", 
  businessHours = "24/7" 
}: WhatsAppSupportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent(
      `Hello! I need help with my booking on Ndarehe Explorer Hub.`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\s/g, '')}?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendMessage = () => {
    if (!message.trim() || !name.trim() || !email.trim()) return;
    
    // In a real implementation, this would send to your backend
    // For now, we'll simulate sending to WhatsApp
    const fullMessage = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\s/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setMessage("");
    setName("");
    setEmail("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleWhatsAppClick}
          size="lg"
          className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-2 -right-2">
          <Badge 
            variant={isOnline ? "default" : "secondary"} 
            className="text-xs"
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="fixed bottom-6 left-6 z-50 rounded-full h-12 w-12 bg-white shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Live Chat Support
            </DialogTitle>
          </DialogHeader>
          
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ndarehe Explorer Hub</h3>
                  <p className="text-sm text-muted-foreground">Customer Support</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {isOnline ? (
                <>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">We're here to help!</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Response time: Usually within 5 minutes
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      placeholder="Your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Textarea
                      placeholder="How can we help you today?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || !name.trim() || !email.trim()}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    We're currently offline. Please leave us a message and we'll get back to you soon!
                  </p>
                  <Button onClick={handleWhatsAppClick} className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact via WhatsApp
                  </Button>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Business Hours: {businessHours}</span>
                  <span>Phone: {phoneNumber}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsAppSupport; 