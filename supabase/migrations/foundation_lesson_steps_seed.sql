BEGIN;

-- Sync identity sequence so new rows get ids after existing ones (e.g. 43, 44, ...)
SELECT setval(
  pg_get_serial_sequence('public.lesson_step', 'id'),
  (SELECT COALESCE(max(id), 0) FROM public.lesson_step)
);

-- setup-fundamentals

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Why Setup Matters', 'Your setup is the first source of consistency in the golf swing. A good address position makes it easier to turn, stay in balance, return the club to the ball, and control low point. In this lesson you’ll build an athletic setup: proper ball position, stance width, balanced pressure, and enough knee flex to move freely.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'setup-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Ball Position Check', 'Set up to a stock shot and confirm the ball is matched to the club in your hand. With short irons the ball should be roughly centered; with longer clubs it moves progressively forward. The goal is to place the ball where the club can bottom out predictably without forcing a scooping or reaching motion.', NULL, 1, NULL, 4
FROM public.lesson l
WHERE l.slug = 'setup-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Stance Width Check', 'Your feet should create a stable but movable base. For most full swings, stance width is about shoulder width. Longer clubs can be slightly wider; wedges can be narrower. If the stance is too narrow you may sway and lose balance. If it is too wide you may restrict rotation and struggle to pressure shift cleanly.', NULL, 2, NULL, 4
FROM public.lesson l
WHERE l.slug = 'setup-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Pressure and Balance Check', 'At address, feel pressure centered over the middle of both feet rather than jammed into the toes or heels. For a stock shot, weight is approximately 50/50 between lead and trail side. This centered pressure creates a neutral starting point for both backswing loading and downswing shift.', NULL, 4, NULL, 4
FROM public.lesson l
WHERE l.slug = 'setup-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'checkpoint', 'Athletic Knee Flex', 'Add a small amount of knee flex so you look athletic, not rigid. Knees should be softly bent, never locked, but not deeply squatted. The purpose is to support balance and rotation while keeping your weight centered over mid-foot.', NULL, 8, NULL, 3
FROM public.lesson l
WHERE l.slug = 'setup-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Setup Snapshot', 'Before every practice session, rehearse this setup sequence: ball position, stance width, weight centered, knees soft. The checkpoint for success is simple: you feel balanced, athletic, and able to turn without strain before the club ever moves.', NULL, 4, NULL, 3
FROM public.lesson l
WHERE l.slug = 'setup-fundamentals';

-- alignment-grip-clubface

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Build a Square Starting Picture', 'Even a good athletic stance will not help much if your alignment, clubface, or grip are fighting each other. This lesson gives you a clean starting picture: feet aligned to the target line, clubface square, grip neutral enough to control the face, and shaft lean matched to the club.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'alignment-grip-clubface';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Feet Alignment Check', 'Lay a club or imagine a rail on the ground aimed at the target. Your feet should generally be parallel to that line rather than pointed directly at it. A square setup gives your body and club a neutral starting orientation.', NULL, 3, NULL, 4
FROM public.lesson l
WHERE l.slug = 'alignment-grip-clubface';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Clubface Check', 'Place the clubface directly behind the ball and square to the target line. For a stock shot, avoid setting it open or closed to compensate for fear of a miss. Let the swing produce the shot rather than building compensation in before you start.', NULL, 5, NULL, 4
FROM public.lesson l
WHERE l.slug = 'alignment-grip-clubface';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Grip Check', 'Build your grip so the club sits more in the fingers than the palm, with a neutral hold that lets you manage the face without excessive manipulation. The grip should feel secure but not strangled. Your hands are your only connection to the club, so this step deserves repetition.', NULL, 6, NULL, 4
FROM public.lesson l
WHERE l.slug = 'alignment-grip-clubface';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'checkpoint', 'Shaft Lean Match-Up', 'At address, your handle should usually be slightly ahead of the ball with irons, creating modest forward shaft lean. With a driver, lean is more neutral because the ball is teed forward and the strike pattern is different. Match the setup to the club, not one universal picture.', NULL, 7, NULL, 4
FROM public.lesson l
WHERE l.slug = 'alignment-grip-clubface';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Square the Start', 'Your pre-shot setup check becomes: feet parallel, clubface square, grip neutral, shaft lean appropriate for the club. If these pieces are clean, you give the rest of the swing a fair chance to work.', NULL, 7, NULL, 3
FROM public.lesson l
WHERE l.slug = 'alignment-grip-clubface';

