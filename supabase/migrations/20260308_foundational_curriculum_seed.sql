begin;

-- =========================================================
-- 1) TRACKS
-- =========================================================
insert into public.curriculum_track (slug, name, description, sort_order)
values
  ('foundation', 'Foundation', 'Core swing curriculum taught in phase order.', 1),
  ('corrective', 'Corrective', 'Personalized issue-fix curriculum based on swing diagnosis.', 2)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

-- =========================================================
-- 2) UNITS FOUNDATION
-- =========================================================
insert into public.curriculum_unit (
  track_id,
  slug,
  title,
  description,
  unit_type,
  primary_phase_id,
  sort_order,
  estimated_minutes,
  is_active
)
select
  ct.id,
  v.slug,
  v.title,
  v.description,
  'foundation',
  sp.id,
  v.sort_order,
  v.estimated_minutes,
  true
from public.curriculum_track ct
join (
  values
    ('setup', 'Setup', 'Build an athletic, repeatable address position that supports balance, alignment, and clean rotation.', 'setup', 1, 35),
    ('takeaway', 'Takeaway', 'Learn how the club, arms, and body start together so the club gets to P2 square and on track.', 'takeaway', 2, 30),
    ('backswing', 'Backswing', 'Build width, turn, pressure load, and stable body structure in the backswing.', 'backswing', 3, 40),
    ('top-of-swing', 'Top of Swing', 'Organize the club and body at the top so transition can start from a powerful shape.', 'top', 4, 30),
    ('transition', 'Transition', 'Start down from the ground up with pressure shift, hip uncoil, and trail-arm delivery.', 'downswing', 5, 25),
    ('downswing', 'Downswing', 'Control path, rotation, and speed delivery into impact.', 'downswing', 6, 30),
    ('impact', 'Impact', 'Train compression, shaft lean, posture retention, and stable strike conditions.', 'impact', 7, 30),
    ('release-finish', 'Release & Finish', 'Release the club through the ball and finish fully rotated in balance.', 'release', 8, 30)
) as v(slug, title, description, phase_slug, sort_order, estimated_minutes)
  on true
join public.swing_phase sp
  on sp.slug = v.phase_slug
where ct.slug = 'foundation'
on conflict (slug) do update
set
  track_id = excluded.track_id,
  title = excluded.title,
  description = excluded.description,
  unit_type = excluded.unit_type,
  primary_phase_id = excluded.primary_phase_id,
  sort_order = excluded.sort_order,
  estimated_minutes = excluded.estimated_minutes,
  is_active = excluded.is_active;

-- =========================================================
-- 3) UNITS CORRECTIVE
-- =========================================================
insert into public.curriculum_unit (
  track_id,
  slug,
  title,
  description,
  unit_type,
  primary_error_id,
  sort_order,
  estimated_minutes,
  is_active
)
select
  ct.id,
  v.slug,
  v.title,
  v.description,
  'corrective',
  se.id,
  v.sort_order,
  v.estimated_minutes,
  true
from public.curriculum_track ct
join (
  values
    ('over-the-top', 'Over-the-Top', 'Neutralize an outside-in transition and restore delivery from the inside.', 'over-the-top', 1, 30),
    ('inside-takeaway', 'Inside Takeaway', 'Stop dragging the club too far inside early and restore a neutral takeaway path.', 'inside-takeaway', 2, 25),
    ('reverse-pivot', 'Reverse Pivot', 'Fix improper pressure movement so the body loads and unwinds from a stable base.', 'reverse-pivot', 3, 30),
    ('scooping-flip-release', 'Scooping / Flip Release', 'Replace scooping with hands-ahead compression and proper strike geometry.', 'scooping', 4, 30),
    ('blocking-pushes', 'Blocking / Pushes', 'Eliminate blocks by fixing path, face control, and rotation through impact.', 'blocking', 5, 25),
    ('standing-up-at-impact', 'Standing Up at Impact', 'Maintain posture through impact instead of losing spine angle and standing up.', 'standing-up', 6, 30),
    ('deceleration', 'Deceleration', 'Train acceleration through the ball and complete the swing instead of quitting on it.', 'decel', 7, 20),
    ('trail-knee-lock', 'Trail Knee Lock', 'Restore trail-knee flex and coil so backswing depth and rotation improve.', 'locking-right-knee', 8, 25),
    ('lead-knee-lock', 'Lead Knee Lock', 'Prevent a locked lead knee from disrupting rotation and strike quality.', 'locking-left-knee', 9, 25)
) as v(slug, title, description, error_slug_guess, sort_order, estimated_minutes)
  on true
