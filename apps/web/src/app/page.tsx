'use client';

import Link from 'next/link';
import {
  Sparkles, MousePointerClick, Layers, BarChart3,
  Shield, Zap, ArrowRight
} from 'lucide-react';

// ============================================
// Landing Page
// ============================================
export default function LandingPage() {
  return (
    <div className="landing-hero">
      {/* Hero Section */}
      <div className="hero-badge">
        <span className="dot" />
        AI-Powered Form Building
      </div>

      <h1 className="hero-title">Build Beautiful Forms in Seconds</h1>
      <p className="hero-subtitle">
        Blazion Forms lets you create stunning forms, surveys, and lead pages with
        a drag-and-drop builder and AI assistance. No coding required.
      </p>

      <div className="hero-actions">
        <Link href="/dashboard" className="btn-primary">
          Start Building Free
          <ArrowRight size={18} />
        </Link>
        <a href="#features" className="btn-secondary">
          See Features
        </a>
      </div>

      {/* Features Grid */}
      <div className="features-grid" id="features">
        <div className="feature-card">
          <div className="feature-icon">
            <MousePointerClick size={22} />
          </div>
          <h3>Drag & Drop Builder</h3>
          <p>
            Intuitively build forms by dragging field blocks onto a live canvas.
            Reorder, duplicate, and customize every element.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Sparkles size={22} />
          </div>
          <h3>AI Form Generator</h3>
          <p>
            Describe your form in plain English and our AI builds it for you
            instantly — fields, logic, and pages included.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Layers size={22} />
          </div>
          <h3>Multi-Page Forms</h3>
          <p>
            Break complex forms into multiple pages with conditional logic to
            show or hide sections based on user answers.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <BarChart3 size={22} />
          </div>
          <h3>Real-Time Analytics</h3>
          <p>
            Track submissions, completion rates, and drop-offs with a beautiful
            analytics dashboard and export to CSV or JSON.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Shield size={22} />
          </div>
          <h3>Spam Protection</h3>
          <p>
            Built-in invisible CAPTCHA and rate limiting keeps bots out while
            your real users submit without friction.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Zap size={22} />
          </div>
          <h3>Blazing Fast</h3>
          <p>
            Forms load in under 50ms worldwide. Edge-cached and optimized to
            ensure maximum completion rates for your audience.
          </p>
        </div>
      </div>
    </div>
  );
}
