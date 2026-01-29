import PropTypes from 'prop-types';
import '../styles/components/Card.css';

// Base Card Component
export function Card({ children, className = '', onClick }) {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func
};

// Hero Card with Image
export function HeroCard({ image, title, description, badge, children, onClick }) {
  return (
    <Card className="hero-card" onClick={onClick}>
      <div className="hero-card__image-wrapper">
        <div 
          className="hero-card__image"
          style={{ backgroundImage: `url('${image}')` }}
        />
        <div className="hero-card__image-overlay" />
        {badge && (
          <div className="hero-card__badge">
            {badge}
          </div>
        )}
      </div>
      <div className="hero-card__content">
        {title && <h2 className="hero-card__title">{title}</h2>}
        {description && <p className="hero-card__description">{description}</p>}
        {children}
      </div>
    </Card>
  );
}

HeroCard.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  badge: PropTypes.node,
  children: PropTypes.node,
  onClick: PropTypes.func
};

// Horizontal Card with Image
export function HorizontalCard({ image, title, subtitle, children, onClick, className = '' }) {
  return (
    <Card className={`horizontal-card ${className}`} onClick={onClick}>
      <div 
        className="horizontal-card__image"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="horizontal-card__content">
        <h3 className="horizontal-card__title">{title}</h3>
        {subtitle && <p className="horizontal-card__subtitle">{subtitle}</p>}
        {children}
      </div>
    </Card>
  );
}

HorizontalCard.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string
};