join public.swing_error se
  on se.slug like '%' || v.error_slug_guess || '%'
where ct.slug = 'corrective'
on conflict (slug) do update
set
  track_id = excluded.track_id,
  title = excluded.title,
  description = excluded.description,
  unit_type = excluded.unit_type,
  primary_error_id = excluded.primary_error_id,
  sort_order = excluded.sort_order,
  estimated_minutes = excluded.estimated_minutes,
  is_active = excluded.is_active;

-- =========================================================
-- 4) UNITS MECHANICS
-- =========================================================
insert into public.curriculum_unit_mechanic (unit_id, mechanic_id, role, weight, notes)
select cu.id, m.id, x.role, x.weight, x.notes
from (
  values
    -- setup
    ('setup', 'ball-position-at-address', 'primary', 1.00, 'Ball position baseline'),
    ('setup', 'stance-width-at-setup', 'primary', 1.00, 'Athletic stance width'),
    ('setup', 'feet-alignment-at-address', 'primary', 1.00, 'Parallel alignment'),
    ('setup', 'weight-distribution-at-setup', 'primary', 1.00, 'Balanced setup pressure'),
    ('setup', 'clubface-position-at-setup', 'primary', 0.95, 'Square face baseline'),
    ('setup', 'club-grip-at-setup', 'primary', 0.95, 'Grip fundamentals'),
    ('setup', 'forward-lean-address', 'secondary', 0.80, 'Pre-sets compression for irons'),
    ('setup', 'knees-bent-in-setup', 'secondary', 0.75, 'Athletic knee flex'),
    ('setup', 'natural-spine-angle-address', 'primary', 0.95, 'Hip hinge and posture'),
    ('setup', 'spine-straight', 'primary', 0.90, 'Neutral spine'),
    ('setup', 'shoulders-angled', 'secondary', 0.75, 'Proper setup tilt'),
    ('setup', 'chin-extended', 'secondary', 0.60, 'Frees shoulder turn'),

    -- takeaway
    ('takeaway', 'takeaway-club-path', 'primary', 1.00, 'P2 path is the main objective'),
    ('takeaway', 'takeaway-club-face', 'primary', 0.95, 'Face control at P2'),
    ('takeaway', 'swing-sequence-arms-shoulders-hips', 'support', 0.70, 'Body-led takeaway supports path'),

    -- backswing
    ('backswing', 'left-arm-straight-backswing', 'secondary', 0.80, 'Width'),
    ('backswing', 'trail-knee-flex-backswing', 'primary', 0.90, 'Maintains structure'),
    ('backswing', 'lead-knee-direction-backswing', 'secondary', 0.75, 'Supports coil'),
    ('backswing', 'hip-rotation-backswing', 'primary', 1.00, 'Core backswing turn'),
    ('backswing', 'hips-stay-in-box-backswing', 'primary', 0.95, 'Turn not sway'),
    ('backswing', 'head-stability-backswing', 'secondary', 0.70, 'Center control'),
    ('backswing', 'weight-shift-backswing', 'primary', 0.90, 'Trail-side load'),
    ('backswing', 'backswing-tempo', 'secondary', 0.65, 'Tempo organization'),
    ('backswing', 'swing-sequence-arms-shoulders-hips', 'support', 0.60, 'Kinematic organization'),

    -- top
    ('top-of-swing', 'left-wrist-flat-top', 'primary', 0.95, 'Controls face and structure'),
    ('top-of-swing', 'full-wrist-hinge-top', 'primary', 1.00, 'Load the club'),
    ('top-of-swing', 'shaft-direction-top', 'primary', 0.95, 'Horizontal top direction'),
    ('top-of-swing', 'shaft-parallel-top', 'primary', 0.90, 'Vertical top position'),
    ('top-of-swing', 'spine-angle-top', 'secondary', 0.75, 'Maintain posture'),
    ('top-of-swing', 'back-faces-target-top', 'secondary', 0.70, 'Completion of turn'),

    -- transition
    ('transition', 'wrist-hinge-downswing', 'primary', 0.90, 'Maintain wrist set'),
    ('transition', 'hip-uncoil-first', 'primary', 1.00, 'Ground-up start'),
    ('transition', 'weight-transfer-lead-foot', 'primary', 0.95, 'Pressure shift early'),

    -- downswing
    ('downswing', 'hips-stay-in-box-downswing', 'primary', 0.90, 'Rotate instead of slide'),
    ('downswing', 'inside-square-inside-path', 'primary', 1.00, 'Delivery path'),
    ('downswing', 'weight-transfer-lead-foot', 'secondary', 0.80, 'Pressure supports path'),
    ('downswing', 'downswing-faster-backswing', 'secondary', 0.75, 'Proper speed pattern'),

    -- impact
    ('impact', 'hands-ahead-impact', 'primary', 1.00, 'Compression baseline'),
    ('impact', 'lead-knee-flex-impact', 'secondary', 0.70, 'Impact structure'),
    ('impact', 'hips-hands-square-impact', 'primary', 0.90, 'Face/body relationship'),
    ('impact', 'spine-angle-impact', 'primary', 0.95, 'No early extension'),
    ('impact', 'head-down-impact', 'secondary', 0.65, 'Stable head'),
    ('impact', 'strike-angle-pattern', 'primary', 0.90, 'Down on irons / up on woods'),

    -- release / finish
    ('release-finish', 'spine-tilt-release', 'secondary', 0.70, 'Maintain side bend'),
    ('release-finish', 'arm-extension-release', 'primary', 0.95, 'Extension through strike'),
    ('release-finish', 'forearm-roll-release', 'primary', 0.90, 'Natural release'),
    ('release-finish', 'club-path-release', 'secondary', 0.75, 'Exit pattern'),
    ('release-finish', 'hip-rotation-follow', 'primary', 0.90, 'Full rotation'),
    ('release-finish', 'full-follow-through', 'primary', 0.95, 'Complete motion'),
    ('release-finish', 'weight-left-finish', 'primary', 1.00, 'Balanced finish')
) as x(unit_slug, mechanic_slug, role, weight, notes)
join public.curriculum_unit cu on cu.slug = x.unit_slug
join public.swing_mechanic m on m.slug = x.mechanic_slug
on conflict (unit_id, mechanic_id) do update
set role = excluded.role,
    weight = excluded.weight,
    notes = excluded.notes;

