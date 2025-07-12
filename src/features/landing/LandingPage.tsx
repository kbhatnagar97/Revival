import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaEnvelope, FaArrowRight } from 'react-icons/fa';
import { useDocumentMeta } from '../../common/hooks/useDocumentMeta';
import './LandingPage.scss';

const LandingPage: React.FC = () => {
  useDocumentMeta({ 
    title: 'Revival - Kshitij Bhatnagar Portfolio', 
    favicon: '/bulb-favicon.png' // Keep the existing bulb icon for landing
  });

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create intersection observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Observe all animatable elements
    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className='landing-page'>
      {/* Hero Section */}
      <section className='hero'>
        <div className='hero__content'>
          <h1 className='hero__title'>I build systems that reveal patterns.</h1>
          <p className='hero__subtitle'>
            Whether in our daily lives or in complex data...
          </p>
        </div>
      </section>

      {/* Project 1: Habit Tracker */}
      <section className='project-showcase project-showcase--habit-tracker'>
        <div className='project-showcase__text scroll-animate slide-in-left'>
          <h2 className='project-showcase__title'>
            The System for Self-Improvement
          </h2>
          <div className='project-showcase__description'>
            <p>
              Building better habits isn't just about motivation—it's about
              having the right data. This comprehensive habit tracker transforms
              your daily routines into actionable insights through advanced
              analytics, streak tracking, and beautiful visualizations.
            </p>
            <p>
              Built with React Context for state management, Chart.js for data
              visualization, and dnd-kit for intuitive drag-and-drop
              interactions. Every chart tells a story of progress, every streak
              represents commitment.
            </p>
          </div>
          <Link to='/habit-tracker' className='project-showcase__cta'>
            View Live App <FaArrowRight />
          </Link>
        </div>
        <div className='project-showcase__visual scroll-animate slide-in-right'>
          <div className='project-showcase__demo'>
            <img
              src='/src/common/assets/images/habit-tracker.gif'
              alt='Habit Tracker Demo'
              className='project-showcase__gif'
            />
          </div>
        </div>
      </section>

      {/* Project 2: Gaussian Visualizer */}
      <section className='project-showcase project-showcase--gaussian'>
        <div className='project-showcase__visual scroll-animate slide-in-left'>
          <div className='project-showcase__demo'>
            <img
              src='/src/common/assets/images/gaussian-tracker.gif'
              alt='Gaussian Visualizer Demo'
              className='project-showcase__gif'
            />
          </div>
        </div>
        <div className='project-showcase__text scroll-animate slide-in-right'>
          <h2 className='project-showcase__title'>
            The System for Understanding Data
          </h2>
          <div className='project-showcase__description'>
            <p>
              Statistics come alive when you can see them change in real-time.
              This interactive Gaussian distribution visualizer makes complex
              statistical concepts accessible through intuitive controls and
              instant visual feedback.
            </p>
            <p>
              Powered by Vega-statistics for precise calculations and Chart.js
              with custom annotations for dynamic visualizations. Watch as
              process capability metrics update instantly, revealing the story
              hidden in your data.
            </p>
          </div>
          <Link to='/gaussian-visualizer' className='project-showcase__cta'>
            Interact with Viz <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className='about'>
        <h2 className='about__title scroll-animate fade-in-up'>
          About the Developer
        </h2>
        <div className='about__content scroll-animate fade-in-up'>
          <div className='about__photo'>
            <div className='about__avatar'>
              {/* Placeholder for photo - replace with actual image */}
              <span>KB</span>
            </div>
          </div>
          <div className='about__bio'>
            <p>
              I'm passionate about creating tools that help people understand
              themselves and their data better. These projects represent my
              journey in building meaningful applications that combine technical
              excellence with real-world utility.
            </p>
            <p>
              From habit formation psychology to statistical process control, I
              believe that the right visualization can transform how we perceive
              and interact with information.
            </p>
          </div>
        </div>
        <div className='about__actions scroll-animate fade-in-up'>
          <a
            href='https://github.com/kbhatnagar97'
            target='_blank'
            rel='noopener noreferrer'
            className='about__link'
          >
            <FaGithub /> Get in Touch
          </a>
          <a
            href='mailto:kbhatnagar97@gmail.com'
            className='about__link about__link--secondary'
          >
            <FaEnvelope /> Email Me
          </a>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
