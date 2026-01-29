import PropTypes from 'prop-types'
import '../styles/components/Button.css'

function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  onClick, 
  disabled = false,
  type = 'button',
  ...props 
}) {
  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    disabled && 'button--disabled'
  ].filter(Boolean).join(' ')

  return (
    <button 
      type={type}
      className={classNames} 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="button__icon button__icon--left">
          {icon}
        </span>
      )}
      <span className="button__content">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="button__icon button__icon--right">
          {icon}
        </span>
      )}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string
}

export default Button

