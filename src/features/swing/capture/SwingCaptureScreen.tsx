/**
 * Screen for capturing and analyzing golf swings.
 * Handles video recording, pose detection, and analysis display.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwingCapture, CaptureStatus } from './useSwingCapture';
import './SwingCaptureScreen.css';

function SwingCaptureScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    status,
    progress,
    error,
    captureId,
    analysis,
    processVideoBlob,
    reset,
  } = useSwingCapture();

  // Start camera preview
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start recording
  const handleStartRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      stopCamera();
      await processVideoBlob(blob, {
        environment: 'range',
        camera_angle: 'down-the-line',
      });
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setRecordingTime(0);

    // Start recording timer
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  // Stop recording
  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // View analysis results
  const handleViewAnalysis = () => {
    if (captureId) {
      navigate(`/swing-analysis/${captureId}`);
    }
  };

  // Start over
  const handleReset = () => {
    reset();
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
  }, []);

  const isRecording = mediaRecorderRef.current?.state === 'recording';
  const isProcessing = ['processing', 'extracting', 'uploading', 'analyzing'].includes(status);
  const isComplete = status === 'complete';
  const hasError = status === 'error';

  return (
    <div className="swing-capture">
      {/* Header */}
      <header className="swing-capture__header">
        <button onClick={() => navigate(-1)} className="swing-capture__back-btn">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="swing-capture__title">Capture Swing</h1>
        <div className="swing-capture__spacer" />
      </header>

      {/* Camera / Video Preview */}
      <div className="swing-capture__video-container">
        {!isProcessing && !isComplete && !hasError && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="swing-capture__video"
            />
            
            {/* Alignment guides */}
            <div className="swing-capture__guides">
              <div className="swing-capture__guide swing-capture__guide--vertical" />
              <div className="swing-capture__guide swing-capture__guide--horizontal" />
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="swing-capture__recording-badge">
                <span className="swing-capture__recording-dot" />
                <span>{formatTime(recordingTime)}</span>
              </div>
            )}
          </>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="swing-capture__processing">
            <div className="swing-capture__spinner" />
            <p className="swing-capture__progress-text">{progress}</p>
            <StatusProgress status={status} />
          </div>
        )}

        {/* Complete state */}
        {isComplete && analysis && (
          <div className="swing-capture__complete">
            <span className="material-symbols-outlined swing-capture__check-icon">
              check_circle
            </span>
            <h2>Analysis Complete!</h2>
            
            {/* Quick summary */}
            <div className="swing-capture__summary">
              {analysis.analysis.coach_notes && (
                <p className="swing-capture__notes">{analysis.analysis.coach_notes}</p>
              )}
              
              {analysis.analysis.issue_scores && (
                <div className="swing-capture__issues">
                  <h3>Top Issues</h3>
                  <ul>
                    {Object.entries(analysis.analysis.issue_scores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([issue, score]) => (
                        <li key={issue}>
                          <span className="swing-capture__issue-name">
                            {issue.replace(/_/g, ' ')}
                          </span>
                          <span className="swing-capture__issue-score">
                            {Math.round((score as number) * 100)}%
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="swing-capture__error">
            <span className="material-symbols-outlined swing-capture__error-icon">
              error
            </span>
            <h2>Something went wrong</h2>
            <p>{error?.message || 'Failed to process swing'}</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isProcessing && !isComplete && !hasError && !isRecording && (
        <div className="swing-capture__instructions">
          <p>Position yourself so your full swing is visible</p>
          <p>Record a 3-5 second swing from down the line</p>
        </div>
      )}

      {/* Controls */}
      <div className="swing-capture__controls">
        {!isProcessing && !isComplete && !hasError && (
          <>
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="swing-capture__record-btn"
                disabled={!cameraActive}
              >
                <span className="swing-capture__record-btn-inner" />
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="swing-capture__stop-btn"
              >
                <span className="swing-capture__stop-btn-inner" />
              </button>
            )}
          </>
        )}

        {isComplete && (
          <div className="swing-capture__action-buttons">
            <button onClick={handleReset} className="swing-capture__secondary-btn">
              Record Another
            </button>
            <button onClick={handleViewAnalysis} className="swing-capture__primary-btn">
              View Full Analysis
            </button>
          </div>
        )}

        {hasError && (
          <button onClick={handleReset} className="swing-capture__primary-btn">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/** Progress indicator for processing steps */
function StatusProgress({ status }: { status: CaptureStatus }) {
  const steps: { key: CaptureStatus; label: string }[] = [
    { key: 'processing', label: 'Detecting pose' },
    { key: 'extracting', label: 'Extracting frames' },
    { key: 'uploading', label: 'Uploading' },
    { key: 'analyzing', label: 'AI Analysis' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="swing-capture__steps">
      {steps.map((step, i) => (
        <div
          key={step.key}
          className={`swing-capture__step ${
            i < currentIndex
              ? 'swing-capture__step--done'
              : i === currentIndex
              ? 'swing-capture__step--active'
              : ''
          }`}
        >
          <span className="swing-capture__step-dot" />
          <span className="swing-capture__step-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export default SwingCaptureScreen;

