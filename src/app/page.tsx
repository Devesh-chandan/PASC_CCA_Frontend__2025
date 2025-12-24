"use client";

import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Trophy, 
  Users, 
  TrendingUp, 
  Award,
  Clock,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Event Management",
      description: "Browse and register for exciting co-curricular activities",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Leaderboard",
      description: "Compete with peers and track your progress",
      color: "from-yellow-500 to-orange-600"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Credit Tracking",
      description: "Earn and monitor your CCA credit hours",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community",
      description: "Connect with students across departments",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const benefits = [
    "Real-time attendance tracking with QR codes",
    "Automated credit calculation and reporting",
    "Event reviews and ratings system",
    "Resource sharing and gallery",
    "Push notifications for updates",
    "Comprehensive analytics dashboard"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                PASC CCA Platform 2025
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Your Journey to
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Excellence Starts Here
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Discover, participate, and excel in co-curricular activities. 
              Track your progress, earn credits, and compete with peers in a 
              seamless digital experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-4 bg-card border-2 border-border text-foreground rounded-xl font-semibold text-lg hover:bg-accent transition-all"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {[
              { label: "Active Events", value: "50+", icon: <Calendar className="w-6 h-6" /> },
              { label: "Students", value: "1000+", icon: <Users className="w-6 h-6" /> },
              { label: "Credits Earned", value: "5000+", icon: <Award className="w-6 h-6" /> },
              { label: "Departments", value: "5", icon: <TrendingUp className="w-6 h-6" /> }
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="flex justify-center mb-3 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to enhance your co-curricular experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why Choose PASC CCA?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform is built with students in mind, offering powerful features 
                that make managing your co-curricular activities effortless and engaging.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6" />
                      <span className="font-semibold">Real-time Updates</span>
                    </div>
                    <p className="text-white/80 text-sm">
                      Get instant notifications about new events, attendance confirmations, 
                      and credit updates.
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-6 h-6" />
                      <span className="font-semibold">Progress Tracking</span>
                    </div>
                    <p className="text-white/80 text-sm">
                      Monitor your CCA journey with detailed analytics and insights 
                      into your performance.
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6" />
                      <span className="font-semibold">Gamification</span>
                    </div>
                    <p className="text-white/80 text-sm">
                      Compete on leaderboards, earn achievements, and celebrate 
                      your milestones.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of students already using PASC CCA Platform
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Create Account
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PASC CCA Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
