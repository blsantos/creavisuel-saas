import { Quote, Star } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";

const Testimonials = () => {
  const { content } = useContent();
  const { testimonials } = content;

  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary font-medium text-sm mb-4">
            {testimonials.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
            {testimonials.title}{" "}
            <span className="text-primary">{testimonials.titleHighlight}</span>
          </h2>
          <p className="text-lg text-secondary-foreground/70">
            {testimonials.description}
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.items.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative bg-secondary-foreground/5 rounded-2xl p-8 border border-secondary-foreground/10 hover:border-primary/30 transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-8 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Quote className="w-4 h-4 text-primary-foreground" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-secondary-foreground/90 leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {testimonial.author[0]}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-secondary-foreground/60">{testimonial.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
