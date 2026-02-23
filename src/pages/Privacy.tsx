import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="Learn how Home Folio collects, uses, and protects your personal information."
        url="https://homefolio-central-link.lovable.app/privacy"
      />
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
            <p className="text-muted-foreground mb-2">
              Home Folio —{' '}
              <a href="https://home-folio.net" className="text-accent hover:underline">
                https://home-folio.net
              </a>
            </p>
            <p className="text-muted-foreground">
              Effective Date: February 12, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <div className="bg-card rounded-2xl p-8 card-elevated space-y-8">
              {/* Introduction */}
              <div>
                <p className="text-muted-foreground mb-4">
                  Home Folio LLC ("Company," "we," "us," or "our") is committed to
                  protecting the privacy of its users. This Privacy Policy explains
                  how we collect, use, disclose, and safeguard your information when
                  you use the Home Folio application, including its web and mobile
                  versions (collectively, the "Application").
                </p>
                <p className="text-muted-foreground">
                  Please read this Privacy Policy carefully. By accessing or using
                  the Application, you acknowledge that you have read, understood,
                  and agree to the practices described herein. If you do not agree
                  with this Privacy Policy, please do not use the Application.
                </p>
              </div>

              {/* 1. Information We Collect */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-muted-foreground mb-4">
                  We collect information in the following categories:
                </p>

                <h3 className="font-semibold text-foreground mt-6 mb-3">
                  1.1 Information You Provide Directly
                </h3>
                <ul className="text-muted-foreground space-y-3">
                  <li>
                    <strong className="text-foreground">Account Registration Information:</strong>{' '}
                    Your name, email address, phone number, brokerage affiliation,
                    and real estate license number when you create an account.
                  </li>
                  <li>
                    <strong className="text-foreground">Profile Information:</strong>{' '}
                    Professional details you choose to add to your profile, such as
                    your areas of specialization, certifications, or professional
                    headshot.
                  </li>
                  <li>
                    <strong className="text-foreground">User Content:</strong>{' '}
                    Notes, showing schedules, client preferences, route preferences,
                    and any other information you input into the Application.
                  </li>
                  <li>
                    <strong className="text-foreground">Payment Information:</strong>{' '}
                    Billing name, billing address, and payment method details.
                    Payment processing is handled by our third-party payment
                    processor (Stripe); we do not store full credit card numbers on
                    our servers.
                  </li>
                  <li>
                    <strong className="text-foreground">Communications:</strong>{' '}
                    Information you provide when you contact our support team or
                    communicate with us.
                  </li>
                </ul>

                <h3 className="font-semibold text-foreground mt-6 mb-3">
                  1.2 Information Collected Through MLS Integration
                </h3>
                <ul className="text-muted-foreground space-y-3">
                  <li>
                    <strong className="text-foreground">MLS Authentication Tokens:</strong>{' '}
                    When you authenticate through the Spark Platform using OAuth 2.0,
                    we receive and securely store authentication tokens that allow us
                    to access MLS data on your behalf. We do not receive or store
                    your MLS username or password.
                  </li>
                  <li>
                    <strong className="text-foreground">MLS Listing Data:</strong>{' '}
                    Property details, listing information, showing instructions, and
                    related data retrieved from your MLS through the Spark API based
                    on your actions within the Application. This data belongs to the
                    MLS and is subject to MLS rules and policies.
                  </li>
                </ul>

                <h3 className="font-semibold text-foreground mt-6 mb-3">
                  1.3 Information Collected Automatically
                </h3>
                <ul className="text-muted-foreground space-y-3">
                  <li>
                    <strong className="text-foreground">Device Information:</strong>{' '}
                    Device type, operating system, browser type, unique device
                    identifiers, and mobile network information.
                  </li>
                  <li>
                    <strong className="text-foreground">Usage Data:</strong>{' '}
                    Pages and features accessed, time and date of visits, time spent
                    on pages, navigation paths, and interaction patterns within the
                    Application.
                  </li>
                  <li>
                    <strong className="text-foreground">Location Data:</strong>{' '}
                    With your permission, approximate or precise geographic location
                    data used for route optimization between showing appointments.
                    You may disable location services through your device settings,
                    though this may limit certain features.
                  </li>
                </ul>
              </div>

              {/* 2. How We Use Your Information */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  2. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>To provide and maintain our services</li>
                  <li>To personalize your experience</li>
                  <li>To process your subscription and payments</li>
                  <li>To retrieve and display MLS listing data on your behalf</li>
                  <li>To optimize showing routes and schedules</li>
                  <li>To send you updates and marketing communications</li>
                  <li>To improve our platform based on usage patterns</li>
                  <li>To respond to your inquiries and support requests</li>
                  <li>To detect and prevent fraud or abuse</li>
                </ul>
              </div>

              {/* 3. Client Privacy */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  3. Client Privacy
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">Important:</strong> Home Folio
                  does not collect personal information from buyers or clients who
                  view shared Home Folios. Client contact details (name, email, phone)
                  are stored by the agent and are accessible exclusively to that agent—
                  they are never shared with third parties or other users.
                </p>
                <p className="text-muted-foreground">
                  When clients view a shared Home Folio link, we may collect anonymous
                  usage data (pages viewed, time spent) to help agents understand
                  engagement, but no personally identifiable information is collected
                  from viewers.
                </p>
              </div>

              {/* 4. Information Sharing */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  4. Information Sharing
                </h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share
                  information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>
                    <strong className="text-foreground">Service providers</strong>{' '}
                    who help us operate our platform (hosting, analytics, email,
                    payment processing via Stripe)
                  </li>
                  <li>
                    <strong className="text-foreground">MLS systems</strong>{' '}
                    to retrieve listing data through authorized API integrations
                    (e.g., Spark API)
                  </li>
                  <li>
                    <strong className="text-foreground">Your clients</strong>{' '}
                    when you share session links (only the information you choose
                    to include)
                  </li>
                  <li>
                    <strong className="text-foreground">Legal authorities</strong>{' '}
                    when required by law
                  </li>
                </ul>
              </div>

              {/* 5. Data Security */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  5. Data Security
                </h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including
                  encryption, secure servers, and access controls to protect your
                  information. MLS API credentials are stored securely and are never
                  exposed to other users. However, no method of transmission over
                  the internet is 100% secure, and we cannot guarantee absolute
                  security.
                </p>
              </div>

              {/* 6. Your Rights */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  6. Your Rights
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
                  <li>Revoke MLS integration access at any time</li>
                </ul>
              </div>

              {/* 7. Cookies */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  7. Cookies
                </h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to maintain your
                  session, remember your preferences, and analyze usage. You
                  can control cookies through your browser settings.
                </p>
              </div>

              {/* 8. Changes to This Policy */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  8. Changes to This Policy
                </h2>
                <p className="text-muted-foreground">
                  Home Folio LLC reserves the right to modify this Privacy Policy at
                  any time. We will notify you of material changes by posting the
                  updated policy on the Application or by sending you an email. Your
                  continued use of the Application after such modifications
                  constitutes your acceptance of the revised Privacy Policy.
                </p>
              </div>

              {/* 9. Contact Us */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  9. Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please
                  contact us at{' '}
                  <a
                    href="mailto:support@home-folio.net"
                    className="text-accent hover:underline"
                  >
                    support@home-folio.net
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
