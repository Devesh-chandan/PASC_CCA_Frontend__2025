"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { 
  Calendar, 
  Trophy, 
  Users, 
  TrendingUp, 
  Award, 
  Clock, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Target, 
  Shield, 
  QrCode, 
  BarChart3, 
  MessageSquare, 
  Bell, 
  Github, 
  Twitter, 
  Instagram, 
  Mail, 
  ChevronRight, 
  GraduationCap 
} from 'lucide-react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import Link from 'next/link';

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }
  }, [isInView, target, duration]);

  return { count, ref };
}

// Floating shapes component for background decoration
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-[10%] w-72 h-72 bg-[#2BA6DF]/10 dark:bg-[#55B8E5]/5 rounded-full blur-3xl"
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 right-[15%] w-96 h-96 bg-[#134467]/10 dark:bg-[#2BA6DF]/5 rounded-full blur-3xl"
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-40 left-[20%] w-64 h-64 bg-[#FDB811]/10 dark:bg-[#FDB811]/5 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Grid pattern background
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-20">
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(43, 166, 223, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(43, 166, 223, 0.08) 1px, transparent 1px)`,
          backgroundSize: '60px 60px' 
        }} 
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  // If already logged in, redirect to the appropriate dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'admin') {
      router.replace('/admin/dashboard');
    } else if (token && role === 'student') {
      router.replace('/student/dashboard');
    }
  }, [router]);

  const features = [
    { 
      icon: <Calendar className="w-7 h-7" />, 
      title: "Event Discovery", 
      description: "Browse curated co-curricular activities and never miss an opportunity to grow", 
      color: "from-[#2BA6DF] to-[#6BC1E9]", 
      bgColor: "bg-[#2BA6DF]/10 dark:bg-[#2BA6DF]/20" 
    },
    { 
      icon: <Trophy className="w-7 h-7" />, 
      title: "Compete & Excel", 
      description: "Rise through the ranks on dynamic leaderboards and earn recognition", 
      color: "from-[#FDB811] to-[#E5A50F]", 
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20" 
    },
    { 
      icon: <Award className="w-7 h-7" />, 
      title: "Credit Tracking", 
      description: "Automatic credit calculation with real-time progress monitoring", 
      color: "from-[#10B981] to-[#059669]", 
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20" 
    },
    { 
      icon: <Users className="w-7 h-7" />, 
      title: "Community Hub", 
      description: "Connect with peers across departments and build lasting networks", 
      color: "from-[#134467] to-[#55B8E5]", 
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20" 
    }
  ];

  const benefits = [
    { icon: <QrCode className="w-5 h-5" />, text: "QR-based attendance tracking" },
    { icon: <BarChart3 className="w-5 h-5" />, text: "Comprehensive analytics dashboard" },
    { icon: <MessageSquare className="w-5 h-5" />, text: "Event reviews and ratings" },
    { icon: <Shield className="w-5 h-5" />, text: "Secure and reliable platform" },
    { icon: <Bell className="w-5 h-5" />, text: "Real-time push notifications" },
    { icon: <Target className="w-5 h-5" />, text: "Goal setting and milestones" }
  ];

  const stats = [
    { label: "Active Events", value: 50, suffix: "+", icon: <Calendar className="w-6 h-6" /> },
    { label: "Students", value: 1000, suffix: "+", icon: <Users className="w-6 h-6" /> },
    { label: "Credits Earned", value: 5000, suffix: "+", icon: <Award className="w-6 h-6" /> },
    { label: "Departments", value: 5, suffix: "", icon: <TrendingUp className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <FloatingShapes />
        <GridPattern />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2BA6DF]/10 to-[#134467]/10 dark:from-[#2BA6DF]/20 dark:to-[#55B8E5]/20 border border-[#2BA6DF]/30 dark:border-[#55B8E5]/30 rounded-full mb-8"
              >
                <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-sm font-semibold bg-gradient-to-r from-[#134467] to-[#2BA6DF] dark:from-[#55B8E5] dark:to-[#6BC1E9] bg-clip-text text-transparent">
                  PASC CCA Platform 2025
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.0, duration: 0.0 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight"
              >
                Where Students{" "}
                <span className="block mt-2">
                  <span className="bg-gradient-to-r from-[#134467] via-[#2BA6DF] to-[#134467] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                    Become Achievers
                  </span>
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg sm:text-xl text-[var(--color-text-muted)] mb-8 max-w-xl leading-relaxed"
              >
                Your one-stop platform for discovering events, tracking credits, and competing with peers. Transform your college journey into an adventure of growth and achievement.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="group relative px-8 py-4 bg-[#2BA6DF] hover:bg-[#2190C6] text-white rounded-xl font-semibold text-lg overflow-hidden shadow-lg shadow-[#2BA6DF]/25 hover:shadow-xl hover:shadow-[#2BA6DF]/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                <button
                  onClick={() => router.push('/auth/login')}
                  className="group px-8 py-4 bg-[var(--color-card)] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-semibold text-lg hover:border-[#2BA6DF] dark:hover:border-[#2BA6DF] hover:bg-[var(--color-surface-hover)] dark:hover:bg-[#263238] transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                  </span>
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex items-center gap-4 mt-10"
              >
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[var(--color-card)] bg-gradient-to-br from-[#2BA6DF] to-[#134467] flex items-center justify-center text-white text-xs font-bold"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  <span className="font-semibold text-[hsl(var(--mini-text))]">1000+</span> students already registered
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Main Card Stack */}
              <div className="relative">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#2BA6DF]/20 to-[#134467]/20 blur-3xl" />

                {/* Stats Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="relative bg-[var(--color-card)] rounded-2xl shadow-2xl p-6 mb-6 border border-[var(--color-border-light)]"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-[var(--color-surface-hover)] rounded-xl">
                      <GraduationCap className="w-8 h-8 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-text-primary)] text-lg">Your Progress</h3>
                      <p className="text-[var(--color-text-muted)] text-sm">Spring Semester 2025</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-muted)]">Credits Earned</span>
                        <span className="font-semibold text-[var(--color-text-primary)]">24/30</span>
                      </div>
                      <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "80%" }}
                          transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[#2BA6DF] to-[#134467] rounded-full"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 pt-2">
                      <div className="flex-1 text-center p-3 bg-[var(--color-surface)] rounded-xl">
                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">12</div>
                        <div className="text-xs text-[var(--color-text-muted)]">Events</div>
                      </div>
                      <div className="flex-1 text-center p-3 bg-[var(--color-surface)] rounded-xl">
                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">#5</div>
                        <div className="text-xs text-[var(--color-text-muted)]">Rank</div>
                      </div>
                      <div className="flex-1 text-center p-3 bg-[var(--color-surface)] rounded-xl">
                        <div className="text-2xl font-bold text-[#10B981] dark:text-[#34D399]">+8</div>
                        <div className="text-xs text-[var(--color-text-muted)]">This Week</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Event Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="relative bg-gradient-to-br from-[#134467] to-[#2BA6DF] rounded-2xl shadow-2xl p-6 text-white ml-8"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-[var(--color-card)]/20 rounded-full text-xs font-medium mb-2">
                        Upcoming Event
                      </span>
                      <h3 className="font-bold text-xl">Tech Hackathon 2025</h3>
                      <p className="text-white/70 text-sm">Build the future in 48 hours</p>
                    </div>
                    <div className="p-2 bg-[var(--color-card)]/10 rounded-lg">
                      <Zap className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/70" />
                      <span>Jan 15, 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-white/70" />
                      <span>120 registered</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-[var(--color-card)]/20 border-2 border-white/20" />
                      ))}
                    </div>
                    <span className="text-sm text-white/70">+117 more</span>
                  </div>
                </motion.div>

                {/* Floating Achievement Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                  className="absolute -top-4 -right-4 bg-[#FDB811] text-[#263238] p-3 rounded-xl shadow-lg"
                >
                  <Trophy className="w-6 h-6" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[var(--color-card)]/60 backdrop-blur-sm border-y border-[var(--color-border-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const { count, ref } = useAnimatedCounter(stat.value);
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-[#ECEFF1] to-[#F5F5F5] dark:from-[#263238] dark:to-[#37474F] rounded-xl text-[var(--color-primary)] group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-[var(--color-text-primary)] mb-1">
                    {count}{stat.suffix}
                  </div>
                  <div className="text-[hsl(var(--mini-text))] font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-[var(--color-surface-hover)]/30 text-[var(--color-primary)] rounded-full text-sm font-semibold mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
              Everything You Need to{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#134467] to-[#2BA6DF]">
                Excel in Activities
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed with students in mind
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-[var(--color-card)] rounded-2xl p-6 shadow-lg shadow-[var(--color-border)]/30 dark:shadow-none border border-[var(--color-border-light)] hover:shadow-xl hover:shadow-[#2BA6DF]/10 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`bg-gradient-to-r ${feature.color} bg-clip-text`}>
                    <div className="text-transparent">
                      {feature.icon}
                    </div>
                  </div>
                  <div className={`absolute bg-gradient-to-r ${feature.color} text-white rounded-xl w-14 h-14 flex items-center justify-center`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-[#F5F5F5] to-[#ECEFF1]/30 dark:from-[#212121] dark:to-[#263238]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-2 bg-[var(--color-benefit-bg)] text-[var(--color-benefit-text)] rounded-full text-sm font-semibold mb-4">
                Why PASC CCA?
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
                Built for Students,{" "}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FDB811] to-[#2BA6DF]">
                  By Students
                </span>
              </h2>
              <p className="text-lg text-[var(--color-text-muted)] mb-8 leading-relaxed">
                We understand the challenges of managing co-curricular activities. That's why we've built a platform that makes tracking and participating in events effortless and engaging.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center gap-3 p-3 bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-border-light)]"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-benefit-bg)] rounded-lg flex items-center justify-center text-[var(--color-benefit-text)]">
                      {benefit.icon}
                    </div>
                    <span className="text-[var(--color-text-secondary)] font-medium text-sm">
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#2BA6DF]/20 to-[#134467]/20 rounded-3xl blur-2xl" />
                
                {/* Main feature cards */}
                <div className="relative space-y-4">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="bg-[var(--color-card)] rounded-2xl p-6 shadow-xl border border-[var(--color-border-light)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[var(--color-surface-hover)] rounded-xl">
                        <Clock className="w-6 h-6 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">Real-time Updates</h4>
                        <p className="text-[var(--color-text-muted)] text-sm">Instant notifications for events and credits</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="bg-[var(--color-card)] rounded-2xl p-6 shadow-xl border border-[var(--color-border-light)] ml-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#134467]/10 dark:bg-[#134467]/20 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">Progress Analytics</h4>
                        <p className="text-[var(--color-text-muted)] text-sm">Track your journey with detailed insights</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="bg-[var(--color-card)] rounded-2xl p-6 shadow-xl border border-[var(--color-border-light)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#FDB811]/15 dark:bg-[#FDB811]/20 rounded-xl">
                        <Trophy className="w-6 h-6 text-[#FDB811]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">Gamified Experience</h4>
                        <p className="text-[var(--color-text-muted)] text-sm">Compete, earn badges, and level up</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#134467] to-[#2BA6DF]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-card)]/10 rounded-2xl mb-8"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your{" "}
              <span className="block">College Experience?</span>
            </h2>
            
            <p className="text-xl text-[#ECEFF1] mb-10 max-w-2xl mx-auto">
              Join hundreds of students already using PASC CCA Platform to track their achievements and unlock new opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="group px-8 py-4 bg-[var(--color-card)] text-[#134467] rounded-xl font-bold text-lg hover:bg-[#ECEFF1] hover:scale-105 transition-all duration-300 shadow-xl shadow-[#134467]/30 flex items-center gap-2"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-4 bg-[var(--color-card)]/10 backdrop-blur-sm border-2 border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-[var(--color-card)]/20 transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#212121] dark:bg-[#000000] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#134467] to-[#2BA6DF] rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">PASC CCA</span>
              </div>
              <p className="text-[#CCCCCC] text-sm leading-relaxed">
                Empowering students to excel in co-curricular activities through technology.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-[#ECEFF1]">Platform</h4>
              <ul className="space-y-2 text-[#CCCCCC] text-sm">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Leaderboard</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-[#ECEFF1]">Resources</h4>
              <ul className="space-y-2 text-[#CCCCCC] text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Guidelines</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="font-semibold mb-4 text-[#ECEFF1]">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-[#37474F] hover:bg-[#1DA1F2] rounded-lg flex items-center justify-center transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-[#37474F] hover:bg-[#E1306C] rounded-lg flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-[#37474F] hover:bg-[#24292e] rounded-lg flex items-center justify-center transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-[#37474F] hover:bg-[#2BA6DF] rounded-lg flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#37474F] flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[#CCCCCC] text-sm">
              © 2025 PASC CCA Platform. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-[var(--color-text-muted)]">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
