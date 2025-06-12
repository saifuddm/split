import React from 'react';
import { motion } from 'framer-motion';
import { Spline, Scale, History } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { Button } from '../components/Button';

const HeroSection: React.FC = () => {
  const { actions } = useAppStore();

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
    <section className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-6 text-text"
          variants={itemVariants}
        >
          Simplify Your Shared Expenses.
        </motion.h1>
        
        <motion.p
          className="text-xl md:text-2xl text-subtext1 mb-8 leading-relaxed max-w-3xl mx-auto"
          variants={itemVariants}
        >
          From group trips to apartment bills, track every dollar without the awkward conversations. Split makes it easy.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <Button
            onClick={actions.enterApp}
            size="lg"
            className="text-xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Launch App
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}> = ({ icon, title, description, index }) => {
  return (
    <motion.div
      className="bg-mantle rounded-lg p-6 shadow-sm border border-surface0"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: "easeOut",
      }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="text-blue mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-text">{title}</h3>
      <p className="text-subtext1 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Spline size={32} />,
      title: "Split Any Way You Want",
      description: "Go beyond 50/50. Split by exact amounts, percentages, or select specific people for each transaction.",
    },
    {
      icon: <Scale size={32} />,
      title: "Always Know Who Owes Who",
      description: "Get a simplified, real-time view of your balances within groups and with individual friends.",
    },
    {
      icon: <History size={32} />,
      title: "Track Every Change",
      description: "Every expense edit and settlement is recorded in a detailed audit trail, so there are no surprises.",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-16 text-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Everything you need to stay balanced.
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
};

const Footer: React.FC = () => {
  return (
    <motion.footer
      className="py-8 px-4 text-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <p className="text-subtext1">
        Made with ❤️ by{' '}
        <a
          href="https://github.com/saifuddm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue hover:text-sapphire transition-colors underline"
        >
          saifuddm
        </a>
      </p>
    </motion.footer>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-base text-text">
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};