import PropTypes from 'prop-types'
import '../styles/components/ProgressIndicator.css'

function ProgressIndicator({ 
  steps = 4, 
  currentStep = 0,
  variant = 'dots' // 'dots' or 'bars'
}) {
  return (
    <div className="progress-indicator">
      {Array.from({ length: steps }).map((_, index) => {
        const isActive = index === currentStep
        const isPast = index < currentStep
        
        return (
          <div
            key={index}
            className={`progress-indicator__item progress-indicator__item--${variant} ${
              isActive ? 'progress-indicator__item--active' : ''
            } ${isPast ? 'progress-indicator__item--past' : ''}`}
            aria-label={`Step ${index + 1} of ${steps}`}
            aria-current={isActive ? 'step' : undefined}
          />
        )
      })}
    </div>
  )
}

ProgressIndicator.propTypes = {
  steps: PropTypes.number,
  currentStep: PropTypes.number,
  variant: PropTypes.oneOf(['dots', 'bars'])
}

export default ProgressIndicator