-- posture-upper-body

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Create Posture You Can Turn Around', 'Good posture gives your arms space to hang, your torso room to rotate, and your balance a chance to stay centered. Bad posture forces compensation later. This lesson covers hip hinge, neutral spine, shoulder tilt, and chin position.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-upper-body';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Forward Bend from the Hips', 'Tilt forward from the hips rather than rounding from the waist. Your arms should hang naturally under your shoulders with enough space from the ball that the club can sole properly. This forward bend creates room for hand path and rotation.', NULL, 9, NULL, 4
FROM public.lesson l
WHERE l.slug = 'posture-upper-body';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Neutral Spine Check', 'Keep your spine mostly neutral rather than rounded into a C-shape or overarched into an S-shape. A neutral spine lets your body rotate efficiently and reduces the urge to stand up through impact.', NULL, 10, NULL, 4
FROM public.lesson l
WHERE l.slug = 'posture-upper-body';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Shoulder Tilt Check', 'At address, the trail shoulder should sit slightly lower than the lead shoulder because your trail hand is lower on the club. This subtle tilt helps create a more natural backswing and better attack pattern.', NULL, 11, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-upper-body';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'checkpoint', 'Chin Position Check', 'Keep your chin up enough to let your lead shoulder turn underneath it. If the chin is buried into the chest, you restrict turn and often force compensations in the arms and posture.', NULL, 12, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-upper-body';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Posture Checklist', 'Your address posture should feel athletic and easy to maintain: hinge from the hips, spine neutral, trail shoulder slightly lower, chin out of the way. If you can hold this picture comfortably for a few seconds, it is usually a good sign.', NULL, 10, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-upper-body';

-- one-piece-fundamentals

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Start the Swing Without Snatching It Away', 'The takeaway sets the geometry for the rest of the motion. If the club gets too far inside, too far outside, or the hands become overly active immediately, you spend the rest of the swing recovering. This lesson teaches a one-piece takeaway driven by the trunk and shoulders.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'one-piece-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Club Path at P2', 'When the shaft is roughly parallel to the ground in the takeaway, the club should be in front of your chest rather than trapped behind you or shoved outside your hands. This position creates a neutral platform for the rest of the backswing.', NULL, 13, NULL, 4
FROM public.lesson l
WHERE l.slug = 'one-piece-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Body-Driven Start', 'The club should begin moving because your chest, shoulders, and arms move together, not because your hands roll the face open or pick the club up abruptly. Think: torso starts, club follows.', NULL, 24, NULL, 3
FROM public.lesson l
WHERE l.slug = 'one-piece-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'drill', 'One-Piece Takeaway Drill', 'Use Drill 1 – One-Piece Takeaway Drill. Choke down on the shaft and rehearse takeaways where your trunk starts the motion, the butt end of the club continues to point toward your midsection, and the wrists stay quiet until roughly hip height. This is the cleanest way to feel the club, arms, and torso move together.', 1, 13, NULL, 8
FROM public.lesson l
WHERE l.slug = 'one-piece-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Square Takeaway Drill', 'Use Drill 2 – Square Takeaway Drill as a visual calibration. Rehearse the takeaway to hip height and confirm the club is moving back square rather than getting sucked inside early. Blend this visual with the body-driven feel from the previous step.', 2, 13, NULL, 7
FROM public.lesson l
WHERE l.slug = 'one-piece-fundamentals';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Takeaway Blend', 'Your checkpoint for success is that the club stays in front of your chest, the hands remain quiet early, and the takeaway looks calm rather than manipulative. If the start is clean, the rest of the swing becomes much easier to organize.', NULL, 13, NULL, 3
FROM public.lesson l
WHERE l.slug = 'one-piece-fundamentals';

