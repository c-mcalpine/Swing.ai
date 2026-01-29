-- Sample Data for Swing.ai Database
-- This file provides example data to get started with the app
-- Run this in your Supabase SQL Editor after creating the schema

-- ============================================
-- 1. SWING PHASES
-- ============================================
INSERT INTO swing_phase (slug, name, description, sort_order) VALUES
('setup', 'Setup', 'The pre-swing position and alignment', 1),
('backswing', 'Backswing', 'The motion of taking the club back', 2),
('transition', 'Transition', 'The brief moment between backswing and downswing', 3),
('downswing', 'Downswing', 'The motion of bringing the club down to impact', 4),
('impact', 'Impact', 'The moment the club strikes the ball', 5),
('follow-through', 'Follow Through', 'The completion of the swing after impact', 6);

-- ============================================
-- 2. SWING MECHANICS
-- ============================================
INSERT INTO swing_mechanic (slug, name, phase_id, category, body_part, mechanic_type, difficulty, is_fundamental, measurable, description_short) VALUES
-- Setup mechanics
('grip-pressure', 'Grip Pressure', (SELECT id FROM swing_phase WHERE slug = 'setup'), 'grip', 'hands', 'static', 2, true, true, 'Maintain neutral grip pressure without tension'),
('ball-position', 'Ball Position', (SELECT id FROM swing_phase WHERE slug = 'setup'), 'alignment', 'ball', 'static', 1, true, true, 'Proper ball placement relative to stance'),
('stance-width', 'Stance Width', (SELECT id FROM swing_phase WHERE slug = 'setup'), 'posture', 'feet', 'static', 1, true, true, 'Feet positioned shoulder-width apart'),

-- Backswing mechanics
('shoulder-turn', 'Shoulder Turn', (SELECT id FROM swing_phase WHERE slug = 'backswing'), 'rotation', 'shoulders', 'dynamic', 3, true, true, 'Full shoulder rotation on the backswing'),
('weight-shift-back', 'Weight Shift Back', (SELECT id FROM swing_phase WHERE slug = 'backswing'), 'weight-transfer', 'lower-body', 'dynamic', 4, true, true, 'Transfer weight to trail side during backswing'),

-- Downswing mechanics
('hip-rotation', 'Hip Rotation', (SELECT id FROM swing_phase WHERE slug = 'downswing'), 'rotation', 'hips', 'dynamic', 4, true, true, 'Proper hip rotation through impact'),
('weight-shift-forward', 'Weight Shift Forward', (SELECT id FROM swing_phase WHERE slug = 'downswing'), 'weight-transfer', 'lower-body', 'dynamic', 4, true, true, 'Transfer weight to lead side on downswing'),

-- Impact mechanics
('face-control', 'Club Face Control', (SELECT id FROM swing_phase WHERE slug = 'impact'), 'club-control', 'hands', 'dynamic', 5, true, true, 'Square club face at impact'),
('swing-path', 'Swing Path', (SELECT id FROM swing_phase WHERE slug = 'impact'), 'club-control', 'full-body', 'dynamic', 5, true, true, 'Inside-out swing path through impact');

-- ============================================
-- 3. SWING ERRORS
-- ============================================
INSERT INTO swing_error (slug, name, phase_id, typical_miss, description, cause_notes, fix, severity_scale) VALUES
('over-the-top', 'Over the Top', (SELECT id FROM swing_phase WHERE slug = 'downswing'), 'slice, pull', 'Casting the club over the plane on the downswing', 'Often caused by poor weight transfer or early shoulder rotation', 'Focus on dropping hands inside and rotating hips first', 8),
('chicken-wing', 'Chicken Wing', (SELECT id FROM swing_phase WHERE slug = 'impact'), 'weak contact, high ball flight', 'Lead elbow breaks down and folds at impact', 'Usually caused by poor body rotation or trying to help the ball up', 'Maintain lead arm extension through impact, rotate body', 6),
('early-extension', 'Early Extension', (SELECT id FROM swing_phase WHERE slug = 'downswing'), 'fat shots, blocks', 'Hips move toward the ball during downswing', 'Loss of spine angle and posture', 'Maintain spine angle, focus on rotating rather than standing up', 7),
('casting', 'Casting', (SELECT id FROM swing_phase WHERE slug = 'transition'), 'loss of power, inconsistent contact', 'Early release of wrist angle', 'Trying to hit from the top, poor sequencing', 'Delay wrist release, maintain lag through transition', 7),
('reverse-pivot', 'Reverse Pivot', (SELECT id FROM swing_phase WHERE slug = 'backswing'), 'topped shots, loss of power', 'Weight shifts forward on backswing instead of back', 'Poor weight transfer fundamentals', 'Load into trail side on backswing, feel pressure in trail foot', 6);

