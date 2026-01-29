import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Card } from '../components/Card';
import { useSwingTaxonomy } from '../hooks/useTaxonomy';
import '../styles/screens/QuickDrillsScreen.css';

function QuickDrillsScreen() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const { data: taxonomy, loading, error } = useSwingTaxonomy();
  
  const filters = ['All', 'Putting', 'Driving', 'Chipping', 'Irons'];
  
  // Map difficulty number to string
  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return 'Beginner';
    if (difficulty <= 3) return 'Beginner';
    if (difficulty <= 6) return 'Intermediate';
    return 'Advanced';
  };

  // Get drills from taxonomy
  const drills = taxonomy?.drills || [];
  
  // For now, we'll show all drills regardless of filter since we don't have category in the schema
  // In a real implementation, you'd want to add tags or categories to drills
  const filteredDrills = drills;

  const handleStartDrill = (drillId) => {
    navigate(`/drill/${drillId}`);
  };

  return (
    <div className="quick-drills-screen">
      {/* Header */}
      <header className="quick-drills-screen__header">
        <button 
          className="quick-drills-screen__icon-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        <h1 className="quick-drills-screen__header-title">Quick Drills</h1>
        
        <div className="quick-drills-screen__header-actions">
          <button 
            className="quick-drills-screen__icon-btn"
            aria-label="Search"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="quick-drills-screen__content">
        {/* Headline */}
        <div className="quick-drills-screen__headline">
          <h2 className="quick-drills-screen__headline-text">
            Select a focus area for today's session.
          </h2>
        </div>

        {/* Filter Chips */}
        <div className="quick-drills-screen__filters-wrapper">
          <div className="quick-drills-screen__filters">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`quick-drills-screen__filter-chip ${
                  selectedFilter === filter ? 'quick-drills-screen__filter-chip--active' : ''
                }`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          {/* Gradient fade for scroll indication */}
          <div className="quick-drills-screen__filters-fade" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="quick-drills-screen__loading">
            <p>Loading drills...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="quick-drills-screen__error">
            <p>Error loading drills: {error.message}</p>
            <p>Please ensure your Supabase credentials are configured in .env</p>
          </div>
        )}

        {/* Drills List */}
        {!loading && !error && (
          <div className="quick-drills-screen__drills">
            {filteredDrills.length === 0 ? (
              <div className="quick-drills-screen__empty">
                <p>No drills available. Please add drills to your Supabase database.</p>
              </div>
            ) : (
              filteredDrills.map((drill) => (
                <div key={drill.id} className="quick-drills-screen__drill-card">
                  <div className="quick-drills-screen__drill-content">
                    {/* Image Section - Using placeholder since we don't have images in DB yet */}
                    <div className="quick-drills-screen__drill-image-wrapper">
                      <div 
                        className="quick-drills-screen__drill-image"
                        style={{ backgroundColor: '#e5e7eb' }}
                      />
                      <div className="quick-drills-screen__drill-image-overlay" />
                      <div className="quick-drills-screen__drill-badge-mobile">
                        <span className="quick-drills-screen__drill-difficulty">
                          {getDifficultyLabel(drill.difficulty)}
                        </span>
                      </div>
                    </div>

                    {/* Text Section */}
                    <div className="quick-drills-screen__drill-info">
                      <div className="quick-drills-screen__drill-header">
                        <div className="quick-drills-screen__drill-text">
                          <div className="quick-drills-screen__drill-title-row">
                            <h3 className="quick-drills-screen__drill-title">{drill.name}</h3>
                            <span className="quick-drills-screen__drill-badge-desktop">
                              {getDifficultyLabel(drill.difficulty)}
                            </span>
                          </div>
                          <p className="quick-drills-screen__drill-description">
                            {drill.objective || drill.description || 'No description available'}
                          </p>
                        </div>
                      </div>

                      <div className="quick-drills-screen__drill-footer">
                        <div className="quick-drills-screen__drill-meta">
                          <span className="material-symbols-outlined quick-drills-screen__drill-meta-icon">
                            schedule
                          </span>
                          <span className="quick-drills-screen__drill-meta-text">
                            {drill.min_duration_min ? `${drill.min_duration_min} min` : '5 min'}
                          </span>
                        </div>
                        
                        <button 
                          className="quick-drills-screen__drill-start-btn"
                          onClick={() => handleStartDrill(drill.id)}
                        >
                          Start
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* End of List */}
        {!loading && !error && filteredDrills.length > 0 && (
          <div className="quick-drills-screen__end-message">
            <p className="quick-drills-screen__end-text">End of List</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activePage="home" />
    </div>
  );
}

export default QuickDrillsScreen;

