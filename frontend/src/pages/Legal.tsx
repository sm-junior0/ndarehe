import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Eye, UserCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Legal Information</h1>
          <p className="text-muted-foreground">Terms of Service, Privacy Policy, and other legal documents</p>
        </div>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="terms" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Terms
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="cookies" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Cookies
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Terms of Service</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing and using NDAREHE services, you agree to be bound by these Terms of Service 
                  and all applicable laws and regulations. If you do not agree with any of these terms, 
                  you are prohibited from using or accessing this site.
                </p>

                <h3>2. Use License</h3>
                <p>
                  Permission is granted to temporarily use NDAREHE services for personal, non-commercial 
                  transitory viewing only. This is the grant of a license, not a transfer of title, and 
                  under this license you may not:
                </p>
                <ul>
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>

                <h3>3. Booking and Payment Terms</h3>
                <p>
                  All bookings are subject to availability and confirmation. Payment is required at the 
                  time of booking unless otherwise specified. We accept various payment methods including 
                  credit cards, mobile money, and other approved payment systems.
                </p>

                <h3>4. Cancellation Policy</h3>
                <p>
                  Cancellation policies vary by accommodation and service provider. Specific cancellation 
                  terms will be clearly stated during the booking process and in your confirmation email.
                </p>

                <h3>5. Limitation of Liability</h3>
                <p>
                  NDAREHE shall not be liable for any damages arising from the use or inability to use 
                  our services, even if NDAREHE or its representatives have been notified of the possibility 
                  of such damages.
                </p>

                <h3>6. Governing Law</h3>
                <p>
                  These terms and conditions are governed by and construed in accordance with the laws 
                  of Rwanda, and you irrevocably submit to the exclusive jurisdiction of the courts in 
                  that state or location.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you:</p>
                <ul>
                  <li>Create an account or make a booking</li>
                  <li>Contact us for customer support</li>
                  <li>Sign up for our newsletter</li>
                  <li>Participate in surveys or promotions</li>
                </ul>

                <h3>2. How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Process your bookings and payments</li>
                  <li>Provide customer support</li>
                  <li>Send you confirmations and updates about your bookings</li>
                  <li>Improve our services and user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h3>3. Information Sharing</h3>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this policy. We may share your information with:
                </p>
                <ul>
                  <li>Service providers (hotels, tour operators, etc.) to fulfill your bookings</li>
                  <li>Payment processors to handle transactions</li>
                  <li>Legal authorities when required by law</li>
                </ul>

                <h3>4. Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. However, no method of 
                  transmission over the internet is 100% secure.
                </p>

                <h3>5. Your Rights</h3>
                <p>You have the right to:</p>
                <ul>
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Object to certain processing of your information</li>
                </ul>

                <h3>6. Contact Us</h3>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at 
                  privacy@ndarehe.com or +250 788 123 456.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookies">
            <Card>
              <CardHeader>
                <CardTitle>Cookie Policy</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h3>What are Cookies?</h3>
                <p>
                  Cookies are small text files that are placed on your device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences and 
                  improving our services.
                </p>

                <h3>Types of Cookies We Use</h3>
                
                <h4>Essential Cookies</h4>
                <p>
                  These cookies are necessary for the website to function properly. They enable core 
                  functionality such as security, network management, and accessibility.
                </p>

                <h4>Performance Cookies</h4>
                <p>
                  These cookies collect information about how you use our website, such as which pages 
                  you visit most often. This data helps us improve how our website works.
                </p>

                <h4>Functionality Cookies</h4>
                <p>
                  These cookies allow the website to remember choices you make and provide enhanced, 
                  more personal features.
                </p>

                <h4>Marketing Cookies</h4>
                <p>
                  These cookies track your online activity to help advertisers deliver more relevant 
                  advertising or to limit how many times you see an ad.
                </p>

                <h3>Managing Cookies</h3>
                <p>
                  You can control and/or delete cookies as you wish. You can delete all cookies that 
                  are already on your computer and set most browsers to prevent them from being placed.
                </p>

                <h3>Third-Party Cookies</h3>
                <p>
                  We may also use third-party services such as Google Analytics, which may place 
                  cookies on your device. These services have their own privacy policies and cookie policies.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance & Certifications</CardTitle>
                <p className="text-sm text-muted-foreground">Our commitment to legal and regulatory compliance</p>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h3>Rwanda Tourism Board Certification</h3>
                <p>
                  NDAREHE is registered with the Rwanda Tourism Board and complies with all national 
                  tourism regulations and standards.
                </p>

                <h3>Data Protection Compliance</h3>
                <p>
                  We comply with applicable data protection laws including Rwanda's data protection 
                  regulations and international standards for data privacy and security.
                </p>

                <h3>Payment Security</h3>
                <p>
                  Our payment processing is secured with industry-standard encryption and complies 
                  with PCI DSS (Payment Card Industry Data Security Standard) requirements.
                </p>

                <h3>Consumer Protection</h3>
                <p>
                  We adhere to consumer protection laws and regulations in Rwanda, ensuring fair 
                  business practices and transparent terms of service.
                </p>

                <h3>Anti-Money Laundering (AML)</h3>
                <p>
                  We have implemented appropriate measures to prevent money laundering and comply 
                  with relevant financial regulations.
                </p>

                <h3>Accessibility</h3>
                <p>
                  We strive to make our services accessible to all users, including those with 
                  disabilities, in compliance with accessibility standards.
                </p>

                <h3>Environmental Responsibility</h3>
                <p>
                  We promote sustainable tourism practices and work with partners who share our 
                  commitment to environmental protection.
                </p>

                <h3>Regular Audits</h3>
                <p>
                  We conduct regular internal audits and work with external auditors to ensure 
                  ongoing compliance with all applicable laws and regulations.
                </p>

                <h3>Contact for Compliance Issues</h3>
                <p>
                  For any compliance-related inquiries or to report concerns, please contact our 
                  compliance team at compliance@ndarehe.com.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Legal;