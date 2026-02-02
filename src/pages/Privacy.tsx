import { Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Privacy Policy
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
                  Introduction
                </h2>
                <p className="text-muted-foreground">
                  HomeFolio ("we," "our," or "us") is committed to protecting
                  your privacy. This Privacy Policy explains how we collect,
                  use, disclose, and safeguard your information when you use
                  our platform.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Information We Collect
                </h2>
                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Account Information
                </h3>
                <p className="text-muted-foreground mb-4">
                  When you create an account, we collect your name, email
                  address, phone number, and professional information such as
                  brokerage name and license number.
                </p>

                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Property Information
                </h3>
                <p className="text-muted-foreground mb-4">
                  We store property details you enter, including addresses,
                  prices, photos, and documents you upload for sharing with
                  clients.
                </p>

                <h3 className="font-semibold text-foreground mt-4 mb-2">
                  Usage Data
                </h3>
                <p className="text-muted-foreground">
                  We automatically collect information about how you interact
                  with our platform, including pages visited, features used,
                  and session duration.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>To provide and maintain our services</li>
                  <li>To personalize your experience</li>
                  <li>To send you updates and marketing communications</li>
                  <li>To improve our platform based on usage patterns</li>
                  <li>To respond to your inquiries and support requests</li>
                  <li>To detect and prevent fraud or abuse</li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Information Sharing
                </h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share
                  information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>
                    <strong>Service providers</strong> who help us operate our
                    platform (hosting, analytics, email)
                  </li>
                  <li>
                    <strong>Your clients</strong> when you share session links
                    (only the information you choose to include)
                  </li>
                  <li>
                    <strong>Legal authorities</strong> when required by law
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Data Security
                </h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including
                  encryption, secure servers, and access controls. However, no
                  method of transmission over the internet is 100% secure.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Your Rights
                </h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Cookies
                </h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to maintain your
                  session, remember your preferences, and analyze usage. You
                  can control cookies through your browser settings.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please
                  contact us at{' '}
                  <a
                    href="mailto:privacy@homefolio.app"
                    className="text-accent hover:underline"
                  >
                    privacy@homefolio.app
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

export default Privacy;
