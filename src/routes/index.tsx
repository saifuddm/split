import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "../components/Button";
import { HistoryIcon, Scale, Spline } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </>
  );
}

function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        className="mx-auto max-w-4xl text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-text mb-6 text-4xl font-bold md:text-6xl"
          variants={itemVariants}
        >
          Simplify Your Shared Expenses.
        </motion.h1>

        <motion.p
          className="text-subtext1 mx-auto mb-8 max-w-3xl text-xl leading-relaxed md:text-2xl"
          variants={itemVariants}
        >
          From group trips to apartment bills, track every dollar without the
          awkward conversations. Split makes it easy.
        </motion.p>

        <motion.div variants={itemVariants}>
          <Link to="/dashboard">
            <Button
              size="lg"
              className="px-8 py-4 text-xl shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Launch App
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      className="bg-mantle border-surface0 rounded-lg border p-6 shadow-sm"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: "easeOut",
      }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="text-blue mb-4 flex justify-center">{icon}</div>
      <h3 className="text-text mb-3 text-xl font-semibold">{title}</h3>
      <p className="text-subtext1 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Spline size={32} />,
      title: "Split Any Way You Want",
      description:
        "Go beyond 50/50. Split by exact amounts, percentages, or select specific people for each transaction.",
    },
    {
      icon: <Scale size={32} />,
      title: "Always Know Who Owes Who",
      description:
        "Get a simplified, real-time view of your balances within groups and with individual friends.",
    },
    {
      icon: <HistoryIcon size={32} />,
      title: "Track Every Change",
      description:
        "Every expense edit and settlement is recorded in a detailed audit trail, so there are no surprises.",
    },
  ];

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="text-text mb-16 text-center text-3xl font-bold md:text-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Everything you need to stay balanced.
        </motion.h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <motion.footer
      className="px-4 py-8 text-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <p className="text-subtext1">
        Made with ❤️ by{" "}
        <a
          href="https://github.com/saifuddm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue hover:text-sapphire underline transition-colors"
        >
          saifuddm
        </a>
      </p>
    </motion.footer>
  );
}