-- clubface-control

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Control the Face Early', 'A lot of players think only about path in the takeaway, but clubface orientation matters just as much. If the face gets dramatically rolled open or shut in the first few feet, compensation usually follows. This lesson keeps the face organized while the club travels back on a neutral path.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'clubface-control';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Clubface Orientation at P2', 'Pause at shaft-parallel in the takeaway. The face should look organized relative to your spine and forearm structure rather than rolled wide open or aggressively hooded shut. The exact appearance varies, but the goal is stable, not manipulated.', NULL, 14, NULL, 4
FROM public.lesson l
WHERE l.slug = 'clubface-control';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Path and Face Together', 'Path and face work together. A decent face with a bad path still creates compensation, and vice versa. Make sure the club is not only oriented correctly, but also remains in front of your chest as it moves back.', NULL, 13, NULL, 3
FROM public.lesson l
WHERE l.slug = 'clubface-control';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'drill', 'Square Takeaway Rehearsals', 'Use Drill 2 – Square Takeaway Drill. Make repeated rehearsals to hip height and focus on keeping both the club path and clubface organized. This builds awareness of the first two feet of the swing without overwhelming you with full-motion thoughts.', 2, 14, NULL, 7
FROM public.lesson l
WHERE l.slug = 'clubface-control';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Backswing Position Check', 'Use Drill 4 – Proper Club Position Backswing Drill to reinforce how the club should look once the takeaway is complete and the club begins to travel upward. This helps connect a good P2 to a good continuation of the backswing.', 4, 13, NULL, 7
FROM public.lesson l
WHERE l.slug = 'clubface-control';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Organized First Two Feet', 'In live swings, the checkpoint is simple: calm start, club in front of chest, face not wildly rolled. If these hold, you are building a much more reliable route to the top.', NULL, 14, NULL, 3
FROM public.lesson l
WHERE l.slug = 'clubface-control';

-- arm-structure-body-stability

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Build Structure in the Backswing', 'The backswing should create width, coil, and pressure without collapsing your structure. This lesson teaches you to keep a solid lead arm, preserve functional knee action, and create a backswing that stores rather than wastes motion.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'arm-structure-body-stability';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Lead Arm Structure', 'Your lead arm should remain mostly straight during the backswing. It does not need to be rigid, but it should provide width rather than collapsing early. A straighter lead arm helps maintain radius and keeps the club from wandering.', NULL, 15, NULL, 4
FROM public.lesson l
WHERE l.slug = 'arm-structure-body-stability';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Trail Knee Flex', 'As you turn back, preserve some flex in the trail knee. Locking it out can flatten the hip turn, encourage sway, and make it harder to load into the trail side athletically.', NULL, 17, NULL, 4
FROM public.lesson l
WHERE l.slug = 'arm-structure-body-stability';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Lead Knee Direction', 'The lead knee should work inward naturally as you turn, not collapse wildly toward the ball or lock rigidly in place. Functional lead-knee movement helps your pelvis and torso coil together.', NULL, 18, NULL, 4
FROM public.lesson l
WHERE l.slug = 'arm-structure-body-stability';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Upper Body Rotation Drill', 'Use Drill 5 – Proper Upper Body Rotation Drill. Place a club across your shoulders and rehearse turning to the top while keeping your knees functional and your structure intact. This drill is especially good for feeling how the body coils without unnecessary sway or collapse.', 5, 19, NULL, 8
FROM public.lesson l
WHERE l.slug = 'arm-structure-body-stability';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Width and Coil Check', 'A good backswing should feel wide and coiled rather than narrow and collapsed. If your lead arm stays structured and your knees remain athletic, you are building a reliable top-of-swing foundation.', NULL, 15, NULL, 3
FROM public.lesson l
WHERE l.slug = 'arm-structure-body-stability';

