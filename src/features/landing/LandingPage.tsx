import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaGithub,
  FaEnvelope,
  FaArrowRight,
  FaLinkedin,
  FaStackOverflow,
  FaInstagram,
} from 'react-icons/fa';
import AuthButton from '../../common/components/AuthButton';
import AuthModal from '../../common/components/AuthModal';
import './LandingPage.scss';

const LandingPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

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
      <div className='background-animations'>
        <div className='shape shape-1'></div>
        <div className='shape shape-2'></div>
        <div className='shape shape-3'></div>
      </div>

      {/* Header with Auth Button */}
      <header className='landing-header'>
        <div className='landing-header__content'>
          <div className='landing-header__logo'>
            <Link to='/'>Revival</Link>
          </div>
          <div className='landing-header__auth'>
            <AuthButton onClick={() => setIsAuthModalOpen(true)} />
          </div>
        </div>
      </header>

      <section className='hero'>
        <div className='hero__content'>
          <h1 className='hero__title scroll-animate fade-in-up'>
            I build systems that reveal patterns.
          </h1>
          <p className='hero__subtitle scroll-animate fade-in-up'>
            Whether in our daily lives or in complex data, I create tools that
            transform information into insights and habits into sustainable
            growth.
          </p>
          <div className='hero__cta scroll-animate fade-in-up'>
            <a href='#projects' className='hero__button'>
              Explore My Work <FaArrowRight />
            </a>
          </div>
        </div>
        <div className='hero__scroll-indicator scroll-animate fade-in-up'>
          <div className='scroll-arrow'></div>
        </div>
      </section>

      {/* Projects Section with Enhanced Layout */}
      <section id='projects' className='projects-section'>
        <div className='section-header scroll-animate fade-in-up'>
          <h2 className='section-title'>Featured Projects</h2>
          <p className='section-subtitle'>
            Tools that combine technical excellence with real-world impact
          </p>
        </div>

        {/* Project 1: Habit Tracker */}
        <div className='project-showcase project-showcase--habit-tracker'>
          <div className='project-showcase__text scroll-animate slide-in-left'>
            <div className='project-badge'>
              <span className='tech-tag'>React</span>
              <span className='tech-tag'>TypeScript</span>
              <span className='tech-tag'>Chart.js</span>
            </div>
            <h3 className='project-showcase__title'>
              The System for Self-Improvement
            </h3>
            <div className='project-showcase__description'>
              <p>
                Building better habits isn't just about motivation—it's about
                having the right data. This comprehensive habit tracker
                transforms your daily routines into actionable insights through
                advanced analytics, streak tracking, and beautiful
                visualizations.
              </p>
              <p>
                Built with React Context for state management, Chart.js for data
                visualization, and dnd-kit for intuitive drag-and-drop
                interactions. Every chart tells a story of progress, every
                streak represents commitment.
              </p>
            </div>
            <div className='project-showcase__actions'>
              <Link
                to='/habit-tracker'
                className='project-showcase__cta project-showcase__cta--primary'
              >
                Live Demo <FaArrowRight />
              </Link>
              <a
                href='https://github.com/kbhatnagar97/Revival'
                className='project-showcase__cta project-showcase__cta--secondary'
                target='_blank'
                rel='noopener noreferrer'
              >
                <FaGithub /> Source Code
              </a>
            </div>
          </div>
          <div className='project-showcase__visual scroll-animate slide-in-right'>
            <div className='project-showcase__demo'>
              <img
                src='/images/habit-tracker.gif'
                alt='Habit Tracker Demo'
                className='project-showcase__gif'
              />
            </div>
          </div>
        </div>

        {/* Project 2: Gaussian Visualizer */}
        <div className='project-showcase project-showcase--gaussian'>
          <div className='project-showcase__visual scroll-animate slide-in-left'>
            <div className='project-showcase__demo'>
              <img
                src='/images/gaussian-tracker.gif'
                alt='Gaussian Visualizer Demo'
                className='project-showcase__gif'
              />
            </div>
          </div>
          <div className='project-showcase__text scroll-animate slide-in-right'>
            <div className='project-badge'>
              <span className='tech-tag'>React</span>
              <span className='tech-tag'>TypeScript</span>
              <span className='tech-tag'>Chart.js</span>
            </div>
            <h3 className='project-showcase__title'>
              The System for Understanding Data
            </h3>
            <div className='project-showcase__description'>
              <p>
                Statistics come alive when you can see them change in real-time.
                This interactive Gaussian distribution visualizer makes complex
                statistical concepts accessible through intuitive controls and
                instant visual feedback.
              </p>
              <p>
                Built with cutting-edge technology that Chart.js doesn't readily
                provide, using lightweight statistical libraries running
                mathematical computations under the hood to make this level of
                real-time visualization possible. Watch as process capability
                metrics update instantly, revealing the story hidden in your
                data.
              </p>
            </div>
            <div className='project-showcase__actions'>
              <Link
                to='/gaussian-visualizer'
                className='project-showcase__cta project-showcase__cta--primary'
              >
                Interactive Demo <FaArrowRight />
              </Link>
              <a
                href='https://github.com/kbhatnagar97/Revival'
                className='project-showcase__cta project-showcase__cta--secondary'
                target='_blank'
                rel='noopener noreferrer'
              >
                <FaGithub /> Source Code
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- About Section (COMPLETELY REFACTORED) --- */}
      <section className='about'>
        <div className='about__inner scroll-animate fade-in-up'>
          <div className='about__avatar'>
            <img src='/images/Profile.JPG' alt='Kshitij Bhatnagar' />
          </div>
          <h2 className='about__name'>Kshitij Bhatnagar</h2>
          <p className='about__role'>Software Engineer</p>
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
          <div className='about__actions'>
            <a
              href='mailto:kbhatnagar97@gmail.com'
              className='about__link--primary'
            >
              <FaEnvelope /> Get In Touch
            </a>
          </div>
          <div className='about__socials'>
            <a
              href='https://www.linkedin.com/in/kshitij-bhatnagar-18046374/'
              target='_blank'
              rel='noopener noreferrer'
              aria-label="Kshitij Bhatnagar's LinkedIn Profile"
              className='about__social-link'
            >
              <FaLinkedin />
            </a>
            <a
              href='https://github.com/kbhatnagar97'
              target='_blank'
              rel='noopener noreferrer'
              aria-label="Kshitij Bhatnagar's GitHub Profile"
              className='about__social-link'
            >
              <FaGithub />
            </a>
            <a
              href='https://stackoverflow.com/users/20596775/kshitij-bhatnagar'
              target='_blank'
              rel='noopener noreferrer'
              aria-label="Kshitij Bhatnagar's Stack Overflow Profile"
              className='about__social-link'
            >
              <FaStackOverflow />
            </a>
            <a
              href='https://www.instagram.com/kbhatnagar97/'
              target='_blank'
              rel='noopener noreferrer'
              aria-label="Kshitij Bhatnagar's Instagram Profile"
              className='about__social-link'
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
