-- Allow 'cue' in review_completion and user_review_item so Smart Review can include cues.
-- Run after applying if you want cue in spaced repetition.

-- review_completion.item_type: drill | lesson | cue
ALTER TABLE public.review_completion
  DROP CONSTRAINT IF EXISTS review_completion_item_type_check;
ALTER TABLE public.review_completion
  ADD CONSTRAINT review_completion_item_type_check
  CHECK (item_type = ANY (ARRAY['drill'::text, 'lesson'::text, 'cue'::text]));

-- user_review_item.item_type: drill | lesson | cue
ALTER TABLE public.user_review_item
  DROP CONSTRAINT IF EXISTS user_review_item_item_type_check;
ALTER TABLE public.user_review_item
  ADD CONSTRAINT user_review_item_item_type_check
  CHECK (item_type = ANY (ARRAY['drill'::text, 'lesson'::text, 'cue'::text]));