-- backswing-turn-pressure-load

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Turn, Don’t Slide', 'A powerful backswing is built on rotation and pressure shift, not sway. This lesson teaches how the hips should turn, how to avoid sliding off the ball, and how to load pressure into the trail side.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Hip Rotation', 'Your hips should rotate during the backswing instead of staying frozen. This rotation supports the torso turn and helps you store energy without forcing the arms to do everything alone.', NULL, 19, NULL, 4
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Turn Versus Sway', 'The pelvis should turn rather than drifting laterally away from the target. Excessive sway makes it harder to re-center and strike the ball consistently. The feel should be coil, not slide.', NULL, 20, NULL, 4
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Trail-Side Pressure Load', 'As the backswing develops, feel pressure move into the inside of the trail foot. This is a loaded, athletic trail side, not a collapse onto the outside edge of the foot.', NULL, 22, NULL, 4
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Upper Body Rotation Drill', 'Use Drill 5 – Proper Upper Body Rotation Drill to coordinate your turn and trail-side load. The goal is a coiled backswing where the body turns around a stable center rather than drifting off the ball.', 5, 19, NULL, 7
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'drill', 'Weight Transfer Drill', 'Use Drill 9 – Weight Transfer Drill to exaggerate the correct loading pattern: into the trail side in the backswing, then forward later in the downswing. In this lesson, focus especially on the backswing load portion.', 9, 22, NULL, 7
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 7, 'review', 'Coil Into the Trail Side', 'A solid checkpoint is that you feel loaded into the inside of the trail foot while your pelvis has turned, not slid. That combination sets up a much easier transition.', NULL, 22, NULL, 3
FROM public.lesson l
WHERE l.slug = 'backswing-turn-pressure-load';

-- head-control-tempo

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Keep the Backswing Organized', 'The backswing does not need to be rushed or overcomplicated. A stable head, controlled tempo, and sensible sequence let the club arrive at the top in a position you can actually use. This lesson organizes those moving parts.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'head-control-tempo';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Head Stability', 'Your head should remain relatively stable during the backswing rather than drifting dramatically toward or away from the target. Small movement is normal; wild movement usually creates strike and balance problems.', NULL, 21, NULL, 4
FROM public.lesson l
WHERE l.slug = 'head-control-tempo';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Backswing Tempo', 'The backswing should feel smooth and measured, not hurried. Rushing back often destroys width, sequence, and face control before the downswing even begins.', NULL, 23, NULL, 3
FROM public.lesson l
WHERE l.slug = 'head-control-tempo';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Kinematic Sequence Feel', 'Even in the backswing, the motion should feel coordinated rather than segmented. The body, arms, and club should move in an organized chain rather than with abrupt hand snatching or disconnected pieces.', NULL, 24, NULL, 3
FROM public.lesson l
WHERE l.slug = 'head-control-tempo';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'One-Piece Sequence Rehearsal', 'Use Drill 1 – One-Piece Takeaway Drill as a sequencing rehearsal. Even though it begins in the takeaway, it reinforces the calm, connected start that leads to a better backswing structure and overall rhythm.', 1, 24, NULL, 7
FROM public.lesson l
WHERE l.slug = 'head-control-tempo';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Calm to the Top', 'Your backswing should look and feel calmer than you think. Stable head, unhurried tempo, connected movement. If those are present, you are much more likely to arrive at the top in control.', NULL, 23, NULL, 3
FROM public.lesson l
WHERE l.slug = 'head-control-tempo';

