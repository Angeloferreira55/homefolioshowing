import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, BookOpen, Video, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

const Help = () => {
  const navigate = useNavigate();
  const { startTour } = useOnboarding();

  const handleGetStarted = () => {
    startTour();
    navigate('/admin/showings');
  };
  const faqs = [
    {
      question: 'How do I create a showing session?',
      answer: 'Click the "New Home Folio" button on the Sessions page. Fill in the session title, client name, and optional date. We recommend enabling password protection to keep your session secure.',
    },
    {
      question: 'How do I add properties to a session?',
      answer: 'You have 3 options: 1) Upload a PDF of the MLS sheet along with a photo, 2) Copy & paste a property link from Realtor.com, or 3) Enter all property information manually.',
    },
    {
      question: 'How do I share a session with my client?',
      answer: 'Once you create a session and add properties, click "Share" to copy the public link. If you enabled password protection, make sure to share the access code with your client separately.',
    },
    {
      question: 'Can I upload documents for each property?',
      answer: 'Yes! Click the "Doc" button on any property card to upload and attach documents like disclosures, inspection reports, HOA documents, etc.',
    },
    {
      question: 'How do clients view my showing sessions?',
      answer: 'Clients open the shared link on their phone or computer, enter the password if required, and can browse properties, view documents, get directions, and leave ratings and feedback.',
    },
    {
      question: 'Can I edit or archive sessions?',
      answer: 'Yes! You can edit session details, add/remove properties, and archive sessions you no longer need. Archived sessions are moved to the "Archived" tab.',
    },
    {
      question: 'What subscription plans are available?',
      answer: 'HomeFolio offers Starter (free), Pro ($9.99/mo), Teams 5 ($45/mo for up to 5 agents), and Teams 10 ($75/mo for up to 10 agents). Save 20% with yearly billing. Each tier unlocks additional features like unlimited sessions, team collaboration, and more.',
    },
    {
      question: 'How do I update my profile information?',
      answer: 'Go to "My Profile" from the sidebar. Upload your photo, add your bio, brokerage info, license number, social media links, and more. Don\'t forget to click "Save Changes"!',
    },
    {
      question: 'How do I track client engagement?',
      answer: 'Visit the Analytics page to see session views, property ratings, client feedback, and engagement metrics across all your showing sessions.',
    },
    {
      question: 'Can I customize the branding on sessions?',
      answer: 'Yes! Upload your brokerage logo and customize your profile. Your branding will appear on all shared sessions.',
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Help & Support"
        description="Get answers to common questions and learn how to use HomeFolio"
        icon={HelpCircle}
      />

      <div className="space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" onClick={handleGetStarted}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>
                Learn the basics and create your first showing session
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden h-full">
            {/* Coming Soon Banner */}
            <div className="absolute top-4 -right-12 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold py-1 px-12 rotate-45 shadow-lg z-10">
              COMING SOON
            </div>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Video Tutorials</CardTitle>
              <CardDescription>
                Watch step-by-step guides to master HomeFolio
              </CardDescription>
            </CardHeader>
          </Card>

          <a href="mailto:support@home-folio.net?subject=HomeFolio Support Request" className="block h-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Contact Support</CardTitle>
                <CardDescription>
                  Get help from our support team
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find answers to the most common questions about HomeFolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Need More Help?</CardTitle>
            <CardDescription>
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@home-folio.net</p>
              </div>
            </div>
            <Button className="gap-2" asChild>
              <a href="mailto:support@home-folio.net?subject=HomeFolio Support Request">
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Additional Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative overflow-hidden rounded-lg">
              {/* Coming Soon Banner */}
              <div className="absolute top-2 -right-8 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold py-1 px-10 rotate-45 shadow-lg z-10">
                COMING SOON
              </div>
              <a
                href="#"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Video Library</p>
                    <p className="text-sm text-muted-foreground">How-to videos and demos</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Help;