-- =========================================================
-- 5) UNITS ITEMS
-- =========================================================
insert into public.curriculum_unit_item (
  unit_id,
  item_order,
  item_type,
  lesson_id,
  drill_id,
  cue_id,
  is_required,
  is_bonus,
  notes
)
select
  cu.id,
  x.item_order,
  x.item_type,
  l.id,
  d.id,
  c.id,
  x.is_required,
  x.is_bonus,
  x.notes
from (
  values
    -- =====================================================
    -- FOUNDATION: SETUP
    -- =====================================================
    ('setup',  1, 'lesson', 'setup-fundamentals', null, null, true,  false, 'Core setup baseline.'),
    ('setup',  2, 'cue',    null, null, 'ball-position-stock-shot',  true,  false, 'Ball-position anchor cue.'),
    ('setup',  3, 'cue',    null, null, 'stance-shoulder-width',     true,  false, 'Stance-width anchor cue.'),
    ('setup',  4, 'cue',    null, null, 'weight-50-50-setup',        true,  false, 'Pressure/balance anchor cue.'),
    ('setup',  5, 'lesson', 'alignment-grip-clubface', null, null, true, false, 'Alignment, grip, and face control.'),
    ('setup',  6, 'cue',    null, null, 'feet-parallel-targetline',  true,  false, 'Alignment reminder.'),
    ('setup',  7, 'cue',    null, null, 'clubface-square-target',    true,  false, 'Face aim reminder.'),
    ('setup',  8, 'cue',    null, null, 'neutral-grip-two-knuckles', true,  false, 'Grip reference cue.'),
    ('setup',  9, 'lesson', 'posture-upper-body', null, null, true, false, 'Posture, tilt, and upper body.'),
    ('setup', 10, 'cue',    null, null, 'hinge-from-hips',           true,  false, 'Posture cue.'),
    ('setup', 11, 'cue',    null, null, 'neutral-spine-posture',     true,  false, 'Neutral spine cue.'),
    ('setup', 12, 'cue',    null, null, 'trail-shoulder-lower',      false, true,  'Optional setup refinement cue.'),
    ('setup', 13, 'cue',    null, null, 'chin-up-eyes-down',         false, true,  'Optional mobility/setup refinement cue.'),

    -- =====================================================
    -- FOUNDATION: TAKEAWAY
    -- =====================================================
    ('takeaway',  1, 'lesson', 'one-piece-fundamentals', null, null, true,  false, 'Start the swing with the body and keep the club organized.'),
    ('takeaway',  2, 'cue',    null, null, 'low-and-square-takeaway', true, false, 'Primary takeaway cue.'),
    ('takeaway',  3, 'drill',  null, 'one-piece', null, true, false, 'Primary takeaway drill.'),
    ('takeaway',  4, 'cue',    null, null, 'avoid-rolling-hands', true, false, 'Prevent over-roll early.'),
    ('takeaway',  5, 'lesson', 'clubface-control', null, null, true, false, 'Face control at P2.'),
    ('takeaway',  6, 'cue',    null, null, 'face-matches-spine-at-p2', true, false, 'Clubface orientation cue.'),
    ('takeaway',  7, 'drill',  null, 'square-takeaway', null, true, false, 'Pure takeaway path calibration.'),
    ('takeaway',  8, 'drill',  null, 'proper-club', null, false, true, 'Extra takeaway/backswing checkpoint drill.'),

    -- =====================================================
    -- FOUNDATION: BACKSWING
    -- =====================================================
    ('backswing',  1, 'lesson', 'arm-structure-body-stability', null, null, true, false, 'Width and lower body stability.'),
    ('backswing',  2, 'cue',    null, null, 'trail-knee-stays-flexed', true, false, 'Trail-knee structure cue.'),
    ('backswing',  3, 'cue',    null, null, 'lead-knee-points-ball',   true, false, 'Lead-knee motion cue.'),
    ('backswing',  4, 'lesson', 'backswing-turn-pressure-load', null, null, true, false, 'Turn and load into the trail side.'),
    ('backswing',  5, 'cue',    null, null, 'hips-turn-not-slide',      true, false, 'Turn vs sway cue.'),
    ('backswing',  6, 'cue',    null, null, 'weight-into-trail-instep', true, false, 'Trail pressure cue.'),
    ('backswing',  7, 'drill',  null, 'proper-upper', null, true, false, 'Main backswing structure drill.'),
    ('backswing',  8, 'lesson', 'head-control-tempo', null, null, true, false, 'Center, tempo, and sequence.'),
    ('backswing',  9, 'cue',    null, null, 'smooth-back-quicker-down', true, false, 'Tempo cue.'),
    ('backswing', 10, 'drill',  null, 'weight-transfer', null, false, true, 'Pressure-loading reinforcement.'),

    -- =====================================================
    -- FOUNDATION: TOP OF SWING
    -- =====================================================
    ('top-of-swing',  1, 'lesson', 'wrist-set-top-position', null, null, true, false, 'Load and organize the club at the top.'),
    ('top-of-swing',  2, 'drill',  null, 'proper-right-hand', null, true, false, 'Wrist/top structure drill.'),
    ('top-of-swing',  3, 'lesson', 'shaft-top-structure', null, null, true, false, 'Top-of-swing shaft direction and structure.'),
    ('top-of-swing',  4, 'cue',    null, null, 'back-to-target-at-top', true, false, 'Top-of-swing completion cue.'),
    ('top-of-swing',  5, 'drill',  null, 'on-plane', null, true, false, 'Plane/height calibration drill.'),
    ('top-of-swing',  6, 'drill',  null, 'proper-club-top', null, true, false, 'Top position drill.'),
    ('top-of-swing',  7, 'drill',  null, 'proper-club-direction', null, false, true, 'Extra top-direction refinement.'),

    -- =====================================================
    -- FOUNDATION: TRANSITION
    -- =====================================================
    ('transition',  1, 'lesson', 'transition-sequence-top', null, null, true, false, 'Start down from the ground up.'),
    ('transition',  2, 'cue',    null, null, 'hips-start-downswing', true, false, 'Primary transition cue.'),
    ('transition',  3, 'cue',    null, null, 'drop-trail-elbow-down', true, false, 'Trail-arm delivery cue.'),
    ('transition',  4, 'cue',    null, null, 'pressure-into-lead-heel', true, false, 'Pressure shift cue.'),
    ('transition',  5, 'drill',  null, 'snap-left-knee', null, true, false, 'Ground-up transition drill.'),
    ('transition',  6, 'drill',  null, 'weight-transfer', null, true, false, 'Pressure shift drill.'),

    -- =====================================================
    -- FOUNDATION: DOWNSWING
    -- =====================================================
    ('downswing',  1, 'lesson', 'plane-path-downswing', null, null, true, false, 'Path and delivery organization.'),
    ('downswing',  2, 'drill',  null, 'correct-path', null, true, false, 'Main delivery path drill.'),
    ('downswing',  3, 'drill',  null, 'anti-over-top', null, true, false, 'Neutralize path getting above plane.'),
    ('downswing',  4, 'lesson', 'pressure-shift-speed', null, null, true, false, 'Pressure and speed sequencing.'),
    ('downswing',  5, 'cue',    null, null, 'smooth-back-quicker-down', true, false, 'Tempo/speed cue revisited.'),
    ('downswing',  6, 'drill',  null, 'weight-transfer', null, false, true, 'Support pressure timing.'),

    -- =====================================================
    -- FOUNDATION: IMPACT
    -- =====================================================
    ('impact',  1, 'lesson', 'compression-hands-first', null, null, true, false, 'Train hands-first compression.'),
    ('impact',  2, 'cue',    null, null, 'hands-ahead-at-impact', true, false, 'Primary impact cue.'),
    ('impact',  3, 'cue',    null, null, 'hit-down-with-irons',   true, false, 'Strike-pattern cue.'),
    ('impact',  4, 'cue',    null, null, 'trust-the-loft',        true, false, 'Anti-scoop cue.'),
    ('impact',  5, 'drill',  null, 'impact-bag', null, true, false, 'Core impact drill.'),
    ('impact',  6, 'drill',  null, 'static-press', null, true, false, 'Hands-ahead patterning drill.'),
    ('impact',  7, 'lesson', 'posture-squareness-impact', null, null, true, false, 'Posture and rotational structure through strike.'),
    ('impact',  8, 'cue',    null, null, 'maintain-spine-tilt',  true, false, 'Posture retention cue.'),
    ('impact',  9, 'cue',    null, null, 'head-stays-steady',    false, true, 'Optional head-control cue.'),

    -- =====================================================
    -- FOUNDATION: RELEASE & FINISH
    -- =====================================================
    ('release-finish',  1, 'lesson', 'release-through-ball', null, null, true, false, 'Extension and natural forearm release.'),
    ('release-finish',  2, 'cue',    null, null, 'heavy-club-extends-arms', true, false, 'Extension cue.'),
    ('release-finish',  3, 'cue',    null, null, 'trail-hand-rolls-over',   true, false, 'Release cue.'),
    ('release-finish',  4, 'cue',    null, null, 'club-exits-around-body',  true, false, 'Exit cue.'),
    ('release-finish',  5, 'drill',  null, 'proper-arm-rotation', null, true, false, 'Arm-release drill.'),
    ('release-finish',  6, 'drill',  null, 'proper-hand-rotation', null, true, false, 'Hand-release drill.'),
    ('release-finish',  7, 'lesson', 'balanced-finish', null, null, true, false, 'Complete the swing into balance.'),
    ('release-finish',  8, 'cue',    null, null, 'belt-buckle-at-target', true, false, 'Rotation finish cue.'),
    ('release-finish',  9, 'cue',    null, null, 'don’t-quit-the-swing',  true, false, 'Follow-through cue.'),
    ('release-finish', 10, 'cue',    null, null, 'finish-on-lead-foot',   true, false, 'Balanced finish cue.'),
    ('release-finish', 11, 'drill',  null, 'follow-through', null, true, false, 'Finish-position drill.'),
    ('release-finish', 12, 'cue',    null, null, 'balanced-hold-till-land', false, true, 'Optional balance challenge cue.')
) as x(unit_slug, item_order, item_type, lesson_slug, drill_slug, cue_slug, is_required, is_bonus, notes)
join public.curriculum_unit cu
  on cu.slug = x.unit_slug
left join public.lesson l
  on x.lesson_slug is not null and l.slug = x.lesson_slug
left join public.drill d
  on x.drill_slug is not null and d.slug = x.drill_slug
left join public.coaching_cue c
  on x.cue_slug is not null and c.slug = x.cue_slug
where cu.unit_type = 'foundation'
on conflict do nothing;

commit;