-- wrist-set-top-position

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Complete the Wrist Set Without Manipulating It', 'At the top of the swing, the wrists should be set enough to support speed and structure, but not forced into a sloppy, disconnected shape. This lesson covers lead wrist orientation and full wrist hinge.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'wrist-set-top-position';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Lead Wrist Orientation', 'At the top, your lead wrist should be in a strong, organized condition rather than dramatically cupped or collapsed. A stable lead wrist helps control the face and supports a cleaner delivery.', NULL, 25, NULL, 4
FROM public.lesson l
WHERE l.slug = 'wrist-set-top-position';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Full Wrist Hinge', 'By the time you reach the top, your wrists should be fully hinged. The hinge should build naturally during the backswing rather than appearing all at once late or being thrown in immediately from the start.', NULL, 26, NULL, 4
FROM public.lesson l
WHERE l.slug = 'wrist-set-top-position';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'drill', 'Right Hand at the Top Drill', 'Use Drill 8 – Proper Right Hand Position at the Top Drill. Rehearse the top position and notice whether the trail wrist and hand look supportive and organized. This drill is a practical way to feel a complete, functional wrist set.', 8, 26, NULL, 8
FROM public.lesson l
WHERE l.slug = 'wrist-set-top-position';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'review', 'Strong Top Structure', 'At the top, the club should feel supported, not floppy. Your checkpoint is a stable lead wrist, complete hinge, and a top position that feels loaded rather than loose.', NULL, 26, NULL, 3
FROM public.lesson l
WHERE l.slug = 'wrist-set-top-position';

-- shaft-top-structure

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Organize the Club at the Top', 'A usable top-of-swing position gives you a chance to transition well. This lesson focuses on where the shaft points, how high it sits, whether you preserve posture, and how fully you complete the turn.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Shaft Direction at the Top', 'At the top, the shaft should point in a direction that matches an efficient backswing rather than being dramatically laid off or across the line. This is one of the clearest top-of-swing checkpoints you can film and review.', NULL, 27, NULL, 4
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Shaft Height at the Top', 'The shaft should also sit at a sensible height relative to your shoulder plane. Too steep or too flat at the top can force compensation on the way down.', NULL, 28, NULL, 4
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Preserve Spine Angle and Complete Turn', 'At the top, you should still look like you are in your posture rather than having stood up excessively. At the same time, your back should be substantially turned away from the target, showing that the coil is complete.', NULL, 29, NULL, 3
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'checkpoint', 'Back Facing the Target', 'Use your turn as a reference. A reasonably complete backswing usually shows your back turned toward the target. This does not require overswinging, just enough coil to store energy.', NULL, 30, NULL, 3
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'drill', 'On-Plane Backswing Drill', 'Use Drill 3 – Proper On-Plane Backswing Drill to check how the club is traveling up into the top position. This helps calibrate the route to a better top-of-swing structure.', 3, 28, NULL, 7
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 7, 'drill', 'Top Position Direction and Height', 'Use Drill 6 – Proper Club Position at the Top and Drill 7 – Proper Club Direction at the Top to fine-tune both shaft height and shaft direction. These are direct visual rehearsals for a cleaner top-of-swing picture.', 6, 28, NULL, 5
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 8, 'drill', 'Shaft Direction Confirmation', 'Rehearse Drill 7 – Proper Club Direction at the Top again with a filming check or mirror if available. The goal is for the shaft to point where you intend, not where compensation has taken it.', 7, 27, NULL, 5
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 9, 'review', 'Usable Top Position', 'A solid top position preserves posture, completes the turn, and puts the shaft in a direction and height you can deliver from. That is the standard for this lesson.', NULL, 27, NULL, 3
FROM public.lesson l
WHERE l.slug = 'shaft-top-structure';

