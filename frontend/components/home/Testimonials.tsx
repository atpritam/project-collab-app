import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestimonialsProps {
  testimonialsInView: boolean;
}

interface TestimonialData {
  name: string;
  position: string;
  rating: number;
  image: string;
  comment: string;
}

const Testimonials = React.forwardRef<HTMLDivElement, TestimonialsProps>(
  ({ testimonialsInView }, ref) => {
    const testimonials: TestimonialData[] = [
      {
        name: "Sarah Johnson",
        position: "Project Manager, TechCorp",
        rating: 5,
        image: "/placeholder.jpg",
        comment:
          "This platform has completely transformed how our team collaborates. The intuitive interface and powerful features have made project management a breeze.",
      },
      {
        name: "Michael Chen",
        position: "Team Lead, InnovateCo",
        rating: 5,
        image: "/placeholder.jpg",
        comment:
          "The role-based permissions and task tracking features have been game-changers for our team. We've seen a 40% increase in productivity since implementing this solution.",
      },
    ];

    return (
      <div className="py-20 bg-muted dark:bg-background" ref={ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={
              testimonialsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-1.5 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={
                testimonialsInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 10 }
              }
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-violet-900 dark:text-violet-300 text-sm font-medium flex items-center">
                <Star className="h-4 w-4 mr-1.5" /> Testimonials
              </span>
            </motion.div>
            <motion.h2
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={
                testimonialsInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Trusted by Teams Worldwide
            </motion.h2>
            <motion.p
              className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={
                testimonialsInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              See what our users have to say about how our platform has
              transformed their workflow.
            </motion.p>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card p-8 rounded-xl shadow-md dark:shadow-none border border-border hover:shadow-lg transition-all"
              >
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 rounded-full overflow-hidden mr-4 border border-border">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={70}
                      height={70}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="text-muted-foreground">
                      {testimonial.position}
                    </p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-foreground/80 italic">
                  "{testimonial.comment}"
                </p>
              </div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={
              testimonialsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              asChild
              variant="outline"
              className="text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
            >
              <Link href="/" className="inline-flex items-center">
                <span>View all testimonials</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }
);

export default Testimonials;
