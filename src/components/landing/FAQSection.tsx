import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does the "one living link" work?',
    answer: 'When you create a Homefolio for a client, they receive a single private link that never changes. As you add, remove, or reorder properties, the link automatically updates in real-time. Your clients simply refresh the page to see the latest properties—no need for new emails or links.',
  },
  {
    question: 'Can my clients see my notes and feedback?',
    answer: 'You have full control over what clients see. Agent notes and internal observations are private by default. Client feedback and ratings are visible to you in your dashboard, helping you understand their preferences and narrow down their search.',
  },
  {
    question: 'How does route optimization work?',
    answer: 'Our AI-powered route optimization analyzes the addresses of all properties in a showing session and reorders them for the most efficient driving route. You can also set a starting location (like your office) to optimize the route from there. One click opens turn-by-turn directions in Google Maps.',
  },
  {
    question: 'What file types can I attach to properties?',
    answer: 'You can attach any document type including PDFs, images, Word documents, and more. Most agents upload MLS sheets, disclosure documents, inspection reports, and high-resolution photos. There\'s no limit on the number of documents per property.',
  },
  {
    question: 'Is my clients\' information secure?',
    answer: 'Absolutely. All client links are private and unguessable—they use secure random tokens. Your data is encrypted in transit and at rest. We never share or sell your information, and clients don\'t need to create accounts to view their properties. Importantly, we do not collect any buyer information—only you, the agent, have access to your client details.',
  },
  {
    question: 'Can I use HomeFolio on my phone?',
    answer: 'Yes! HomeFolio is fully responsive and works beautifully on phones, tablets, and desktops. Add properties on the go, share links via text, and your clients can browse their Homefolio from any device.',
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer: 'If you downgrade to the free plan, you\'ll keep access to your existing clients but with free tier limits. Your data is never deleted—you can upgrade again anytime to regain full access. We also offer a 14-day money-back guarantee on all paid plans.',
  },
  {
    question: 'Do you offer team or brokerage plans?',
    answer: 'Yes! Our Team plan supports up to 10 agents with shared analytics, client handoffs between team members, and custom branding. For larger brokerages, contact us for enterprise pricing with unlimited seats and dedicated support.',
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about HomeFolio. Can't find what you're looking for? <a href="mailto:support@homefolio.com" className="text-accent hover:underline">Contact us</a>.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl px-6 border-none card-elevated"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