-- transition-sequence-top

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Start Down in the Right Order', 'Transition is where many swings become unglued. A good backswing can still be wasted if the first move down is a shoulder spin, cast, or hang-back. This lesson teaches a better start to the downswing: hold the wrist hinge, let the hips begin unwinding, and shift pressure into the lead side.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Maintain Wrist Hinge Early', 'As you begin the downswing, preserve your wrist hinge rather than throwing it away immediately. Early loss of angle usually costs both path and speed.', NULL, 31, NULL, 4
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Hips Start the Move', 'The first move down should involve the lower body beginning to unwind rather than the shoulders ripping open instantly. This sequence gives the club time to shallow and the body time to organize.', NULL, 32, NULL, 4
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Pressure Moves Lead', 'Very early in transition, pressure should begin shifting toward the lead foot. This shift helps set up a stable strike instead of hanging back on the trail side.', NULL, 35, NULL, 4
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Snap Your Left Knee Drill', 'Use Drill 12 – Snap your Left Knee Drill to feel the lower body beginning the downswing. This drill exaggerates the sense that the hips and lower body lead rather than the club being thrown from the top.', 12, 32, NULL, 8
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'drill', 'Weight Transfer Rehearsal', 'Use Drill 9 – Weight Transfer Drill, now focusing on the move from loaded trail side into the lead side as transition begins. Pair this with the feeling that the wrist hinge stays intact early.', 9, 35, NULL, 7
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 7, 'review', 'Ground-Up Start', 'Your transition should feel more like pressure shift and unwind than throw and spin. If the wrists keep their angle briefly, the hips begin first, and pressure moves lead, you are on the right track.', NULL, 32, NULL, 3
FROM public.lesson l
WHERE l.slug = 'transition-sequence-top';

-- plane-path-downswing

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Deliver the Club on a Playable Route', 'The downswing needs a route the club can repeat. This lesson focuses on keeping the hips in space and delivering the club on an inside-square-inside path rather than wiping across the ball.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'plane-path-downswing';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Hips Stay in the Box', 'As you start down, your hips should rotate rather than lunging toward the ball. If the pelvis loses depth too early, you often stand up and throw the path off.', NULL, 33, NULL, 4
FROM public.lesson l
WHERE l.slug = 'plane-path-downswing';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Inside-Square-Inside Path', 'A playable full-swing path approaches from the inside, returns to square through impact, and exits back inside. You do not need to force an exaggerated path; you need a neutral, repeatable one.', NULL, 34, NULL, 4
FROM public.lesson l
WHERE l.slug = 'plane-path-downswing';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'drill', 'Correct Path Downswing Drill', 'Use Drill 10 – Correct Path Downswing Drill. This gives you a visual checkpoint for how the club is traveling in the downswing and helps you confirm that the path is not cutting across the target line.', 10, 34, NULL, 8
FROM public.lesson l
WHERE l.slug = 'plane-path-downswing';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Anti Over-the-Top Drill', 'Use Drill 11 – Anti Over-the-Top Drill to feel the trail elbow and club shallow into a more neutral slot instead of being thrown outside the hands. This is one of the fastest ways to clean up an across-the-ball pattern.', 11, 34, NULL, 8
FROM public.lesson l
WHERE l.slug = 'plane-path-downswing';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Neutral Delivery', 'In live swings, your checkpoint is that the club approaches from a manageable route while your body keeps rotating. Better path usually produces straighter start lines and more centered contact.', NULL, 34, NULL, 3
FROM public.lesson l
WHERE l.slug = 'plane-path-downswing';

-- pressure-shift-speed

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Move Pressure Forward and Accelerate at the Right Time', 'The downswing should not only be on-plane; it should also be dynamic. This lesson teaches you to get pressure into the lead side and make the downswing faster than the backswing without rushing the transition.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'pressure-shift-speed';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Lead-Side Pressure Shift', 'By the downswing, pressure should be moving into the lead foot. This helps stabilize low point, speed transfer, and balance through the strike.', NULL, 35, NULL, 4
FROM public.lesson l
WHERE l.slug = 'pressure-shift-speed';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Downswing Faster Than Backswing', 'The swing is a sequence of gathering and releasing energy. The backswing is typically smoother and slower; the downswing should be the faster, committed side of the motion.', NULL, 36, NULL, 3
FROM public.lesson l
WHERE l.slug = 'pressure-shift-speed';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'drill', 'Weight Transfer Drill', 'Use Drill 9 – Weight Transfer Drill to feel the full pressure movement from trail side to lead side. In this lesson, focus on the forward move and the finish on the lead side.', 9, 35, NULL, 8
FROM public.lesson l
WHERE l.slug = 'pressure-shift-speed';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Snap Your Left Knee Drill', 'Blend Drill 12 – Snap your Left Knee Drill with the pressure shift. This helps the body feel committed and directional in the downswing rather than passive or stalled.', 12, 35, NULL, 7
FROM public.lesson l
WHERE l.slug = 'pressure-shift-speed';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Forward and Through', 'A good downswing feel is pressure moving forward while speed builds through the ball. If you are still hanging back or decelerating into impact, revisit the drills before adding speed.', NULL, 36, NULL, 3
FROM public.lesson l
WHERE l.slug = 'pressure-shift-speed';

