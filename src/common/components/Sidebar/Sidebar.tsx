import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaChartArea, FaTasks, // Using FaTasks as a new icon for the habit tracker
  FaLinkedin, FaGithub, FaInstagram, FaStackOverflow 
} from 'react-icons/fa';
import './Sidebar.scss';

interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <aside className="sidebar">
      <header className="sidebar__header logo-header">
        <div className="logo-type">
          <span className="logo-type__name">Kshitij Bhatnagar</span>
        </div>
      </header>

      <nav className="sidebar__nav">
        <ul>
          {/* Updated NavLink */}
          <li onClick={onClose}>
            <NavLink to="/habit-tracker">
              <FaTasks /> <span>Habit Tracker</span>
            </NavLink>
          </li>
          <li onClick={onClose}>
            <NavLink to="/gaussian-visualizer">
              <FaChartArea /> <span>Gaussian Visualizer</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <footer className="sidebar__footer">
        <div className="sidebar__socials">
          <a href="https://www.linkedin.com/in/kshitij-bhatnagar-18046374/" target="_blank" rel="noopener noreferrer" aria-label="My LinkedIn Profile">
            <FaLinkedin />
          </a>
          <a href="https://github.com/kbhatnagar97" target="_blank" rel="noopener noreferrer" aria-label="My GitHub Profile">
            <FaGithub />
          </a>
          <a href="https://stackoverflow.com/users/20596775/kshitij-bhatnagar" target="_blank" rel="noopener noreferrer" aria-label="My Stack Overflow Profile">
            <FaStackOverflow />
          </a>
          <a href="https://www.instagram.com/kbhatnagar97/" target="_blank" rel="noopener noreferrer" aria-label="My Instagram Profile">
            <FaInstagram />
          </a>
        </div>
        <p className="sidebar__footer-text">
          © {new Date().getFullYear()} Kshitij Bhatnagar
        </p>
      </footer>
    </aside>
  );
};

export default Sidebar;