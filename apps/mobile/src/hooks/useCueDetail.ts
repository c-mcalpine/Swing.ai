import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type CoachingCue = Database['public']['Tables']['coaching_cue']['Row'];
type SwingPhase = Database['public']['Tables']['swing_phase']['Row'];
type SwingMechanic = Database['public']['Tables']['swing_mechanic']['Row'];
type SwingError = Database['public']['Tables']['swing_error']['Row'];
type Drill = Database['public']['Tables']['drill']['Row'];
type CurriculumUnit = Database['public']['Tables']['curriculum_unit']['Row'];
type CurriculumUnitItemResolved =
  Database['public']['Views']['curriculum_unit_item_resolved']['Row'];

export interface CueDetail {
  cue: CoachingCue;
  phase: SwingPhase | null;
  mechanic: SwingMechanic | null;
  relatedErrors: SwingError[];
  relatedDrills: Drill[];
  curriculumContext: {
    unitId: number;
    unitName: string;
    siblingItems: CurriculumUnitItemResolved[];
  } | null;
}

export async function fetchCueDetail(cueId: number): Promise<CueDetail> {
  // 1. Fetch cue with joined phase + mechanic
  const { data: cueDataRaw, error: cueErr } = await supabase
    .from('coaching_cue')
    .select('*, swing_phase:phase_id(*), swing_mechanic:mechanic_id(*)')
    .eq('id', cueId)
    .single();

  if (cueErr) throw cueErr;

  const cueData = cueDataRaw as any;
  const phase = cueData.swing_phase as SwingPhase | null;
  const mechanic = cueData.swing_mechanic as SwingMechanic | null;
  // Strip the joined objects so cue matches the base Row type
  const cue: CoachingCue = {
    id: cueData.id,
    slug: cueData.slug,
    text: cueData.text,
    phase_id: cueData.phase_id ?? null,
    mechanic_id: cueData.mechanic_id ?? null,
    level: cueData.level ?? null,
    cue_type: cueData.cue_type ?? null,
    notes: cueData.notes ?? null,
  };

  // 2-4. Fetch errors, drills, and curriculum unit in parallel
  const [errorLinksRes, drillLinksRes, unitItemRes] = await Promise.all([
    supabase.from('cue_error').select('error_id').eq('cue_id', cueId),
    supabase.from('cue_drill').select('drill_id').eq('cue_id', cueId),
    supabase
      .from('curriculum_unit_item')
      .select('unit_id')
      .eq('cue_id', cueId)
      .limit(1)
      .maybeSingle(),
  ]);

  // Fetch error and drill details based on junction results
  const errorIds = (errorLinksRes.data ?? []).map((r: any) => r.error_id as number);
  const drillIds = (drillLinksRes.data ?? []).map((r: any) => r.drill_id as number);

  const [errorsRes, drillsRes] = await Promise.all([
    errorIds.length > 0
      ? supabase.from('swing_error').select('*').in('id', errorIds)
      : Promise.resolve({ data: [] as SwingError[], error: null }),
    drillIds.length > 0
      ? supabase.from('drill').select('*').in('id', drillIds)
      : Promise.resolve({ data: [] as Drill[], error: null }),
  ]);

  // Resolve curriculum context: unit name + sibling items
  let curriculumContext: CueDetail['curriculumContext'] = null;
  const unitRow = unitItemRes.data as { unit_id: number } | null;
  if (unitRow?.unit_id) {
    const unitId = unitRow.unit_id;
    const [unitRes, siblingRes] = await Promise.all([
      (supabase as any).from('curriculum_unit').select('*').eq('id', unitId).single(),
      supabase
        .from('curriculum_unit_item_resolved')
        .select('*')
        .eq('unit_id', unitId)
        .order('item_order', { ascending: true }),
    ]);
    if (!unitRes.error && unitRes.data) {
      curriculumContext = {
        unitId,
        unitName: (unitRes.data as unknown as CurriculumUnit).title,
        siblingItems: (siblingRes.data ?? []) as CurriculumUnitItemResolved[],
      };
    }
  }

  return {
    cue,
    phase: phase ?? null,
    mechanic: mechanic ?? null,
    relatedErrors: (errorsRes.data ?? []) as SwingError[],
    relatedDrills: (drillsRes.data ?? []) as Drill[],
    curriculumContext,
  };
}

export function useCueDetail(cueId: number | null) {
  return useQuery({
    queryKey: ['cueDetail', cueId],
    queryFn: () => fetchCueDetail(cueId!),
    enabled: cueId != null && cueId > 0,
    staleTime: 10 * 60 * 1000,
  });
}