-- compression-hands-first

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Create a Strong Impact Picture', 'For iron play especially, good impact usually means the handle leads, the clubhead lags behind slightly, and the strike bottoms out in front of the ball. This lesson teaches the basics of compression and low-point control.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'compression-hands-first';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Hands Ahead at Impact', 'At impact with an iron, the hands should generally be ahead of the ball and clubhead. This creates forward shaft lean and helps produce a compressed, descending strike.', NULL, 37, NULL, 4
FROM public.lesson l
WHERE l.slug = 'compression-hands-first';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Attack Pattern by Club', 'With irons, the club should generally be moving downward into the ball; with woods and driver, the strike pattern differs. Match your impact picture to the club rather than using one strike intention for every shot.', NULL, 42, NULL, 4
FROM public.lesson l
WHERE l.slug = 'compression-hands-first';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'drill', 'Impact Bag Drill', 'Use Drill 13 – Impact Bag Drill to feel weight lead-side, firm lead wrist, and handle-first delivery. Freeze in the impact bag position to memorize what a strong strike feels like.', 13, 37, NULL, 8
FROM public.lesson l
WHERE l.slug = 'compression-hands-first';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Static Press Drill', 'Use Drill 14 – Static Press Drill to exaggerate a powerful impact geometry. This helps you feel how much stronger the position is when the handle leads and the body supports the strike.', 14, 37, NULL, 7
FROM public.lesson l
WHERE l.slug = 'compression-hands-first';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Ball Then Turf', 'Your iron-strike checkpoint is simple: hands ahead, pressure lead-side, and turf interaction after the ball rather than before it. This is the core of compression.', NULL, 42, NULL, 3
FROM public.lesson l
WHERE l.slug = 'compression-hands-first';

-- posture-squareness-impact

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Stay in the Strike', 'Impact is not just about the hands. You also need functional leg structure, rotational square-up, posture retention, and a stable head picture. This lesson covers the body conditions that support a repeatable strike.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Lead Knee Flex at Impact', 'As you approach and move through impact, the lead leg should be working, not collapsing and not freezing into a poor shape. Functional lead-knee flex helps the body absorb and redirect force.', NULL, 38, NULL, 4
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Square Up the Body', 'At impact, your hips and hands should be returning to a playable square-to-target condition. This is not a static pose, but a moving alignment that supports start line and face control.', NULL, 39, NULL, 4
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Maintain Spine Angle', 'As you strike the ball, preserve your posture instead of standing up out of it. Losing spine angle early is one of the fastest ways to lose both path and strike quality.', NULL, 40, NULL, 4
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'checkpoint', 'Head Stability Through Strike', 'The head should remain functionally stable through impact rather than jerking up early to chase the ball flight. Let the strike happen before the eyes fully follow it.', NULL, 41, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'drill', 'Impact Bag Position Rehearsal', 'Use Drill 13 – Impact Bag Drill again, this time paying special attention not only to shaft lean but also to body organization: lead-side support, square-up through the hit, and posture retained as the club meets the bag.', 13, 39, NULL, 7
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 7, 'review', 'Stable Through Contact', 'A playable impact picture combines structure and motion: lead-side support, body squaring, posture retained, and head stable enough to let contact happen cleanly.', NULL, 40, NULL, 3
FROM public.lesson l
WHERE l.slug = 'posture-squareness-impact';

