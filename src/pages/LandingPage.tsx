import { Link } from 'react-router-dom';
import { ArrowRight, Camera, MousePointerClick, Share2, Globe, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/helpers';

export function LandingPage() {
  const features = [
    {
      icon: Camera,
      title: 'Upload 360° Photos',
      description: 'Drag and drop equirectangular panoramas. Automatic validation, thumbnails, and optimized delivery.',
    },
    {
      icon: MousePointerClick,
      title: 'Street View Navigation',
      description: 'Place clickable hotspots on the sphere using real yaw/pitch coordinates. Connect scenes like Google Street View.',
    },
    {
      icon: Share2,
      title: 'Instant Sharing',
      description: 'Publish with one click. Get a permanent URL, QR code, and embed code. No account needed for viewers.',
    },
    {
      icon: Globe,
      title: 'Works Everywhere',
      description: 'Desktop, tablet, mobile - full touch support. No app install required. Pure WebGL rendering.',
    },
  ];

  const benefits = [
    'Free forever - no artificial limits on tours or links',
    'Your data, your control - export anytime',
    'Open source rendering engine (Photo Sphere Viewer)',
    'Firebase free tier - generous limits for personal use',
    'No Google Maps dependency or account required',
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="h-4 w-4" />
            <span>Free • Unlimited • No Google Maps Required</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 animate-slide-up">
            Create Immersive{' '}
            <span className="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">
              360° Virtual Tours
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-dark-300 max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Upload panoramic photos, connect scenes with Street View-style hotspots, and share 
            interactive tours with a single link. Free, unlimited, and runs in any browser.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/auth">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Start Building Free
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              View Demo Tour
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-dark-500 text-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Unlimited tours & scenes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Export your data anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-dark-900/50 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to build professional tours
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Powerful features designed for creators, not developers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-4">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Build a tour in minutes
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Three simple steps from photos to published tour
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Photos', description: 'Drag & drop your 360° panoramas. We validate, optimize, and generate thumbnails automatically.' },
              { step: '02', title: 'Connect Scenes', description: 'Place navigation hotspots on the sphere. Link scenes with Street View-style floor markers.' },
              { step: '03', title: 'Publish & Share', description: 'One click to publish. Get a permanent URL, QR code, and embed code for your website.' },
            ].map((item, index) => (
              <div key={item.step} className="relative glass-card p-8 animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="absolute -top-3 left-8 bg-dark-950 px-3 text-primary-400 font-mono text-sm font-bold">
                  {item.step}
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-dark-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28 bg-dark-900/50 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for creators, not corporations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 glass-card p-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-dark-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-panel p-8 sm:p-16 rounded-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to create your first tour?
            </h2>
            <p className="text-dark-400 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators building immersive experiences. Free to start, no limits.
            </p>
            <Link to="/auth">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Start Free - No Credit Card
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}