-- ============================================
-- 4. DRILLS
-- ============================================
INSERT INTO drill (slug, name, objective, description, tips, difficulty, min_duration_min, environment, equipment, xp_reward, is_beginner_friendly) VALUES
('gate-drill', 'The Gate Drill', 'Improve club face control at impact', 'Place two tees wider than your putter head to create a gate. Practice putting through the gate without hitting the tees.', 'Start with a wide gate and gradually narrow it. Focus on smooth tempo rather than speed.', 2, 5, 'practice-green', 'putter, tees', 50, true),

('wall-drill', 'Wall Drill', 'Fix over-the-top swing path', 'Stand with your back against a wall. Practice your takeaway without the club hitting the wall. This promotes an inside takeaway.', 'Start with slow motion swings. Feel the club working around your body.', 3, 10, 'any', 'any-club', 75, false),

('feet-together', 'Feet Together Drill', 'Improve balance and tempo', 'Hit shots with your feet touching. This forces better balance and smoother tempo.', 'Start with short irons. Focus on finishing your swing in balance.', 2, 5, 'range', 'short-iron', 50, true),

('split-grip', 'Split Grip Drill', 'Prevent casting and maintain lag', 'Place hands 6 inches apart on the club. Make half swings focusing on maintaining wrist angle.', 'Feel the hands working together. Bottom hand should not pass top hand early.', 4, 10, 'range', 'any-club', 100, false),

('impact-bag', 'Impact Bag Drill', 'Improve impact position and body angles', 'Hit into an impact bag focusing on proper body angles and weight transfer at impact.', 'Check your lead arm is straight, hips are open, weight is on front foot.', 3, 15, 'range', 'impact-bag, any-club', 75, false);

-- ============================================
-- 5. COACHING CUES
-- ============================================
INSERT INTO coaching_cue (slug, text, phase_id, mechanic_id, level, cue_type) VALUES
('light-grip', 'Hold the club like you''re holding a baby bird - firm enough not to drop it, gentle enough not to hurt it', (SELECT id FROM swing_phase WHERE slug = 'setup'), (SELECT id FROM swing_mechanic WHERE slug = 'grip-pressure'), 1, 'feel'),

('shoulder-under-chin', 'Turn your lead shoulder under your chin on the backswing', (SELECT id FROM swing_phase WHERE slug = 'backswing'), (SELECT id FROM swing_mechanic WHERE slug = 'shoulder-turn'), 2, 'visual'),

('bump-the-wall', 'Feel like you''re bumping your lead hip into a wall to start the downswing', (SELECT id FROM swing_phase WHERE slug = 'downswing'), (SELECT id FROM swing_mechanic WHERE slug = 'hip-rotation'), 3, 'feel'),

('zipper-to-target', 'Point your zipper at the target through impact', (SELECT id FROM swing_phase WHERE slug = 'impact'), (SELECT id FROM swing_mechanic WHERE slug = 'hip-rotation'), 2, 'visual'),

('logo-down', 'Keep the club logo facing down through impact for square face', (SELECT id FROM swing_phase WHERE slug = 'impact'), (SELECT id FROM swing_mechanic WHERE slug = 'face-control'), 3, 'visual');

-- ============================================
-- 6. LESSONS
-- ============================================
INSERT INTO lesson (slug, title, summary, level, primary_phase_id, lesson_type, duration_min, is_course, primary_error_id) VALUES
('fix-the-slice', 'Fixing the Slice', 'Learn to eliminate the slice with proper swing path and face control', 2, (SELECT id FROM swing_phase WHERE slug = 'impact'), 'technique', 15, false, (SELECT id FROM swing_error WHERE slug = 'over-the-top')),

('power-fundamentals', 'Power Fundamentals', 'Build a powerful golf swing with proper weight transfer and rotation', 3, (SELECT id FROM swing_phase WHERE slug = 'downswing'), 'technique', 20, false, NULL),

('putting-basics', 'Putting Basics', 'Master the fundamentals of putting: setup, stroke, and face control', 1, (SELECT id FROM swing_phase WHERE slug = 'setup'), 'short-game', 10, false, NULL);