-- release-through-ball

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Let the Club Release, Don’t Hold It Off or Throw It Away', 'After impact, the club should keep moving as your body rotates and the arms extend. This lesson covers spine tilt through release, arm extension, forearm roll, and the natural continuation of path after strike.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Maintain Spine Tilt Through Release', 'As the club moves past impact, retain enough tilt and side-bend to keep the release organized. Standing up abruptly can throw off both strike and follow-through.', NULL, 43, NULL, 4
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Arm Extension Through Release', 'Through and just after impact, the arms should extend rather than collapse immediately. Extension helps keep the strike moving through the ball instead of quitting on it.', NULL, 44, NULL, 4
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Forearm Roll and Hand Release', 'Allow the forearms and hands to release naturally so the clubface can rotate through the hitting area. This is not a frantic flip, but it also is not a frozen hold-off.', NULL, 45, NULL, 4
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'checkpoint', 'Path Continues After Contact', 'The club should continue on an inside-square-inside arc as the body rotates through. The release is part of the swing’s ongoing motion, not an abrupt stop after impact.', NULL, 46, NULL, 3
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'drill', 'Arm Rotation Drill', 'Use Drill 15 – Proper Arm Rotation Drill to feel how the arms and forearms should rotate through the release while the body keeps moving.', 15, 45, NULL, 7
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 7, 'drill', 'Hand Rotation Drill', 'Use Drill 16 – Proper Hand Rotation Drill to refine how the clubface is released through the hitting area without scooping or stalling.', 16, 45, NULL, 7
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 8, 'review', 'Through, Not At', 'A strong release feels like the swing is moving through the ball rather than hitting at it and stopping. Extension, rotation, and a natural release are your checkpoints.', NULL, 44, NULL, 3
FROM public.lesson l
WHERE l.slug = 'release-through-ball';

-- balanced-finish

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 1, 'intro', 'Finish the Swing Under Control', 'The finish is not cosmetic. It is evidence of whether your swing stayed organized all the way through. A balanced, completed finish usually means your pressure shifted correctly and your body kept rotating.', NULL, NULL, NULL, 3
FROM public.lesson l
WHERE l.slug = 'balanced-finish';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 2, 'checkpoint', 'Hips Face the Target', 'By the finish, your hips should have rotated through so the belt buckle and pelvis are facing the target area. A stalled lower body rarely produces a complete finish.', NULL, 47, NULL, 4
FROM public.lesson l
WHERE l.slug = 'balanced-finish';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 3, 'checkpoint', 'Complete the Follow-Through', 'The swing should continue into a full finish rather than quitting after impact. A complete follow-through shows that speed and rotation were allowed to continue rather than being shut down.', NULL, 48, NULL, 4
FROM public.lesson l
WHERE l.slug = 'balanced-finish';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 4, 'checkpoint', 'Finish Balanced on the Lead Side', 'At the end of the swing, most of your pressure should be on the lead side, with the trail foot up on the toe. If you cannot hold the finish, something earlier usually broke down.', NULL, 49, NULL, 4
FROM public.lesson l
WHERE l.slug = 'balanced-finish';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 5, 'drill', 'Proper Follow Through Drill', 'Use Drill 17 – Proper Follow Through Drill to rehearse a full, balanced finish with the body continuing to rotate all the way through.', 17, 48, NULL, 8
FROM public.lesson l
WHERE l.slug = 'balanced-finish';

INSERT INTO public.lesson_step (lesson_id, step_order, step_type, title, body, drill_id, mechanic_id, error_id, estimated_min)
SELECT l.id, 6, 'review', 'Hold the Finish', 'A clean finish is one of the simplest self-tests in golf. If you can hold it under control on your lead side, there is a good chance your sequence, pressure shift, and release all worked much better.', NULL, 49, NULL, 3
FROM public.lesson l
WHERE l.slug = 'balanced-finish';

COMMIT;