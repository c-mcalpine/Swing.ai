import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDiagnostic } from '../hooks/useDiagnostics';
import { useSwingTaxonomy } from '../hooks/useTaxonomy';
import { getDrillsForError, getDrillsForMechanic, getCuesForError, getCuesForMechanic } from '../api/taxonomy';
import '../styles/screens/SwingDiagnosticViewScreen.css';

/**
 * Screen that displays a swing diagnostic analysis.
 * Shows phase/mechanic/error scores, recommended drills, and coaching cues.
 */
function SwingDiagnosticViewScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const diagnosticId = id ? parseInt(id) : null;
  
  const { data: diagnostic, loading: diagnosticLoading, error: diagnosticError } = useDiagnostic(diagnosticId);
  const { data: taxonomy, loading: taxonomyLoading, error: taxonomyError } = useSwingTaxonomy();

  const loading = diagnosticLoading || taxonomyLoading;
  const error = diagnosticError || taxonomyError;

  // Parse scores from diagnostic
  const phaseScores = useMemo(() => {
    if (!diagnostic?.phase_scores || typeof diagnostic.phase_scores !== 'object') return {};
    return diagnostic.phase_scores;
  }, [diagnostic]);

  const mechanicScores = useMemo(() => {
    if (!diagnostic?.mechanic_scores || typeof diagnostic.mechanic_scores !== 'object') return {};
    return diagnostic.mechanic_scores;
  }, [diagnostic]);

  const errorScores = useMemo(() => {
    if (!diagnostic?.error_scores || typeof diagnostic.error_scores !== 'object') return {};
    return diagnostic.error_scores;
  }, [diagnostic]);

  // Get top errors (highest scores)
  const topErrors = useMemo(() => {
    if (!taxonomy?.errors || !errorScores) return [];
    
    const errorEntries = Object.entries(errorScores)
      .map(([slug, score]) => ({
        error: taxonomy.errors.find(e => e.slug === slug),
        score: Number(score)
      }))
      .filter(e => e.error && e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return errorEntries;
  }, [taxonomy, errorScores]);

  // Get mechanics that need improvement (lowest scores)
  const mechanicsToImprove = useMemo(() => {
    if (!taxonomy?.mechanics || !mechanicScores) return [];
    
    const mechanicEntries = Object.entries(mechanicScores)
      .map(([slug, score]) => ({
        mechanic: taxonomy.mechanics.find(m => m.slug === slug),
        score: Number(score)
      }))
      .filter(m => m.mechanic && m.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return mechanicEntries;
  }, [taxonomy, mechanicScores]);

  // Get recommended drills for top errors
  const recommendedDrills = useMemo(() => {
    if (!taxonomy || topErrors.length === 0) return [];
    
    const drillsSet = new Set();
    topErrors.forEach(({ error }) => {
      if (error) {
        const drills = getDrillsForError(taxonomy, error.id);
        drills.forEach(drill => drillsSet.add(drill));
      }
    });

    return Array.from(drillsSet).slice(0, 5);
  }, [taxonomy, topErrors]);

  // Get coaching cues for top errors
  const coachingCues = useMemo(() => {
    if (!taxonomy || topErrors.length === 0) return [];
    
    const cuesSet = new Set();
    topErrors.forEach(({ error }) => {
      if (error) {
        const cues = getCuesForError(taxonomy, error.id);
        cues.forEach(cue => cuesSet.add(cue));
      }
    });

    return Array.from(cuesSet).slice(0, 5);
  }, [taxonomy, topErrors]);

  if (loading) {
    return (
      <div className="diagnostic-view">
        <div className="diagnostic-view__loading">
          <p>Loading diagnostic...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagnostic-view">
        <div className="diagnostic-view__error">
          <p>Error loading diagnostic: {error.message}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="diagnostic-view">
        <div className="diagnostic-view__not-found">
          <p>Diagnostic not found</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="diagnostic-view">
      {/* Header */}
      <header className="diagnostic-view__header">
        <button onClick={() => navigate(-1)} className="diagnostic-view__back-btn">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="diagnostic-view__title">Swing Analysis</h1>
      </header>

      {/* Video Section */}
      {diagnostic.video_url && (
        <section className="diagnostic-view__video-section">
          <h2 className="diagnostic-view__section-title">Your Swing</h2>
          <div className="diagnostic-view__video-placeholder">
            <p>Video: {diagnostic.video_url}</p>
          </div>
        </section>
      )}

      {/* Phase Scores */}
      <section className="diagnostic-view__section">
        <h2 className="diagnostic-view__section-title">Swing Phase Breakdown</h2>
        <div className="diagnostic-view__scores">
          {Object.entries(phaseScores).map(([slug, score]) => {
            const phase = taxonomy?.phases.find(p => p.slug === slug);
            if (!phase) return null;
            
            return (
              <div key={slug} className="diagnostic-view__score-item">
                <div className="diagnostic-view__score-header">
                  <span className="diagnostic-view__score-name">{phase.name}</span>
                  <span className="diagnostic-view__score-value">{score}/100</span>
                </div>
                <div className="diagnostic-view__score-bar">
                  <div 
                    className="diagnostic-view__score-fill"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Errors */}
      {topErrors.length > 0 && (
        <section className="diagnostic-view__section">
          <h2 className="diagnostic-view__section-title">Areas to Address</h2>
          <div className="diagnostic-view__errors">
            {topErrors.map(({ error, score }) => (
              <div key={error.id} className="diagnostic-view__error-card">
                <div className="diagnostic-view__error-header">
                  <h3 className="diagnostic-view__error-name">{error.name}</h3>
                  <span className="diagnostic-view__error-severity">
                    Severity: {score}%
                  </span>
                </div>
                {error.description && (
                  <p className="diagnostic-view__error-description">{error.description}</p>
                )}
                {error.fix && (
                  <div className="diagnostic-view__error-fix">
                    <strong>Fix:</strong> {error.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mechanics to Improve */}
      {mechanicsToImprove.length > 0 && (
        <section className="diagnostic-view__section">
          <h2 className="diagnostic-view__section-title">Mechanics to Work On</h2>
          <div className="diagnostic-view__mechanics">
            {mechanicsToImprove.map(({ mechanic, score }) => (
              <div key={mechanic.id} className="diagnostic-view__mechanic-card">
                <div className="diagnostic-view__mechanic-header">
                  <h3 className="diagnostic-view__mechanic-name">{mechanic.name}</h3>
                  <span className="diagnostic-view__mechanic-score">{score}%</span>
                </div>
                {mechanic.description_short && (
                  <p className="diagnostic-view__mechanic-description">
                    {mechanic.description_short}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Coaching Cues */}
      {coachingCues.length > 0 && (
        <section className="diagnostic-view__section">
          <h2 className="diagnostic-view__section-title">Coaching Tips</h2>
          <div className="diagnostic-view__cues">
            {coachingCues.map((cue) => (
              <div key={cue.id} className="diagnostic-view__cue-card">
                <p className="diagnostic-view__cue-text">{cue.text}</p>
                {cue.cue_type && (
                  <span className="diagnostic-view__cue-type">{cue.cue_type}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Drills */}
      {recommendedDrills.length > 0 && (
        <section className="diagnostic-view__section">
          <h2 className="diagnostic-view__section-title">Recommended Drills</h2>
          <div className="diagnostic-view__drills">
            {recommendedDrills.map((drill) => (
              <div 
                key={drill.id} 
                className="diagnostic-view__drill-card"
                onClick={() => navigate(`/drill/${drill.id}`)}
              >
                <h3 className="diagnostic-view__drill-name">{drill.name}</h3>
                {drill.objective && (
                  <p className="diagnostic-view__drill-objective">{drill.objective}</p>
                )}
                <div className="diagnostic-view__drill-meta">
                  {drill.difficulty && (
                    <span className="diagnostic-view__drill-difficulty">
                      Level {drill.difficulty}
                    </span>
                  )}
                  {drill.min_duration_min && (
                    <span className="diagnostic-view__drill-duration">
                      {drill.min_duration_min} min
                    </span>
                  )}
                </div>
                <button className="diagnostic-view__drill-start-btn">
                  Start Drill
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Button */}
      <div className="diagnostic-view__actions">
        <button 
          className="diagnostic-view__primary-btn"
          onClick={() => navigate('/plan')}
        >
          View Personalized Plan
        </button>
      </div>
    </div>
  );
}

export default SwingDiagnosticViewScreen;