-- ============================================
-- 7. LESSON STEPS
-- ============================================
INSERT INTO lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, estimated_min) VALUES
-- Fixing the Slice lesson steps
((SELECT id FROM lesson WHERE slug = 'fix-the-slice'), 1, 'instruction', 'Understanding the Slice', 'A slice happens when the club face is open relative to the swing path. We''ll fix this by correcting your swing path first, then working on face control.', NULL, NULL, 3),

((SELECT id FROM lesson WHERE slug = 'fix-the-slice'), 2, 'mechanic', 'Swing Path Fundamentals', 'An inside-out swing path is key to eliminating the slice.', NULL, (SELECT id FROM swing_mechanic WHERE slug = 'swing-path'), 4),

((SELECT id FROM lesson WHERE slug = 'fix-the-slice'), 3, 'drill', 'Practice with Wall Drill', 'Use the wall drill to ingrain the proper inside takeaway.', (SELECT id FROM drill WHERE slug = 'wall-drill'), NULL, 8),

-- Putting Basics lesson steps
((SELECT id FROM lesson WHERE slug = 'putting-basics'), 1, 'instruction', 'Setup Position', 'Proper setup is critical for consistent putting. Eyes over the ball, shoulders square to target line.', NULL, NULL, 2),

((SELECT id FROM lesson WHERE slug = 'putting-basics'), 2, 'mechanic', 'Ball Position', 'Place the ball slightly forward of center in your stance.', NULL, (SELECT id FROM swing_mechanic WHERE slug = 'ball-position'), 3),

((SELECT id FROM lesson WHERE slug = 'putting-basics'), 3, 'drill', 'Gate Drill Practice', 'Develop a square putter face with the gate drill.', (SELECT id FROM drill WHERE slug = 'gate-drill'), NULL, 5);

-- ============================================
-- 8. RELATIONSHIPS
-- ============================================

-- Drill to Mechanic relationships
INSERT INTO drill_mechanic (drill_id, mechanic_id, role, weight) VALUES
((SELECT id FROM drill WHERE slug = 'gate-drill'), (SELECT id FROM swing_mechanic WHERE slug = 'face-control'), 'primary', 1.0),
((SELECT id FROM drill WHERE slug = 'wall-drill'), (SELECT id FROM swing_mechanic WHERE slug = 'swing-path'), 'primary', 1.0),
((SELECT id FROM drill WHERE slug = 'feet-together'), (SELECT id FROM swing_mechanic WHERE slug = 'weight-shift-forward'), 'primary', 1.0),
((SELECT id FROM drill WHERE slug = 'split-grip'), (SELECT id FROM swing_mechanic WHERE slug = 'face-control'), 'supporting', 0.7);

-- Drill to Error relationships
INSERT INTO drill_error (drill_id, error_id, role, weight) VALUES
((SELECT id FROM drill WHERE slug = 'wall-drill'), (SELECT id FROM swing_error WHERE slug = 'over-the-top'), 'corrective', 1.0),
((SELECT id FROM drill WHERE slug = 'split-grip'), (SELECT id FROM swing_error WHERE slug = 'casting'), 'corrective', 1.0),
((SELECT id FROM drill WHERE slug = 'impact-bag'), (SELECT id FROM swing_error WHERE slug = 'early-extension'), 'corrective', 0.8),
((SELECT id FROM drill WHERE slug = 'impact-bag'), (SELECT id FROM swing_error WHERE slug = 'chicken-wing'), 'corrective', 0.7);

-- Cue to Drill relationships
INSERT INTO cue_drill (cue_id, drill_id) VALUES
((SELECT id FROM coaching_cue WHERE slug = 'light-grip'), (SELECT id FROM drill WHERE slug = 'gate-drill')),
((SELECT id FROM coaching_cue WHERE slug = 'bump-the-wall'), (SELECT id FROM drill WHERE slug = 'feet-together')),
((SELECT id FROM coaching_cue WHERE slug = 'logo-down'), (SELECT id FROM drill WHERE slug = 'gate-drill'));

-- Cue to Error relationships
INSERT INTO cue_error (cue_id, error_id) VALUES
((SELECT id FROM coaching_cue WHERE slug = 'bump-the-wall'), (SELECT id FROM swing_error WHERE slug = 'over-the-top')),
((SELECT id FROM coaching_cue WHERE slug = 'zipper-to-target'), (SELECT id FROM swing_error WHERE slug = 'early-extension')),
((SELECT id FROM coaching_cue WHERE slug = 'logo-down'), (SELECT id FROM swing_error WHERE slug = 'chicken-wing'));

