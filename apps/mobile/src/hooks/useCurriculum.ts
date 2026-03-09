import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

type CurriculumTrack = Database['public']['Tables']['curriculum_track']['Row'];
type CurriculumUnit = Database['public']['Tables']['curriculum_unit']['Row'];
type CurriculumUnitItemResolved =
  Database['public']['Views']['curriculum_unit_item_resolved']['Row'];
type CurriculumUnitMechanic =
  Database['public']['Tables']['curriculum_unit_mechanic']['Row'];
type UserCurriculumUnit = Database['public']['Tables']['user_curriculum_unit']['Row'];
type UserCurriculumUnitItem = Database['public']['Tables']['user_curriculum_unit_item']['Row'];

export type SwingMechanicBasic = {
  id: number;
  name: string;
  slug: string;
  description_short: string | null;
};

export type UnitMechanicWithDetail = CurriculumUnitMechanic & {
  swing_mechanic: SwingMechanicBasic | null;
};

export type TrackWithUnits = CurriculumTrack & {
  units: CurriculumUnit[];
};

export type UnitDetail = CurriculumUnit & {
  items: CurriculumUnitItemResolved[];
  mechanics: UnitMechanicWithDetail[];
};

const fetchCurriculum = async (): Promise<TrackWithUnits[]> => {
  const [tracksRes, unitsRes] = await Promise.all([
    supabase
      .from('curriculum_track')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('curriculum_unit')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (tracksRes.error) throw tracksRes.error;
  if (unitsRes.error) throw unitsRes.error;

  const tracks = (tracksRes.data ?? []) as CurriculumTrack[];
  const units = (unitsRes.data ?? []) as CurriculumUnit[];

  return tracks.map((track) => ({
    ...track,
    units: units.filter((u) => u.track_id === track.id),
  }));
};

const fetchUnitDetail = async (unitId: number): Promise<UnitDetail> => {
  const [unitRes, itemsRes, mechanicsRes] = await Promise.all([
    supabase.from('curriculum_unit').select('*').eq('id', unitId).single(),
    supabase
      .from('curriculum_unit_item_resolved')
      .select('*')
      .eq('unit_id', unitId)
      .order('item_order', { ascending: true }),
    supabase
      .from('curriculum_unit_mechanic')
      .select('*, swing_mechanic:mechanic_id(id, name, slug, description_short)')
      .eq('unit_id', unitId)
      .order('weight', { ascending: false }),
  ]);

  if (unitRes.error) throw unitRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (mechanicsRes.error) throw mechanicsRes.error;

  return {
    ...(unitRes.data as CurriculumUnit),
    items: (itemsRes.data ?? []) as CurriculumUnitItemResolved[],
    mechanics: (mechanicsRes.data ?? []) as UnitMechanicWithDetail[],
  };
};

export function useCurriculumQuery() {
  return useQuery({
    queryKey: ['curriculum'],
    queryFn: fetchCurriculum,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUnitDetailQuery(unitId: number | null) {
  return useQuery({
    queryKey: ['unitDetail', unitId],
    queryFn: () => fetchUnitDetail(unitId!),
    enabled: unitId != null,
    staleTime: 5 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────
// My Plan (personalized roadmap)
// ─────────────────────────────────────────────

export type PlanItemWithProgress = {
  item: CurriculumUnitItemResolved;
  progress: UserCurriculumUnitItem | null;
};

export type LessonGroup = {
  lesson: CurriculumUnitItemResolved;
  lessonProgress: UserCurriculumUnitItem | null;
  children: PlanItemWithProgress[];
};

export type PlanUnit = {
  unit: CurriculumUnit;
  userUnit: UserCurriculumUnit;
  lessonGroups: LessonGroup[];
  // pre-pended items before the first lesson (intro drills/cues)
  introItems: PlanItemWithProgress[];
};

function groupByLesson(
  items: CurriculumUnitItemResolved[],
  progressMap: Map<number, UserCurriculumUnitItem>,
): { introItems: PlanItemWithProgress[]; lessonGroups: LessonGroup[] } {
  const introItems: PlanItemWithProgress[] = [];
  const lessonGroups: LessonGroup[] = [];
  let currentGroup: LessonGroup | null = null;

  for (const item of items) {
    const progress = progressMap.get(item.id) ?? null;
    if (item.item_type === 'lesson') {
      currentGroup = { lesson: item, lessonProgress: progress, children: [] };
      lessonGroups.push(currentGroup);
    } else {
      if (currentGroup) {
        currentGroup.children.push({ item, progress });
      } else {
        introItems.push({ item, progress });
      }
    }
  }

  return { introItems, lessonGroups };
}

const fetchMyPlan = async (userId: string): Promise<PlanUnit[]> => {
  // Step 1: fetch user's assigned units with embedded curriculum_unit
  const { data: userUnitsRaw, error: userUnitsErr } = await supabase
    .from('user_curriculum_unit')
    .select('*, curriculum_unit:unit_id(*)')
    .eq('user_id', userId)
    .order('priority_score', { ascending: false });

  if (userUnitsErr) throw userUnitsErr;
  if (!userUnitsRaw || userUnitsRaw.length === 0) return [];

  const userUnits = userUnitsRaw as (UserCurriculumUnit & { curriculum_unit: CurriculumUnit })[];
  const unitIds = userUnits.map((u) => u.unit_id);

  // Step 2: fetch all items + user progress in parallel
  const [itemsRes, progressRes] = await Promise.all([
    supabase
      .from('curriculum_unit_item_resolved')
      .select('*')
      .in('unit_id', unitIds)
      .order('item_order', { ascending: true }),
    supabase
      .from('user_curriculum_unit_item')
      .select('*')
      .eq('user_id', userId),
  ]);

  if (itemsRes.error) throw itemsRes.error;
  if (progressRes.error) throw progressRes.error;

  const allItems = (itemsRes.data ?? []) as CurriculumUnitItemResolved[];
  const allProgress = (progressRes.data ?? []) as UserCurriculumUnitItem[];

  // progress keyed by unit_item_id (which maps to curriculum_unit_item_resolved.id)
  const progressMap = new Map<number, UserCurriculumUnitItem>(
    allProgress.map((p) => [p.unit_item_id, p]),
  );

  // Group items per unit, then group within each unit by lesson
  const itemsByUnit = new Map<number, CurriculumUnitItemResolved[]>();
  for (const item of allItems) {
    if (!itemsByUnit.has(item.unit_id)) itemsByUnit.set(item.unit_id, []);
    itemsByUnit.get(item.unit_id)!.push(item);
  }

  return userUnits.map((uu) => {
    const unitItems = itemsByUnit.get(uu.unit_id) ?? [];
    const { introItems, lessonGroups } = groupByLesson(unitItems, progressMap);
    return {
      unit: uu.curriculum_unit,
      userUnit: uu as unknown as UserCurriculumUnit,
      lessonGroups,
      introItems,
    };
  });
};

export function useMyPlanQuery(userId: string | null) {
  return useQuery({
    queryKey: ['myPlan', userId],
    queryFn: () => fetchMyPlan(userId!),
    enabled: userId != null,
    staleTime: 2 * 60 * 1000,
  });
}
