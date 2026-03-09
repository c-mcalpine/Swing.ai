begin;

-- =========================================================
-- 1) CORRECTIVE UNITS
-- Use lesson.primary_error_id so this is exact to your DB
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
  x.unit_slug,
  x.unit_title,
  x.unit_description,
  'corrective',
  l.primary_error_id,
  x.sort_order,
  x.estimated_minutes,
  true
from public.curriculum_track ct
join (
  values
    ('fix-over-the-top',         'over-the-top',           'Over-the-Top',             'Neutralize an outside-in transition and restore delivery from the inside.', 1, 30),
    ('fix-inside-takeaway',      'inside-takeaway',        'Inside Takeaway',          'Stop dragging the club too far inside early and restore a neutral takeaway path.', 2, 25),
    ('fix-reverse-pivot',        'reverse-pivot',          'Reverse Pivot',            'Fix improper pressure movement so the body loads and unwinds from a stable base.', 3, 30),
    ('fix-scooping',             'scooping-flip-release',  'Scooping / Flip Release',  'Replace scooping with hands-ahead compression and proper strike geometry.', 4, 30),
    ('fix-blocking',             'blocking-pushes',        'Blocking / Pushes',        'Eliminate blocks by improving path, face control, and release through impact.', 5, 25),
    ('fix-standing-up',          'standing-up-at-impact',  'Standing Up at Impact',    'Maintain posture through impact instead of losing spine angle and standing up.', 6, 30),
    ('fix-decel',                'deceleration',           'Deceleration',             'Train acceleration through the ball and complete the swing instead of quitting on it.', 7, 20),
    ('fix-locking-right-knee',   'trail-knee-lock',        'Trail Knee Lock',          'Restore trail-knee flex and coil so backswing depth and rotation improve.', 8, 25),
    ('fix-locking-left-knee',    'lead-knee-lock',         'Lead Knee Lock',           'Prevent a locked lead knee from disrupting rotation and strike quality.', 9, 25)
) as x(lesson_slug, unit_slug, unit_title, unit_description, sort_order, estimated_minutes)
  on true
join public.lesson l
  on l.slug = x.lesson_slug
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
-- 2) CORRECTIVE UNIT MECHANICS
-- Pull full mechanic spine from error_mechanic via lesson.primary_error_id
-- Map error_mechanic roles into curriculum_unit_mechanic roles
-- =========================================================
insert into public.curriculum_unit_mechanic (
  unit_id,
  mechanic_id,
  role,
  weight,
  notes
)
select
  cu.id,
  em.swing_mechanic_id,
  case
    when em.role = 'primary_cause' then 'primary'
    when em.role = 'secondary_cause' then 'secondary'
    when em.role = 'symptom_marker' then 'support'
    else 'secondary'
  end as role,
  coalesce(em.weight, 1.0),
  em.notes
from public.curriculum_unit cu
join (
  values
    ('over-the-top',          'fix-over-the-top'),
    ('inside-takeaway',       'fix-inside-takeaway'),
    ('reverse-pivot',         'fix-reverse-pivot'),
    ('scooping-flip-release', 'fix-scooping'),
    ('blocking-pushes',       'fix-blocking'),
    ('standing-up-at-impact', 'fix-standing-up'),
    ('deceleration',          'fix-decel'),
    ('trail-knee-lock',       'fix-locking-right-knee'),
    ('lead-knee-lock',        'fix-locking-left-knee')
) as x(unit_slug, lesson_slug)
  on cu.slug = x.unit_slug
join public.lesson l
  on l.slug = x.lesson_slug
join public.error_mechanic em
  on em.swing_error_id = l.primary_error_id
on conflict (unit_id, mechanic_id) do update
set
  role = excluded.role,
  weight = excluded.weight,
  notes = excluded.notes;