-- Error to Mechanic relationships
INSERT INTO error_mechanic (swing_mechanic_id, swing_error_id, role, weight) VALUES
((SELECT id FROM swing_mechanic WHERE slug = 'swing-path'), (SELECT id FROM swing_error WHERE slug = 'over-the-top'), 'causes', 1.0),
((SELECT id FROM swing_mechanic WHERE slug = 'hip-rotation'), (SELECT id FROM swing_error WHERE slug = 'chicken-wing'), 'causes', 0.8),
((SELECT id FROM swing_mechanic WHERE slug = 'weight-shift-forward'), (SELECT id FROM swing_error WHERE slug = 'early-extension'), 'causes', 1.0);

-- Mechanic Key Points
INSERT INTO mechanic_key_point (mechanic_id, sort_order, point_type, text) VALUES
((SELECT id FROM swing_mechanic WHERE slug = 'grip-pressure'), 1, 'checkpoint', 'Grip should feel secure but not tense'),
((SELECT id FROM swing_mechanic WHERE slug = 'grip-pressure'), 2, 'checkpoint', 'Rate pressure on scale of 1-10, aim for 4-5'),
((SELECT id FROM swing_mechanic WHERE slug = 'hip-rotation'), 1, 'checkpoint', 'Hips should be 45 degrees open at impact'),
((SELECT id FROM swing_mechanic WHERE slug = 'hip-rotation'), 2, 'common-mistake', 'Don''t slide hips laterally - focus on rotation');

-- Mechanic Tips
INSERT INTO mechanic_tip (mechanic_id, sort_order, tip_type, text) VALUES
((SELECT id FROM swing_mechanic WHERE slug = 'grip-pressure'), 1, 'practice', 'Practice with different grip pressures to find your optimal feel'),
((SELECT id FROM swing_mechanic WHERE slug = 'shoulder-turn'), 1, 'drill', 'Place a club across shoulders and practice turn without hitting your head'),
((SELECT id FROM swing_mechanic WHERE slug = 'hip-rotation'), 1, 'feel', 'Feel like you''re throwing your right pocket toward the target');

-- ============================================
-- 9. SAMPLE DIAGNOSTIC
-- ============================================
-- This creates a sample swing diagnostic you can view in the app

INSERT INTO swing_diagnostic (user_id, video_url, phase_scores, mechanic_scores, error_scores, recommended_lesson_ids) VALUES
('demo-user', 'https://example.com/swing-video.mp4',
 '{"setup": 85, "backswing": 72, "transition": 70, "downswing": 68, "impact": 75, "follow-through": 80}'::jsonb,
 '{"grip-pressure": 70, "ball-position": 85, "shoulder-turn": 75, "hip-rotation": 65, "weight-shift-forward": 60, "face-control": 70, "swing-path": 55}'::jsonb,
 '{"over-the-top": 45, "chicken-wing": 30, "early-extension": 55, "casting": 25}'::jsonb,
 '[1, 2]'::jsonb
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your data was inserted correctly

-- Count records in each table
SELECT 'swing_phase' as table_name, COUNT(*) as count FROM swing_phase
UNION ALL SELECT 'swing_mechanic', COUNT(*) FROM swing_mechanic
UNION ALL SELECT 'swing_error', COUNT(*) FROM swing_error
UNION ALL SELECT 'drill', COUNT(*) FROM drill
UNION ALL SELECT 'coaching_cue', COUNT(*) FROM coaching_cue
UNION ALL SELECT 'lesson', COUNT(*) FROM lesson
UNION ALL SELECT 'lesson_step', COUNT(*) FROM lesson_step
UNION ALL SELECT 'drill_mechanic', COUNT(*) FROM drill_mechanic
UNION ALL SELECT 'drill_error', COUNT(*) FROM drill_error
UNION ALL SELECT 'cue_drill', COUNT(*) FROM cue_drill
UNION ALL SELECT 'cue_error', COUNT(*) FROM cue_error
UNION ALL SELECT 'error_mechanic', COUNT(*) FROM error_mechanic
UNION ALL SELECT 'mechanic_key_point', COUNT(*) FROM mechanic_key_point
UNION ALL SELECT 'mechanic_tip', COUNT(*) FROM mechanic_tip
UNION ALL SELECT 'swing_diagnostic', COUNT(*) FROM swing_diagnostic;

