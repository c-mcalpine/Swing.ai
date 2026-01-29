import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { useSwingTaxonomy } from '../hooks/useTaxonomy';
import '../styles/screens/DailyLessonScreen.css';

function DailyLessonScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [progress, setProgress] = useState(35);
  const { data: taxonomy, loading, error } = useSwingTaxonomy();

  // Get the lesson from taxonomy (use first lesson if no ID provided)
  const lesson = useMemo(() => {
    if (!taxonomy?.lessons) return null;
    if (id) {
      return taxonomy.lessons.find(l => l.id === parseInt(id)) || taxonomy.lessons[0];
    }
    return taxonomy.lessons[0];
  }, [taxonomy, id]);

  // Get lesson steps for this lesson
  const lessonSteps = useMemo(() => {
    if (!taxonomy?.lessonSteps || !lesson) return [];
    return taxonomy.lessonSteps.filter(step => step.lesson_id === lesson.id);
  }, [taxonomy, lesson]);

  // Get mechanics from lesson steps
  const mechanics = useMemo(() => {
    if (!taxonomy?.mechanics || !lessonSteps) return [];
    const mechanicIds = lessonSteps
      .filter(step => step.mechanic_id)
      .map(step => step.mechanic_id);
    return taxonomy.mechanics.filter(m => mechanicIds.includes(m.id));
  }, [taxonomy, lessonSteps]);

  // Get drills from lesson steps
  const drills = useMemo(() => {
    if (!taxonomy?.drills || !lessonSteps) return [];
    const drillIds = lessonSteps
      .filter(step => step.drill_id)
      .map(step => step.drill_id);
    return taxonomy.drills.filter(d => drillIds.includes(d.id));
  }, [taxonomy, lessonSteps]);

  const lessonData = {
    day: 12, // This would come from user progress in a real app
    title: lesson?.title || 'Loading...',
    videoThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjcqPH9yZ54w0zNRaW1cNXdeWwwSpz_pQWqviqpOyZW7cMNwlHwGfhBv17S7uzSjMFN5jmYe-1V1CXbjofMvhm4XDwwKw7Rumy6BBaslEo4CjJuXYUKo2eBORcJ85SyCAewgYPegfXH5ArPq3TEtVD0ZtUU-QlvYz3x_X1gpmv6pQzGb8wjuXSv0dnboXylVyBT9F1mtesgjtK5nknw_3-36_8iePzLeDH9h1kM8zd0qv0go26JBKABgacpliLhnxT2WeouE72DYs',
    duration: '02:14',
    tags: lesson?.tags?.split(',') || ['Driver', 'Intermediate', '5 min'],
    streak: 12,
    xpReward: 50
  };

  const handleComplete = () => {
    // Mark lesson complete and navigate
    console.log('Lesson completed! +50 XP');
    navigate('/plan');
  };

  return (
    <div className="daily-lesson-screen">
      {/* Sticky Header */}
      <header className="daily-lesson-screen__header">
        <div className="daily-lesson-screen__header-nav">
          <button 
            className="daily-lesson-screen__icon-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          
          <div className="daily-lesson-screen__header-title">
            <p className="daily-lesson-screen__day-label">Day {lessonData.day}</p>
            <h1 className="daily-lesson-screen__title">{lessonData.title}</h1>
          </div>
          
          <button 
            className="daily-lesson-screen__icon-btn"
            onClick={() => setIsBookmarked(!isBookmarked)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <span className="material-symbols-outlined">
              {isBookmarked ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="daily-lesson-screen__progress-container">
          <div className="daily-lesson-screen__progress-header">
            <span className="daily-lesson-screen__progress-label">Lesson Progress</span>
            <span className="daily-lesson-screen__progress-value">{progress}%</span>
          </div>
          <div className="daily-lesson-screen__progress-bar">
            <div 
              className="daily-lesson-screen__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="daily-lesson-screen__content">
        {/* Video Player */}
        <div className="daily-lesson-screen__video-section">
          <div 
            className="daily-lesson-screen__video-player"
            style={{ backgroundImage: `url('${lessonData.videoThumb}')` }}
          >
            <div className="daily-lesson-screen__video-overlay">
              <button className="daily-lesson-screen__play-btn">
                <span className="material-symbols-outlined daily-lesson-screen__play-icon">
                  play_arrow
                </span>
              </button>
            </div>
            
            <div className="daily-lesson-screen__video-controls">
              <span className="daily-lesson-screen__video-time">{lessonData.duration}</span>
              <span className="material-symbols-outlined daily-lesson-screen__fullscreen-btn">
                fullscreen
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="daily-lesson-screen__tags">
            {lessonData.tags.map((tag, index) => (
              <span key={index} className="daily-lesson-screen__tag">
                {tag.includes('min') && (
                  <span className="material-symbols-outlined daily-lesson-screen__tag-icon">
                    timer
                  </span>
                )}
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Key Takeaways Section */}
        <section className="daily-lesson-screen__section">
          <div className="daily-lesson-screen__section-header">
            <h2 className="daily-lesson-screen__section-title">THE MECHANICS</h2>
            <span className="daily-lesson-screen__view-all">View All</span>
          </div>

          {/* Horizontal Scroll Carousel */}
          <div className="daily-lesson-screen__carousel">
            {mechanics.map((mechanic) => (
              <div key={mechanic.id} className="daily-lesson-screen__mechanic-card">
                <div 
                  className="daily-lesson-screen__mechanic-image"
                  style={{ backgroundImage: `url('${mechanic.image}')` }}
                />
                <div className="daily-lesson-screen__mechanic-content">
                  <div className="daily-lesson-screen__mechanic-header">
                    <span className="daily-lesson-screen__mechanic-number">
                      {mechanic.id}
                    </span>
                    <h3 className="daily-lesson-screen__mechanic-title">
                      {mechanic.title}
                    </h3>
                  </div>
                  <p className="daily-lesson-screen__mechanic-description">
                    {mechanic.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Practice Drill Section */}
        <section className="daily-lesson-screen__section daily-lesson-screen__drill-section">
          <h2 className="daily-lesson-screen__section-title">PRACTICE DRILL</h2>
          
          <div className="daily-lesson-screen__drill-card">
            <div 
              className="daily-lesson-screen__drill-image"
              style={{ backgroundImage: `url('${drill.image}')` }}
            />
            <div className="daily-lesson-screen__drill-content">
              <div className="daily-lesson-screen__drill-header">
                <h3 className="daily-lesson-screen__drill-title">{drill.title}</h3>
                {drill.completed && (
                  <span className="material-symbols-outlined daily-lesson-screen__drill-check">
                    check_circle
                  </span>
                )}
              </div>
              <p className="daily-lesson-screen__drill-description">
                {drill.description}
              </p>
              <button className="daily-lesson-screen__drill-cta">
                VIEW STEPS 
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Swing Visualizer Widget */}
        <section className="daily-lesson-screen__section daily-lesson-screen__visualizer-section">
          <div className="daily-lesson-screen__visualizer-card">
            <div className="daily-lesson-screen__visualizer-glow" />
            
            <div className="daily-lesson-screen__visualizer-header">
              <div>
                <h3 className="daily-lesson-screen__visualizer-title">Swing Visualizer</h3>
                <p className="daily-lesson-screen__visualizer-subtitle">
                  See the skeletal breakdown
                </p>
              </div>
              <button className="daily-lesson-screen__visualizer-btn">
                <span className="material-symbols-outlined">3d_rotation</span>
              </button>
            </div>

            <div className="daily-lesson-screen__visualizer-placeholder">
              <div className="daily-lesson-screen__visualizer-content">
                <span className="material-symbols-outlined daily-lesson-screen__visualizer-icon">
                  sports_golf
                </span>
                <div className="daily-lesson-screen__visualizer-divider" />
                <span className="daily-lesson-screen__visualizer-text">LOADING MODEL...</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Footer CTA */}
      <footer className="daily-lesson-screen__footer">
        <div className="daily-lesson-screen__footer-content">
          <div className="daily-lesson-screen__streak-info">
            <span className="material-symbols-outlined daily-lesson-screen__fire-icon">
              local_fire_department
            </span>
            <p className="daily-lesson-screen__streak-text">
              Finish to keep your <span className="daily-lesson-screen__streak-highlight">
                {lessonData.streak}-day streak!
              </span>
            </p>
          </div>

          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={handleComplete}
            className="daily-lesson-screen__complete-btn"
          >
            <span className="material-symbols-outlined">check</span>
            <span>MARK COMPLETE</span>
            <span className="daily-lesson-screen__xp-badge">+{lessonData.xpReward} XP</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default DailyLessonScreen;

