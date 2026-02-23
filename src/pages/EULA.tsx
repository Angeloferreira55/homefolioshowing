import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';
import { Shield } from 'lucide-react';

const EULA = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="End-User License Agreement"
        description="Read the End-User License Agreement (EULA) for using Home Folio's platform and services."
        url="https://homefolio-central-link.lovable.app/eula"
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
              End User License Agreement
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
              {/* Intro */}
              <div>
                <p className="text-muted-foreground mb-4">
                  This End User License Agreement ("Agreement") is a legally binding
                  contract between you ("User," "you," or "your") and Home Folio LLC,
                  a New Mexico limited liability company ("Company," "we," "us," or
                  "our"), governing your access to and use of the Home Folio
                  application, including its web and mobile versions, and all related
                  services (collectively, the "Application").
                </p>
                <p className="text-muted-foreground font-semibold uppercase">
                  BY CREATING AN ACCOUNT, ACCESSING, OR USING THE APPLICATION, YOU
                  ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND
                  BY THIS AGREEMENT. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE
                  THE APPLICATION.
                </p>
              </div>

              {/* 1. Definitions */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  1. Definitions
                </h2>
                <ul className="text-muted-foreground space-y-3">
                  <li>
                    <strong className="text-foreground">"MLS"</strong> means a
                    Multiple Listing Service, including but not limited to the
                    Southwest Multiple Listing Service, Inc. (SWMLS), that provides
                    real estate listing data to its authorized members.
                  </li>
                  <li>
                    <strong className="text-foreground">"MLS Data"</strong> means any
                    real estate listing information, property details, photographs,
                    showing instructions, or other data retrieved through the
                    Application's integration with MLS systems via the Spark API or
                    other authorized data feeds.
                  </li>
                  <li>
                    <strong className="text-foreground">"Spark API"</strong> means the
                    application programming interface provided by FBS Data Systems
                    (Flexmls) that enables authorized access to MLS data.
                  </li>
                  <li>
                    <strong className="text-foreground">"Subscription"</strong> means
                    the paid recurring access plan that entitles you to use the
                    Application and its features.
                  </li>
                  <li>
                    <strong className="text-foreground">"User Content"</strong> means
                    any data, notes, schedules, preferences, or other information you
                    create, upload, or input into the Application.
                  </li>
                </ul>
              </div>

              {/* 2. Eligibility */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  2. Eligibility
                </h2>
                <p className="text-muted-foreground mb-4">
                  The Application is designed exclusively for use by licensed real
                  estate professionals. By using the Application, you represent and
                  warrant that:
                </p>
                <ol className="list-[lower-alpha] pl-6 text-muted-foreground space-y-2">
                  <li>
                    You hold a current, valid real estate license issued by the New
                    Mexico Real Estate Commission or an equivalent state licensing
                    authority;
                  </li>
                  <li>
                    You are an active member in good standing of an MLS that is
                    supported by the Application;
                  </li>
                  <li>You are at least eighteen (18) years of age;</li>
                  <li>
                    You have the legal authority to enter into this Agreement; and
                  </li>
                  <li>
                    Your use of the Application will comply with all applicable
                    federal, state, and local laws and regulations, as well as all MLS
                    rules and policies.
                  </li>
                </ol>
              </div>

              {/* 3. Account Registration and Security */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  3. Account Registration and Security
                </h2>
                <p className="text-muted-foreground mb-4">
                  To use the Application, you must create an account. You agree to:
                </p>
                <ol className="list-[lower-alpha] pl-6 text-muted-foreground space-y-2">
                  <li>
                    Provide accurate, current, and complete registration information;
                  </li>
                  <li>
                    Maintain the confidentiality and security of your account
                    credentials;
                  </li>
                  <li>
                    Immediately notify us of any unauthorized access to or use of your
                    account;
                  </li>
                  <li>
                    Accept responsibility for all activities that occur under your
                    account; and
                  </li>
                  <li>
                    Not share your login credentials with any unauthorized third
                    party.
                  </li>
                </ol>
              </div>

              {/* 4. License Grant */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  4. License Grant
                </h2>
                <p className="text-muted-foreground mb-4">
                  Subject to the terms and conditions of this Agreement, Home Folio
                  LLC grants you a limited, non-exclusive, non-transferable, revocable
                  license to access and use the Application for your personal or
                  professional real estate business purposes.
                </p>
                <p className="text-muted-foreground">
                  This license does not constitute a sale of the Application or any
                  copy thereof. Home Folio LLC retains all rights, title, and interest
                  in and to the Application not expressly granted herein.
                </p>
              </div>

              {/* 5. Restrictions */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  5. Restrictions
                </h2>
                <p className="text-muted-foreground mb-4">You agree not to:</p>
                <ol className="list-[lower-alpha] pl-6 text-muted-foreground space-y-2">
                  <li>
                    Copy, reproduce, distribute, or create derivative works of the
                    Application or any part thereof;
                  </li>
                  <li>
                    Modify, adapt, translate, reverse-engineer, decompile,
                    disassemble, or attempt to derive the source code of the
                    Application;
                  </li>
                  <li>
                    Sublicense, lease, rent, loan, sell, or otherwise transfer the
                    Application or access to it to any third party;
                  </li>
                  <li>
                    Remove, alter, or obscure any proprietary notices, labels, or
                    marks on the Application;
                  </li>
                  <li>
                    Use the Application for any unlawful purpose or in violation of
                    any applicable laws or regulations;
                  </li>
                  <li>
                    Use the Application to develop a competing product or service;
                  </li>
                  <li>
                    Circumvent, disable, or otherwise interfere with any
                    security-related features of the Application; or
                  </li>
                  <li>
                    Use MLS Data obtained through the Application in any manner that
                    violates MLS rules, regulations, or licensing agreements.
                  </li>
                </ol>
              </div>

              {/* 6. Intellectual Property */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-muted-foreground mb-4">
                  The Application, including but not limited to its design, code,
                  graphics, logos, user interface, features, and documentation, is the
                  exclusive property of Home Folio LLC and is protected by United
                  States and international copyright, trademark, patent, trade secret,
                  and other intellectual property laws.
                </p>
                <p className="text-muted-foreground">
                  Nothing in this Agreement grants you any right to use the Home Folio
                  name, logo, or trademarks without prior written consent.
                </p>
              </div>

              {/* 7. User Content */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  7. User Content
                </h2>
                <p className="text-muted-foreground mb-4">
                  You retain ownership of all content you upload, create, or store
                  through the Application ("User Content"), including but not limited
                  to property photos, documents, client information, and session data.
                </p>
                <p className="text-muted-foreground">
                  By using the Application, you grant Home Folio LLC a limited,
                  non-exclusive, royalty-free license to host, store, display, and
                  transmit your User Content solely as necessary to provide the
                  Application's services to you and your designated recipients (e.g.,
                  shared session links for clients).
                </p>
              </div>

              {/* 8. MLS Data Usage */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  8. MLS Data Usage
                </h2>
                <p className="text-muted-foreground mb-4">
                  The Application may retrieve and display MLS Data for your
                  convenience. You acknowledge and agree that:
                </p>
                <ol className="list-[lower-alpha] pl-6 text-muted-foreground space-y-2">
                  <li>
                    MLS Data is owned by the respective MLS and is subject to the
                    MLS's terms, rules, and regulations;
                  </li>
                  <li>
                    You will use MLS Data only in accordance with your MLS membership
                    agreement and all applicable MLS rules;
                  </li>
                  <li>
                    Home Folio LLC does not guarantee the accuracy, completeness, or
                    timeliness of MLS Data; and
                  </li>
                  <li>
                    You are solely responsible for verifying MLS Data before relying
                    on it for any purpose.
                  </li>
                </ol>
              </div>

              {/* 9. Subscription and Payment */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  9. Subscription and Payment
                </h2>
                <p className="text-muted-foreground mb-4">
                  Access to certain features of the Application requires a paid
                  Subscription. Subscription fees are billed in advance on a monthly
                  or annual basis through our payment processor, Stripe. All fees are
                  non-refundable except as required by applicable law.
                </p>
                <p className="text-muted-foreground">
                  Home Folio LLC reserves the right to modify Subscription pricing
                  with at least 30 days' advance notice. Your continued use of the
                  Application after a price change takes effect constitutes your
                  acceptance of the new pricing.
                </p>
              </div>

              {/* 10. Termination */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  10. Termination
                </h2>
                <p className="text-muted-foreground mb-4">
                  This Agreement is effective until terminated. You may terminate this
                  Agreement at any time by deleting your account and ceasing all use
                  of the Application.
                </p>
                <p className="text-muted-foreground mb-4">
                  Home Folio LLC may terminate or suspend your license and access to
                  the Application immediately, without prior notice or liability, if
                  you breach any term of this Agreement, engage in prohibited conduct,
                  or for any other reason at our sole discretion.
                </p>
                <p className="text-muted-foreground">
                  Upon termination, your right to use the Application will immediately
                  cease. Sections of this Agreement that by their nature should
                  survive termination shall survive, including but not limited to
                  Intellectual Property, Disclaimer of Warranties, and Limitation of
                  Liability.
                </p>
              </div>

              {/* 11. Disclaimer of Warranties */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  11. Disclaimer of Warranties
                </h2>
                <p className="text-muted-foreground">
                  THE APPLICATION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                  WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
                  INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                  HOME FOLIO LLC DOES NOT WARRANT THAT THE APPLICATION WILL BE
                  UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER
                  HARMFUL COMPONENTS. YOUR USE OF THE APPLICATION IS AT YOUR SOLE
                  RISK.
                </p>
              </div>

              {/* 12. Limitation of Liability */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  12. Limitation of Liability
                </h2>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                  SHALL HOME FOLIO LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS
                  BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                  PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
                  DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR
                  USE OF OR INABILITY TO USE THE APPLICATION, EVEN IF HOME FOLIO LLC
                  HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT
                  SHALL HOME FOLIO LLC'S TOTAL LIABILITY EXCEED THE AMOUNT YOU HAVE
                  PAID TO HOME FOLIO LLC IN THE TWELVE (12) MONTHS PRECEDING THE
                  CLAIM.
                </p>
              </div>

              {/* 13. Governing Law */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  13. Governing Law
                </h2>
                <p className="text-muted-foreground">
                  This Agreement shall be governed by and construed in accordance with
                  the laws of the State of New Mexico, United States, without regard
                  to its conflict of law provisions. Any disputes arising under or in
                  connection with this Agreement shall be subject to the exclusive
                  jurisdiction of the courts located in Bernalillo County, New Mexico.
                </p>
              </div>

              {/* 14. Changes to This Agreement */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  14. Changes to This Agreement
                </h2>
                <p className="text-muted-foreground">
                  Home Folio LLC reserves the right to modify this Agreement at any
                  time. We will notify you of material changes by posting the updated
                  Agreement on the Application or by sending you an email. Your
                  continued use of the Application after such modifications
                  constitutes your acceptance of the revised Agreement. We encourage
                  you to review this Agreement periodically.
                </p>
              </div>

              {/* 15. Contact Us */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  15. Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have any questions about this End User License Agreement,
                  please contact us at{' '}
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

export default EULA;
