import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { HeroCard, HorizontalCard } from '../components/Card';
import { useSmartReviewPlan, useSubmitReviewResult } from '../hooks/useSmartReview';
import { useSwingTaxonomy } from '../hooks/useTaxonomy';
import '../styles/screens/SmartReviewScreen.css';

function SmartReviewScreen() {
  const navigate = useNavigate();
  const { plan, loading: planLoading, error: planError, refetch: refetchPlan } = useSmartReviewPlan(10, null);
  const { submit: submitReview, loading: submitLoading } = useSubmitReviewResult();
  const { data: taxonomy } = useSwingTaxonomy();

  // Fetch plan on mount
  useEffect(() => {
    refetchPlan(10, null);
  }, [refetchPlan]);

  // Transform plan data to match existing UI structure
  const upNextLesson = useMemo(() => {
    if (!plan?.items || plan.items.length === 0) {
      return {
        title: 'No Review Items',
        description: 'Complete some drills or lessons to build your review schedule.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9FXOKAEpmAu12CM8oS0U9vFKhZGhyprWjrODS_3PTaY-DeKt3AEQW5S0CHZoQruOV8KkAVuzpGSYPUvvPzR4SRiawOiV56YXbZ0OWL7r47dOGnoOUmjrtAaheXKDVMcD5HU9qQMDV_69bzU0CcsM8xBNaKt4P17mcuOY0H6UBUaaEalJS4LbxAcEzEUg0yYOV9gKfAveKCUYNWJz3e7tgs7ipeuAdWx06gAUwKrSS149gCrYl18_QB7y8JxoRDflxvsefDtIJ8_Y',
        progress: { current: 0, total: 1 },
        duration: '0 min',
        coaches: [],
        moreCoaches: 0,
        item: null,
      };
    }

    const firstItem = plan.items[0];
    const isLesson = firstItem.item_type === 'lesson';
    const itemData = isLesson
      ? taxonomy?.lessons?.find((l) => l.id === firstItem.item_id)
      : taxonomy?.drills?.find((d) => d.id === firstItem.item_id);

    return {
      title: isLesson ? (itemData?.title || 'Review Lesson') : (itemData?.name || 'Review Drill'),
      description: firstItem.why || itemData?.description || itemData?.objective || itemData?.summary || 'Time to review this item.',
      image: itemData?.thumbnail_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9FXOKAEpmAu12CM8oS0U9vFKhZGhyprWjrODS_3PTaY-DeKt3AEQW5S0CHZoQruOV8KkAVuzpGSYPUvvPzR4SRiawOiV56YXbZ0OWL7r47dOGnoOUmjrtAaheXKDVMcD5HU9qQMDV_69bzU0CcsM8xBNaKt4P17mcuOY0H6UBUaaEalJS4LbxAcEzEUg0yYOV9gKfAveKCUYNWJz3e7tgs7ipeuAdWx06gAUwKrSS149gCrYl18_QB7y8JxoRDflxvsefDtIJ8_Y',
      progress: { current: 1, total: 1 },
      duration: `${firstItem.minutes} min`,
      coaches: [],
      moreCoaches: 0,
      item: firstItem,
    };
  }, [plan, taxonomy]);

  // Transform plan items to timeline format
  const timeline = useMemo(() => {
    if (!plan?.items || plan.items.length === 0) return [];

    return plan.items.slice(0, 3).map((item, index) => {
      const itemData = item.item_type === 'lesson'
        ? taxonomy?.lessons?.find((l) => l.id === item.item_id)
        : taxonomy?.drills?.find((d) => d.id === item.item_id);

      const isDue = item.due_at && new Date(item.due_at) <= new Date();
      const dueDate = item.due_at ? new Date(item.due_at) : null;
      const timeAgo = dueDate
        ? isDue
          ? 'Due Today'
          : `Due ${Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))} days`
        : 'Scheduled';

      const isLesson = item.item_type === 'lesson';
      return {
        id: item.item_id,
        title: isLesson ? (itemData?.title || 'Review Lesson') : (itemData?.name || 'Review Drill'),
        description: item.why || itemData?.description || itemData?.objective || itemData?.summary || '',
        timeAgo,
        icon: item.item_type === 'lesson' ? 'school' : 'sports_golf',
        color: index === 0 ? 'primary' : index === 1 ? 'orange' : 'blue',
        active: index === 0 && isDue,
      };
    });
  }, [plan, taxonomy]);

  // Transform plan items to quick drills format
  const quickDrills = useMemo(() => {
    if (!plan?.items || plan.items.length < 2) return [];

    return plan.items.slice(1, 3).map((item) => {
      const itemData = item.item_type === 'lesson'
        ? taxonomy?.lessons?.find((l) => l.id === item.item_id)
        : taxonomy?.drills?.find((d) => d.id === item.item_id);

      const isDue = item.due_at && new Date(item.due_at) <= new Date();
      const dueDate = item.due_at ? new Date(item.due_at) : null;
      const subtitle = dueDate
        ? isDue
          ? 'Due Today'
          : `Due ${Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))} days`
        : 'Scheduled';

      const isLesson = item.item_type === 'lesson';
      return {
        id: item.item_id,
        title: isLesson ? (itemData?.title || 'Review Lesson') : (itemData?.name || 'Review Drill'),
        subtitle,
        duration: `${item.minutes} min`,
        image: itemData?.thumbnail_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcRbQHP_KN6w9PmfTxS3Rk6tHYeUdIxNuUnO4BvbT1T1m3HmAT0APXPtAu1iRqpkYVEjl3GrRcWiZsHiIeCWFTp9PAe7h-FBnXDw2Uetoz5rI8y_F_B7BMdX33L02YWn7J7u8IGswDGaQVwBsi7wzT2YWy0uks3sQdiE_ifwQ_tQRDuN2Wqu26jIMZGG25PHddh5FHTMMG7AtOztSjXxcgzSG9taB4xtMIkx-oYZ2fbt8VRoYbqTvv5O-oPlC-x3Dz6tSz5cus3tw',
        action: 'play_arrow',
        active: isDue,
        item,
      };
    });
  }, [plan, taxonomy]);

  const progressPercentage = (upNextLesson.progress.current / upNextLesson.progress.total) * 100;
  const circumference = 2 * Math.PI * 10;
  const offset = circumference - (progressPercentage / 100) * circumference;

  // Show loading state
  if (planLoading) {
    return (
      <div className="smart-review-screen">
        <header className="smart-review-screen__header">
          <div className="smart-review-screen__header-top">
            <div className="smart-review-screen__retention-pill">
              <span className="material-symbols-outlined filled smart-review-screen__retention-icon">
                psychology
              </span>
              <p className="smart-review-screen__retention-text">Retention: --</p>
            </div>
            <div 
              className="smart-review-screen__profile-avatar"
              style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuBfBPSEK00wDz93EIwdYTY8evnDnh2lX2ML1olL_jgLkz7wFJJYHXVjHzUDtAYZx5cYW3koBEcbDiupzmrm9_qA9KxRzJj6gvcAqoGLsS-YMHu_O2EYP4Ep5XdiFXETxAv28KSOfwiUGXmAyYlaqx5Dh6jGTaRmytRdXMYHe_sjslNa8znEGpIzR1WKi9RrheKqvgnbl7ysyhW-0cxIJs3IdqUo67y-I-I-9Ups2XeH4Rzaqzy6T00zru7p2EwSP9TAedttJEJreFQ)' }}
              onClick={() => navigate('/profile')}
            />
          </div>
          <h1 className="smart-review-screen__title">Smart Review</h1>
        </header>
        <main className="smart-review-screen__content">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading your review plan...</p>
          </div>
        </main>
        <BottomNav activePage="review" />
      </div>
    );
  }

  return (
    <div className="smart-review-screen">
      {/* Header */}
      <header className="smart-review-screen__header">
        <div className="smart-review-screen__header-top">
          <div className="smart-review-screen__retention-pill">
            <span className="material-symbols-outlined filled smart-review-screen__retention-icon">
              psychology
            </span>
            <p className="smart-review-screen__retention-text">
              Retention: {plan?.retention_score !== null && plan?.retention_score !== undefined
                ? `${Math.round(plan.retention_score * 100)}%`
                : '--%'}
            </p>
          </div>
          
          <div 
            className="smart-review-screen__profile-avatar"
            style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuBfBPSEK00wDz93EIwdYTY8evnDnh2lX2ML1olL_jgLkz7wFJJYHXVjHzUDtAYZx5cYW3koBEcbDiupzmrm9_qA9KxRzJj6gvcAqoGLsS-YMHu_O2EYP4Ep5XdiFXETxAv28KSOfwiUGXmAyYlaqx5Dh6jGTaRmytRdXMYHe_sjslNa8znEGpIzR1WKi9RrheKqvgnbl7ysyhW-0cxIJs3IdqUo67y-I-I-9Ups2XeH4Rzaqzy6T00zru7p2EwSP9TAedttJEJreFQ)' }}
            onClick={() => navigate('/profile')}
          />
        </div>
        <h1 className="smart-review-screen__title">Smart Review</h1>
      </header>

      {/* Main Content */}
      <main className="smart-review-screen__content">
        {/* Up Next Section */}
        <section className="smart-review-screen__section">
          <div className="smart-review-screen__section-header">
            <h3 className="smart-review-screen__section-title">Up Next</h3>
            <span className="smart-review-screen__priority-badge">High Priority</span>
          </div>

          <HeroCard
            image={upNextLesson.image}
            badge={
              <div className="smart-review-screen__progress-badge">
                <div className="smart-review-screen__progress-circle">
                  <svg className="smart-review-screen__progress-svg" viewBox="0 0 24 24">
                    <circle
                      className="smart-review-screen__progress-bg"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <circle
                      className="smart-review-screen__progress-fill"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                    />
                  </svg>
                </div>
                <span className="smart-review-screen__progress-text">
                  Part {upNextLesson.progress.current}/{upNextLesson.progress.total}
                </span>
              </div>
            }
          >
            <h2 className="smart-review-screen__hero-title">{upNextLesson.title}</h2>
            <p className="smart-review-screen__hero-description">
              {upNextLesson.description}
            </p>

            <div className="smart-review-screen__hero-footer">
              <div className="smart-review-screen__coaches">
                {upNextLesson.coaches.map((coach, index) => (
                  <img
                    key={index}
                    className="smart-review-screen__coach-avatar"
                    src={coach}
                    alt={`Coach ${index + 1}`}
                  />
                ))}
                <span className="smart-review-screen__coaches-more">
                  +{upNextLesson.moreCoaches}
                </span>
              </div>

              <button 
                className="smart-review-screen__start-btn"
                onClick={async () => {
                  if (upNextLesson.item) {
                    // Store item info for completion callback
                    const item = upNextLesson.item;
                    if (item.item_type === 'lesson') {
                      navigate(`/lesson/${item.item_id}`, { 
                        state: { 
                          fromSmartReview: true,
                          reviewItem: item 
                        } 
                      });
                    } else {
                      navigate(`/drill/${item.item_id}`, { 
                        state: { 
                          fromSmartReview: true,
                          reviewItem: item 
                        } 
                      });
                    }
                  } else {
                    navigate('/lesson');
                  }
                }}
                disabled={planLoading || !upNextLesson.item}
              >
                <span className="material-symbols-outlined filled">play_arrow</span>
                <span>Start ({upNextLesson.duration})</span>
              </button>
            </div>
          </HeroCard>
        </section>

        {/* Timeline Section */}
        <section className="smart-review-screen__section">
          <h3 className="smart-review-screen__section-title">Review Cadence</h3>
          
          <div className="smart-review-screen__timeline-card">
            <div className="smart-review-screen__timeline">
              {timeline.map((item, index) => (
                <div key={item.id} className="smart-review-screen__timeline-item">
                  <div className="smart-review-screen__timeline-indicator">
                    {index > 0 && (
                      <div className="smart-review-screen__timeline-connector smart-review-screen__timeline-connector--top" />
                    )}
                    <div 
                      className={`smart-review-screen__timeline-icon smart-review-screen__timeline-icon--${item.color} ${
                        item.active ? 'smart-review-screen__timeline-icon--active' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="smart-review-screen__timeline-connector smart-review-screen__timeline-connector--bottom" />
                    )}
                  </div>

                  <div className="smart-review-screen__timeline-content">
                    <div className="smart-review-screen__timeline-header">
                      <p 
                        className={`smart-review-screen__timeline-title ${
                          item.active ? 'smart-review-screen__timeline-title--active' : ''
                        }`}
                      >
                        {item.title}
                      </p>
                      <span 
                        className={`smart-review-screen__timeline-time ${
                          item.active ? 'smart-review-screen__timeline-time--active' : ''
                        }`}
                      >
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="smart-review-screen__timeline-description">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Drills Section */}
        <section className="smart-review-screen__section smart-review-screen__drills-section">
          <h3 className="smart-review-screen__section-title">Quick Drills</h3>
          
          <div className="smart-review-screen__drills">
            {quickDrills.map((drill) => (
              <HorizontalCard
                key={drill.id}
                image={drill.image}
                title={drill.title}
                subtitle={drill.subtitle}
                className={!drill.active ? 'horizontal-card--inactive' : ''}
              >
                <div className="smart-review-screen__drill-footer">
                  {drill.duration && (
                    <span className="smart-review-screen__drill-duration">
                      {drill.duration}
                    </span>
                  )}
                  {drill.badge && (
                    <span className="smart-review-screen__drill-badge">
                      {drill.badge}
                    </span>
                  )}
                  <button 
                    className="smart-review-screen__drill-action"
                    onClick={() => {
                      if (drill.item) {
                        const item = drill.item;
                        if (item.item_type === 'lesson') {
                          navigate(`/lesson/${item.item_id}`, { 
                            state: { 
                              fromSmartReview: true,
                              reviewItem: item 
                            } 
                          });
                        } else {
                          navigate(`/drill/${item.item_id}`, { 
                            state: { 
                              fromSmartReview: true,
                              reviewItem: item 
                            } 
                          });
                        }
                      }
                    }}
                  >
                    <span className="material-symbols-outlined">{drill.action}</span>
                  </button>
                </div>
              </HorizontalCard>
            ))}
          </div>
        </section>
      </main>

      {/* Reused BottomNav component */}
      <BottomNav activePage="review" />
    </div>
  );
}

export default SmartReviewScreen;

