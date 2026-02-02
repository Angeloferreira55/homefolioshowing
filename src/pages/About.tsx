import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';
import { Home, Heart, Target, Users, Leaf, Zap } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Agent-First Design',
    description:
      'Every feature is built with real estate agents in mind. We understand the hustle and design tools that actually save time.',
  },
  {
    icon: Target,
    title: 'Simplicity',
    description:
      'No complicated setups or training required. If you can send a text, you can use HomeFolio.',
  },
  {
    icon: Users,
    title: 'Client Experience',
    description:
      'Your clients deserve a professional, easy-to-use experience. We make you look good.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description:
      "Save a tree, save money. Going digital isn't just convenient - it's better for the planet.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Us"
        description="HomeFolio was built by agents, for agents. Learn about our mission to simplify real estate showings."
        url="https://homefolio-central-link.lovable.app/about"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
              <Home className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Our Story
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Built by Agents,{' '}
              <span className="text-accent">for Agents</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              HomeFolio was born from a simple frustration: why is it so hard
              to share property information with clients in an organized,
              professional way?
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                The Problem We Solved
              </h2>
              <p className="text-muted-foreground mb-6">
                Picture this: You're a real estate agent showing 5 homes to a
                buyer. You've got printed packets for each property, a stack of
                disclosures, your phone with the route pulled up, and a client
                who's already overwhelmed before you even start driving.
              </p>
              <p className="text-muted-foreground mb-6">
                By the third house, papers are mixed up. By the fifth, your
                client can't remember which property had the updated kitchen.
                And when they get home to discuss with their spouse? Good luck
                keeping the details straight.
              </p>
              <p className="text-muted-foreground mb-6">
                We built HomeFolio to solve exactly this problem.{' '}
                <strong className="text-foreground">
                  One link. Every property. All the information your client
                  needs, organized and accessible from their phone.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              What We Believe
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our values guide every feature we build and every decision we
              make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 card-elevated"
              >
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              To empower real estate agents with simple, beautiful tools that
              save time, impress clients, and help close more deals.
            </p>
            <Link to="/auth">
              <Button size="lg">Join HomeFolio Today</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