-- =========================================================
-- 3) CORRECTIVE UNIT ITEMS
-- Curated as a coach-authored progression:
-- lesson -> cue -> drill -> cue -> drill -> cue/drill
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
    -- CORRECTIVE: OVER-THE-TOP
    -- =====================================================
    ('over-the-top', 1, 'lesson', 'fix-over-the-top',       null,                 null,                       true,  false, 'Diagnose and fix the outside-in over-the-top pattern.'),
    ('over-the-top', 2, 'cue',    null,                     null,                 'low-and-square-takeaway', true,  false, 'Clean takeaway prevents the club from starting above plane.'),
    ('over-the-top', 3, 'drill',  null,                     'anti-over-top',      null,                       true,  false, 'Primary corrective drill for OTT transition.'),
    ('over-the-top', 4, 'cue',    null,                     null,                 'hips-start-downswing',    true,  false, 'Shift the start-down sequence into the ground-up pattern.'),
    ('over-the-top', 5, 'drill',  null,                     'correct-path',       null,                       true,  false, 'Train delivery from the inside.'),
    ('over-the-top', 6, 'cue',    null,                     null,                 'drop-trail-elbow-down',   true,  false, 'Stop the elbow from throwing out toward the ball.'),
    ('over-the-top', 7, 'drill',  null,                     'one-piece',          null,                       false, true,  'Bonus takeaway cleanup drill if OTT starts early.'),

    -- =====================================================
    -- CORRECTIVE: INSIDE TAKEAWAY
    -- =====================================================
    ('inside-takeaway', 1, 'lesson', 'fix-inside-takeaway', null,                 null,                       true,  false, 'Rebuild takeaway path before the error cascades into the backswing and downswing.'),
    ('inside-takeaway', 2, 'cue',    null,                  null,                 'low-and-square-takeaway', true,  false, 'Primary takeaway path cue.'),
    ('inside-takeaway', 3, 'drill',  null,                  'square-takeaway',    null,                       true,  false, 'Main drill for neutral takeaway direction.'),
    ('inside-takeaway', 4, 'cue',    null,                  null,                 'avoid-rolling-hands',     true,  false, 'Stops the hands from sucking the club inside.'),
    ('inside-takeaway', 5, 'drill',  null,                  'proper-club',        null,                       true,  false, 'Reinforces club organization after takeaway.'),
    ('inside-takeaway', 6, 'cue',    null,                  null,                 'face-matches-spine-at-p2',true,  false, 'Face orientation checkpoint at shaft-parallel.'),
    ('inside-takeaway', 7, 'drill',  null,                  'one-piece',          null,                       false, true,  'Bonus body-led takeaway reinforcement.'),

    -- =====================================================
    -- CORRECTIVE: REVERSE PIVOT
    -- =====================================================
    ('reverse-pivot', 1, 'lesson', 'fix-reverse-pivot',     null,                 null,                       true,  false, 'Fix pressure movement and body motion so the pivot works in sequence.'),
    ('reverse-pivot', 2, 'cue',    null,                    null,                 'weight-50-50-setup',      true,  false, 'Start from a balanced base.'),
    ('reverse-pivot', 3, 'drill',  null,                    'weight-transfer',    null,                       true,  false, 'Primary pressure-shift drill.'),
    ('reverse-pivot', 4, 'cue',    null,                    null,                 'weight-into-trail-instep',true,  false, 'Backswing loading cue.'),
    ('reverse-pivot', 5, 'drill',  null,                    'proper-upper',       null,                       true,  false, 'Support rotational loading without swaying.'),
    ('reverse-pivot', 6, 'cue',    null,                    null,                 'pressure-into-lead-heel', true,  false, 'Transition/downswing pressure cue.'),
    ('reverse-pivot', 7, 'cue',    null,                    null,                 'finish-on-lead-foot',     false, true,  'Bonus finish checkpoint confirming pressure got left.'),

    -- =====================================================
    -- CORRECTIVE: SCOOPING / FLIP RELEASE
    -- =====================================================
    ('scooping-flip-release', 1, 'lesson', 'fix-scooping',  null,                 null,                       true,  false, 'Replace scooping and flipping with compression and forward low point.'),
    ('scooping-flip-release', 2, 'cue',    null,            null,                 'hands-ahead-at-impact',   true,  false, 'Primary compression cue.'),
    ('scooping-flip-release', 3, 'drill',  null,            'impact-bag',         null,                       true,  false, 'Impact structure drill.'),
    ('scooping-flip-release', 4, 'cue',    null,            null,                 'hit-down-with-irons',     true,  false, 'Low-point and strike-direction cue.'),
    ('scooping-flip-release', 5, 'drill',  null,            'static-press',       null,                       true,  false, 'Hands-ahead feel rehearsal.'),
    ('scooping-flip-release', 6, 'cue',    null,            null,                 'trust-the-loft',          true,  false, 'Anti-scoop intention cue.'),
    ('scooping-flip-release', 7, 'cue',    null,            null,                 'maintain-spine-tilt',     false, true,  'Bonus posture safeguard if scoop comes with standing up.'),

    -- =====================================================
    -- CORRECTIVE: BLOCKING / PUSHES
    -- =====================================================
    ('blocking-pushes', 1, 'lesson', 'fix-blocking',        null,                 null,                       true,  false, 'Correct blocks and pushes by cleaning up path, face, and release timing.'),
    ('blocking-pushes', 2, 'cue',    null,                  null,                 'clubface-square-target',  true,  false, 'Start from a face-neutral setup.'),
    ('blocking-pushes', 3, 'drill',  null,                  'correct-path',       null,                       true,  false, 'Path-control drill for delivery direction.'),
    ('blocking-pushes', 4, 'cue',    null,                  null,                 'trail-hand-rolls-over',   true,  false, 'Release cue to stop leaving the face open.'),
    ('blocking-pushes', 5, 'drill',  null,                  'proper-hand-rotation',null,                      true,  false, 'Primary release drill for blocks.'),
    ('blocking-pushes', 6, 'cue',    null,                  null,                 'belt-buckle-at-target',   true,  false, 'Rotation-through-finish cue.'),
    ('blocking-pushes', 7, 'drill',  null,                  'follow-through',     null,                       false, true,  'Bonus finish-completion drill if player stalls rotation.'),

    -- =====================================================
    -- CORRECTIVE: STANDING UP AT IMPACT
    -- =====================================================
    ('standing-up-at-impact', 1, 'lesson', 'fix-standing-up',null,                 null,                       true,  false, 'Maintain posture through strike and stop losing spine angle.'),
    ('standing-up-at-impact', 2, 'cue',    null,             null,                 'hinge-from-hips',         true,  false, 'Re-establish address posture before fixing impact posture.'),
    ('standing-up-at-impact', 3, 'drill',  null,             'proper-upper',       null,                       true,  false, 'Train turn around posture instead of lift out of it.'),
    ('standing-up-at-impact', 4, 'cue',    null,             null,                 'maintain-spine-tilt',     true,  false, 'Primary anti-early-extension cue.'),
    ('standing-up-at-impact', 5, 'drill',  null,             'impact-bag',         null,                       true,  false, 'Impact checkpoint under posture retention.'),
    ('standing-up-at-impact', 6, 'cue',    null,             null,                 'head-stays-steady',       true,  false, 'Keep head quiet while torso rotates.'),
    ('standing-up-at-impact', 7, 'cue',    null,             null,                 'keep-head-against-wall',  false, true,  'Bonus exaggeration cue for players who pop up dramatically.'),

    -- =====================================================
    -- CORRECTIVE: DECELERATION
    -- =====================================================
    ('deceleration', 1, 'lesson', 'fix-decel',              null,                 null,                       true,  false, 'Train acceleration through impact and full swing completion.'),
    ('deceleration', 2, 'cue',    null,                     null,                 'smooth-back-quicker-down',true,  false, 'Reframe tempo so the downswing wins the speed race.'),
    ('deceleration', 3, 'drill',  null,                     'follow-through',     null,                       true,  false, 'Primary drill for completing the swing.'),
    ('deceleration', 4, 'cue',    null,                     null,                 'don’t-quit-the-swing',    true,  false, 'Primary intention cue.'),
    ('deceleration', 5, 'cue',    null,                     null,                 'throw-club-down-fairway', true,  false, 'Gets speed and extension moving through the ball.'),
    ('deceleration', 6, 'drill',  null,                     'proper-arm-rotation',null,                       false, true,  'Bonus release-speed drill if player quits with the arms.'),
    ('deceleration', 7, 'cue',    null,                     null,                 'heavy-club-extends-arms', false, true,  'Bonus extension cue if decel shows up post-impact.'),

    -- =====================================================
    -- CORRECTIVE: TRAIL KNEE LOCK
    -- =====================================================
    ('trail-knee-lock', 1, 'lesson', 'fix-locking-right-knee',null,                null,                       true,  false, 'Restore trail-knee flex so the backswing can coil without standing up or swaying.'),
    ('trail-knee-lock', 2, 'cue',    null,                   null,                 'trail-knee-stays-flexed', true,  false, 'Primary anti-lock cue.'),
    ('trail-knee-lock', 3, 'cue',    null,                   null,                 'string-from-knee-to-ball',true,  false, 'External focus cue that keeps the knee in structure.'),
    ('trail-knee-lock', 4, 'drill',  null,                   'proper-upper',       null,                       true,  false, 'Best drill match for preserving trail-knee flex while turning.'),
    ('trail-knee-lock', 5, 'cue',    null,                   null,                 'weight-into-trail-instep',true,  false, 'Pressure-load cue stops the leg from straightening and drifting.'),
    ('trail-knee-lock', 6, 'cue',    null,                   null,                 'hips-turn-not-slide',     false, true,  'Bonus pelvis-turn cue when trail-knee lock is tied to sway.'),
    ('trail-knee-lock', 7, 'drill',  null,                   'weight-transfer',    null,                       false, true,  'Bonus drill if locking the knee is tied to a poor pressure move.'),

    -- =====================================================
    -- CORRECTIVE: LEAD KNEE LOCK
    -- =====================================================
    ('lead-knee-lock', 1, 'lesson', 'fix-locking-left-knee', null,                 null,                       true,  false, 'Keep the lead knee athletic through impact so rotation and strike can happen together.'),
    ('lead-knee-lock', 2, 'cue',    null,                    null,                 'pressure-into-lead-heel', true,  false, 'Pressure cue to soften and load the lead side.'),
    ('lead-knee-lock', 3, 'drill',  null,                    'snap-left-knee',     null,                       true,  false, 'Primary drill for lead-knee pattern correction.'),
    ('lead-knee-lock', 4, 'cue',    null,                    null,                 'maintain-spine-tilt',     true,  false, 'Keeps the player from straightening the leg and standing up.'),
    ('lead-knee-lock', 5, 'drill',  null,                    'impact-bag',         null,                       true,  false, 'Impact structure drill supporting flex and pressure left.'),
    ('lead-knee-lock', 6, 'cue',    null,                    null,                 'belt-buckle-at-target',   true,  false, 'Promotes rotation through the lead side instead of bracing on it.'),
    ('lead-knee-lock', 7, 'cue',    null,                    null,                 'keep-head-against-wall',  false, true,  'Bonus stability cue if the locked knee comes with loss of posture.')
) as x(unit_slug, item_order, item_type, lesson_slug, drill_slug, cue_slug, is_required, is_bonus, notes)
join public.curriculum_unit cu
  on cu.slug = x.unit_slug
left join public.lesson l
  on x.lesson_slug is not null and l.slug = x.lesson_slug
left join public.drill d
  on x.drill_slug is not null and d.slug = x.drill_slug
left join public.coaching_cue c
  on x.cue_slug is not null and c.slug = x.cue_slug
where cu.unit_type = 'corrective'
on conflict do nothing;

commit;
