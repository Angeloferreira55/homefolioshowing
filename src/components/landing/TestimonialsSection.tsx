import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Luxury Real Estate Agent',
    location: 'Beverly Hills, CA',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    quote: 'HomeFolio has completely transformed how I work with my clients. No more endless email chains with property links. One link, always updated. My clients love it!',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Broker & Team Lead',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    quote: 'The route optimization feature alone saves me 2+ hours per week on showing days. My whole team uses HomeFolio now and our clients consistently comment on how organized we are.',
    rating: 5,
  },
  {
    name: 'Jennifer Rodriguez',
    role: 'Residential Specialist',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    quote: 'I used to print 20+ pages of MLS sheets for every showing. Now everything is digital, eco-friendly, and my clients can access their property list anytime. Game changer!',
    rating: 5,
  },
  {
    name: 'David Thompson',
    role: 'First-Time Buyer Specialist',
    location: 'Denver, CO',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    quote: 'My first-time buyers often look at 15-20 homes. HomeFolio keeps everything organized and the feedback feature helps us narrow down their favorites quickly.',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
            Loved by agents nationwide
          </h2>
          <p className="text-muted-foreground text-lg">
            See why thousands of real estate professionals trust HomeFolio to streamline their showing process.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative p-8 rounded-2xl bg-card card-elevated"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="w-12 h-12 text-accent" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} · {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
