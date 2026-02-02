import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';
import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Read the terms and conditions for using HomeFolio's platform and services."
        url="https://homefolio-central-link.lovable.app/terms"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: February 2, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <div className="bg-card rounded-2xl p-8 card-elevated space-y-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Acceptance of Terms
                </h2>
                <p className="text-muted-foreground">
                  By accessing or using HomeFolio ("the Service"), you agree to
                  be bound by these Terms of Service. If you do not agree to
                  these terms, please do not use the Service.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Description of Service
                </h2>
                <p className="text-muted-foreground">
                  HomeFolio provides a platform for real estate agents to
                  organize property showings, share property information with
                  clients, and collect feedback. The Service includes web and
                  mobile applications, document storage, and related features.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Account Registration
                </h2>
                <p className="text-muted-foreground mb-4">
                  To use certain features of the Service, you must register for
                  an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>
                    Notify us immediately of any unauthorized access to your
                    account
                  </li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Acceptable Use
                </h2>
                <p className="text-muted-foreground mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>
                    Use the Service for any illegal purpose or in violation of
                    any laws
                  </li>
                  <li>
                    Upload content that infringes on intellectual property
                    rights
                  </li>
                  <li>
                    Transmit malware, viruses, or other harmful code
                  </li>
                  <li>
                    Attempt to gain unauthorized access to the Service or
                    related systems
                  </li>
                  <li>
                    Use the Service to send spam or unsolicited communications
                  </li>
                  <li>
                    Interfere with or disrupt the Service or servers
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Content and Intellectual Property
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">Your Content:</strong>{' '}
                  You retain ownership of content you upload to the Service.
                  By uploading content, you grant us a license to store,
                  display, and share it as necessary to provide the Service.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Our Content:</strong> The
                  Service and its original content, features, and functionality
                  are owned by HomeFolio and are protected by intellectual
                  property laws.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Payment Terms
                </h2>
                <p className="text-muted-foreground mb-4">
                  Paid plans are billed in advance on a monthly or yearly
                  basis. All fees are non-refundable except as required by law.
                </p>
                <p className="text-muted-foreground">
                  We reserve the right to change our pricing with 30 days'
                  notice. Continued use of the Service after price changes
                  constitutes acceptance of the new pricing.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Termination
                </h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account at any time for
                  violations of these Terms. You may cancel your account at any
                  time. Upon termination, your right to use the Service will
                  immediately cease.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Disclaimer of Warranties
                </h2>
                <p className="text-muted-foreground">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY
                  KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE
                  SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, HOMEFOLIO SHALL NOT BE
                  LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                  OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Changes to Terms
                </h2>
                <p className="text-muted-foreground">
                  We may modify these Terms at any time. We will notify you of
                  material changes via email or through the Service. Your
                  continued use of the Service after changes constitutes
                  acceptance of the modified Terms.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have questions about these Terms, please contact us at{' '}
                  <a
                    href="mailto:legal@homefolio.app"
                    className="text-accent hover:underline"
                  >
                    legal@homefolio.app
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
