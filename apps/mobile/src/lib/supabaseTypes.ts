export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      coaching_cue: {
        Row: {
          id: number
          slug: string
          text: string
          phase_id: number | null
          mechanic_id: number | null
          level: number | null
          cue_type: string | null
          notes: string | null
        }
        Insert: {
          slug: string
          text: string
          phase_id?: number | null
          mechanic_id?: number | null
          level?: number | null
          cue_type?: string | null
          notes?: string | null
        }
        Update: {
          slug?: string
          text?: string
          phase_id?: number | null
          mechanic_id?: number | null
          level?: number | null
          cue_type?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      cue_drill: {
        Row: {
          cue_id: number
          drill_id: number
        }
        Insert: {
          cue_id: number
          drill_id: number
        }
        Update: {
          cue_id?: number
          drill_id?: number
        }
        Relationships: []
      }
      cue_error: {
        Row: {
          cue_id: number
          error_id: number
        }
        Insert: {
          cue_id: number
          error_id: number
        }
        Update: {
          cue_id?: number
          error_id?: number
        }
        Relationships: []
      }
      drill: {
        Row: {
          id: number
          slug: string
          name: string
          objective: string | null
          description: string | null
          tips: string | null
          difficulty: number | null
          min_duration_min: number | null
          environment: string | null
          equipment: string | null
          xp_reward: number | null
          is_beginner_friendly: boolean | null
          verification_type: 'none' | 'reps' | 'hold' | 'timer'
          verification_config: Json | null
        }
        Insert: {
          slug: string
          name: string
          objective?: string | null
          description?: string | null
          tips?: string | null
          difficulty?: number | null
          min_duration_min?: number | null
          environment?: string | null
          equipment?: string | null
          xp_reward?: number | null
          is_beginner_friendly?: boolean | null
          verification_type?: 'none' | 'reps' | 'hold' | 'timer'
          verification_config?: Json | null
        }
        Update: {
          slug?: string
          name?: string
          objective?: string | null
          description?: string | null
          tips?: string | null
          difficulty?: number | null
          min_duration_min?: number | null
          environment?: string | null
          equipment?: string | null
          xp_reward?: number | null
          is_beginner_friendly?: boolean | null
          verification_type?: 'none' | 'reps' | 'hold' | 'timer'
          verification_config?: Json | null
        }
        Relationships: []
      }
      drill_coach_session: {
        Row: {
          id: number
          user_id: string
          drill_id: number
          started_at: string
          finished_at: string | null
          duration_sec: number | null
          reps_attempted: number | null
          reps_valid: number | null
          avg_quality: number | null
          hold_ms: number | null
          verification_type: string
          telemetry: Json | null
          created_at: string
        }
        Insert: {
          user_id: string
          drill_id: number
          started_at?: string
          finished_at?: string | null
          duration_sec?: number | null
          reps_attempted?: number | null
          reps_valid?: number | null
          avg_quality?: number | null
          hold_ms?: number | null
          verification_type: string
          telemetry?: Json | null
        }
        Update: {
          user_id?: string
          drill_id?: number
          started_at?: string
          finished_at?: string | null
          duration_sec?: number | null
          reps_attempted?: number | null
          reps_valid?: number | null
          avg_quality?: number | null
          hold_ms?: number | null
          verification_type?: string
          telemetry?: Json | null
        }
        Relationships: []
      }
      drill_error: {
        Row: {
          drill_id: number
          error_id: number
          role: string | null
          weight: number | null
          notes: string | null
        }
        Insert: {
          drill_id: number
          error_id: number
          role?: string | null
          weight?: number | null
          notes?: string | null
        }
        Update: {
          drill_id?: number
          error_id?: number
          role?: string | null
          weight?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      drill_mechanic: {
        Row: {
          drill_id: number
          mechanic_id: number
          role: string | null
          weight: number | null
          notes: string | null
        }
        Insert: {
          drill_id: number
          mechanic_id: number
          role?: string | null
          weight?: number | null
          notes?: string | null
        }
        Update: {
          drill_id?: number
          mechanic_id?: number
          role?: string | null
          weight?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      error_mechanic: {
        Row: {
          swing_mechanic_id: number
          swing_error_id: number
          role: string | null
          weight: number | null
          notes: string | null
        }
        Insert: {
          swing_mechanic_id: number
          swing_error_id: number
          role?: string | null
          weight?: number | null
          notes?: string | null
        }
        Update: {
          swing_mechanic_id?: number
          swing_error_id?: number
          role?: string | null
          weight?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      lesson: {
        Row: {
          id: number
          slug: string
          title: string
          summary: string | null
          level: number | null
          primary_phase_id: number | null
          lesson_type: string
          duration_min: number | null
          is_course: boolean | null
          tags: string | null
          primary_error_id: number | null
          verification_type: 'none' | 'reps' | 'hold' | 'timer'
          verification_config: Json | null
        }
        Insert: {
          slug: string
          title: string
          summary?: string | null
          level?: number | null
          primary_phase_id?: number | null
          lesson_type: string
          duration_min?: number | null
          is_course?: boolean | null
          tags?: string | null
          primary_error_id?: number | null
          verification_type?: 'none' | 'reps' | 'hold' | 'timer'
          verification_config?: Json | null
        }
        Update: {
          slug?: string
          title?: string
          summary?: string | null
          level?: number | null
          primary_phase_id?: number | null
          lesson_type?: string
          duration_min?: number | null
          is_course?: boolean | null
          tags?: string | null
          primary_error_id?: number | null
          verification_type?: 'none' | 'reps' | 'hold' | 'timer'
          verification_config?: Json | null
        }
        Relationships: []
      }
      lesson_coach_session: {
        Row: {
          id: number
          user_id: string
          lesson_id: number
          started_at: string
          finished_at: string | null
          duration_sec: number | null
          verification_type: string
          telemetry: Json | null
          created_at: string
        }
        Insert: {
          user_id: string
          lesson_id: number
          started_at?: string
          finished_at?: string | null
          duration_sec?: number | null
          verification_type: string
          telemetry?: Json | null
        }
        Update: {
          user_id?: string
          lesson_id?: number
          started_at?: string
          finished_at?: string | null
          duration_sec?: number | null
          verification_type?: string
          telemetry?: Json | null
        }
        Relationships: []
      }
      lesson_step: {
        Row: {
          id: number
          lesson_id: number
          step_order: number
          step_type: string
          title: string | null
          body: string | null
          drill_id: number | null
          mechanic_id: number | null
          error_id: number | null
          estimated_min: number | null
        }
        Insert: {
          lesson_id: number
          step_order: number
          step_type: string
          title?: string | null
          body?: string | null
          drill_id?: number | null
          mechanic_id?: number | null
          error_id?: number | null
          estimated_min?: number | null
        }
        Update: {
          lesson_id?: number
          step_order?: number
          step_type?: string
          title?: string | null
          body?: string | null
          drill_id?: number | null
          mechanic_id?: number | null
          error_id?: number | null
          estimated_min?: number | null
        }
        Relationships: []
      }
      mechanic_key_point: {
        Row: {
          id: number
          mechanic_id: number
          sort_order: number | null
          point_type: string | null
          text: string
        }
        Insert: {
          mechanic_id: number
          sort_order?: number | null
          point_type?: string | null
          text: string
        }
        Update: {
          mechanic_id?: number
          sort_order?: number | null
          point_type?: string | null
          text?: string
        }
        Relationships: []
      }
      mechanic_tip: {
        Row: {
          id: number
          mechanic_id: number
          sort_order: number | null
          tip_type: string | null
          text: string
        }
        Insert: {
          mechanic_id: number
          sort_order?: number | null
          tip_type?: string | null
          text: string
        }
        Update: {
          mechanic_id?: number
          sort_order?: number | null
          tip_type?: string | null
          text?: string
        }
        Relationships: []
      }
      swing_error: {
        Row: {
          id: number
          slug: string
          name: string
          phase_id: number | null
          typical_miss: string | null
          description: string | null
          cause_notes: string | null
          fix: string | null
          severity_scale: number | null
        }
        Insert: {
          slug: string
          name: string
          phase_id?: number | null
          typical_miss?: string | null
          description?: string | null
          cause_notes?: string | null
          fix?: string | null
          severity_scale?: number | null
        }
        Update: {
          slug?: string
          name?: string
          phase_id?: number | null
          typical_miss?: string | null
          description?: string | null
          cause_notes?: string | null
          fix?: string | null
          severity_scale?: number | null
        }
        Relationships: []
      }
      swing_mechanic: {
        Row: {
          id: number
          slug: string
          name: string
          phase_id: number
          category: string | null
          body_part: string | null
          mechanic_type: string | null
          statuc_or_dynamic: string | null
          difficulty: number | null
          is_fundamental: boolean | null
          measurable: boolean | null
          description_short: string | null
          measurement_notes: string | null
        }
        Insert: {
          slug: string
          name: string
          phase_id: number
          category?: string | null
          body_part?: string | null
          mechanic_type?: string | null
          statuc_or_dynamic?: string | null
          difficulty?: number | null
          is_fundamental?: boolean | null
          measurable?: boolean | null
          description_short?: string | null
          measurement_notes?: string | null
        }
        Update: {
          slug?: string
          name?: string
          phase_id?: number
          category?: string | null
          body_part?: string | null
          mechanic_type?: string | null
          statuc_or_dynamic?: string | null
          difficulty?: number | null
          is_fundamental?: boolean | null
          measurable?: boolean | null
          description_short?: string | null
          measurement_notes?: string | null
        }
        Relationships: []
      }
      swing_phase: {
        Row: {
          id: number
          slug: string
          name: string
          description: string | null
          sort_order: number | null
        }
        Insert: {
          slug: string
          name: string
          description?: string | null
          sort_order?: number | null
        }
        Update: {
          slug?: string
          name?: string
          description?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      swing_diagnostic: {
        Row: {
          id: number;
          user_id: string;
          video_url: string | null;
          phase_scores: Json | null;
          mechanic_scores: Json | null;
          error_scores: Json | null;
          recommended_lesson_ids: number[] | null;
          recommended_drills: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          video_url?: string | null;
          phase_scores?: Json | null;
          mechanic_scores?: Json | null;
          error_scores?: Json | null;
          recommended_lesson_ids?: number[] | null;
          recommended_drills?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          video_url?: string | null;
          phase_scores?: Json | null;
          mechanic_scores?: Json | null;
          error_scores?: Json | null;
          recommended_lesson_ids?: number[] | null;
          recommended_drills?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "swing_diagnostic_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      }
      profiles: {
        Row: {
          user_id: string;
          username: string;
          location: string | null;
          member_since: string | null;
          avatar_url: string | null;
          badge: string | null;
          level: number | null;
          rank_title: string | null;
          xp: number | null;
          xp_to_next: number | null;
          next_rank_title: string | null;
          overall_score: number | null;
          tempo_score: number | null;
          speed_score: number | null;
          plane_score: number | null;
          rotation_score: number | null;
          balance_score: number | null;
          power_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          location?: string | null;
          member_since?: string | null;
          avatar_url?: string | null;
          badge?: string | null;
          level?: number | null;
          rank_title?: string | null;
          xp?: number | null;
          xp_to_next?: number | null;
          next_rank_title?: string | null;
          overall_score?: number | null;
          tempo_score?: number | null;
          speed_score?: number | null;
          plane_score?: number | null;
          rotation_score?: number | null;
          balance_score?: number | null;
          power_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          location?: string | null;
          member_since?: string | null;
          avatar_url?: string | null;
          badge?: string | null;
          level?: number | null;
          rank_title?: string | null;
          xp?: number | null;
          xp_to_next?: number | null;
          next_rank_title?: string | null;
          overall_score?: number | null;
          tempo_score?: number | null;
          speed_score?: number | null;
          plane_score?: number | null;
          rotation_score?: number | null;
          balance_score?: number | null;
          power_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      practice_session: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          swings_count: number | null;
          started_at: string;
          duration_min: number | null;
          grade: string | null;
          grade_color: string | null;
          avg_speed_mph: number | null;
          thumbnail_url: string | null;
          swing_diagnostic_id: number | null;
          created_at: string;
          updated_at: string;
          lesson_id: number | null;
          session_type: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          title: string;
          swings_count?: number | null;
          started_at?: string;
          duration_min?: number | null;
          grade?: string | null;
          grade_color?: string | null;
          avg_speed_mph?: number | null;
          thumbnail_url?: string | null;
          swing_diagnostic_id?: number | null;
          created_at?: string;
          updated_at?: string;
          lesson_id?: number | null;
          session_type?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string;
          swings_count?: number | null;
          started_at?: string;
          duration_min?: number | null;
          grade?: string | null;
          grade_color?: string | null;
          avg_speed_mph?: number | null;
          thumbnail_url?: string | null;
          swing_diagnostic_id?: number | null;
          created_at?: string;
          updated_at?: string;
          lesson_id?: number | null;
          session_type?: string | null;
        };
        Relationships: [];
      };
      user_lesson_progress: {
        Row: {
          id: number;
          user_id: string;
          lesson_id: number;
          current_part: number | null;
          total_parts: number | null;
          status: string | null;
          last_practiced_at: string | null;
          due_at: string | null;
          retention_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          lesson_id: number;
          current_part?: number | null;
          total_parts?: number | null;
          status?: string | null;
          last_practiced_at?: string | null;
          due_at?: string | null;
          retention_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          lesson_id?: number;
          current_part?: number | null;
          total_parts?: number | null;
          status?: string | null;
          last_practiced_at?: string | null;
          due_at?: string | null;
          retention_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /** Curriculum queue: lessons ordered by swing issue_scores (build_curriculum_queue). status: queued | active | completed. */
      user_curriculum_queue: {
        Row: {
          user_id: string;
          lesson_id: number;
          issue_slug: string | null;
          queue_rank: number;
          status: string;
          activated_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lesson_id: number;
          issue_slug?: string | null;
          queue_rank: number;
          status?: string;
          activated_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          lesson_id?: number;
          issue_slug?: string | null;
          queue_rank?: number;
          status?: string;
          activated_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_review_event: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          occurred_at: string;
          priority: number | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          occurred_at?: string;
          priority?: number | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          occurred_at?: string;
          priority?: number | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_drill_assignment: {
        Row: {
          id: number;
          user_id: string;
          drill_id: number;
          status: string | null;
          due_at: string | null;
          last_practiced_at: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          drill_id: number;
          status?: string | null;
          due_at?: string | null;
          last_practiced_at?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          drill_id?: number;
          status?: string | null;
          due_at?: string | null;
          last_practiced_at?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievement: {
        Row: {
          id: number;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          unlock_criteria: Json | null;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          unlock_criteria?: Json | null;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          unlock_criteria?: Json | null;
          sort_order?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievement: {
        Row: {
          id: number;
          user_id: string;
          achievement_id: number;
          unlocked_at: string | null;
          progress: number | null;
          max_progress: number | null;
          is_unlocked: boolean | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: number;
          unlocked_at?: string | null;
          progress?: number | null;
          max_progress?: number | null;
          is_unlocked?: boolean | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: number;
          unlocked_at?: string | null;
          progress?: number | null;
          max_progress?: number | null;
          is_unlocked?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      challenge: {
        Row: {
          id: number;
          slug: string;
          title: string;
          description: string | null;
          challenge_type: string;
          metric_type: string;
          target_value: number;
          reward_xp: number;
          rules: Json | null;
          is_active: boolean;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          description?: string | null;
          challenge_type: string;
          metric_type: string;
          target_value: number;
          reward_xp?: number;
          rules?: Json | null;
          is_active?: boolean;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          description?: string | null;
          challenge_type?: string;
          metric_type?: string;
          target_value?: number;
          reward_xp?: number;
          rules?: Json | null;
          is_active?: boolean;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenge_instance: {
        Row: {
          id: number;
          challenge_id: number;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          challenge_id: number;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          challenge_id?: number;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenge_participation: {
        Row: {
          id: number;
          user_id: string;
          challenge_instance_id: number;
          status: string;
          joined_at: string;
        };
        Insert: {
          user_id: string;
          challenge_instance_id: number;
          status?: string;
          joined_at?: string;
        };
        Update: {
          user_id?: string;
          challenge_instance_id?: number;
          status?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      challenge_progress: {
        Row: {
          id: number;
          user_id: string;
          challenge_instance_id: number;
          progress_value: number;
          is_completed: boolean;
          completed_at: string | null;
          last_updated_at: string;
        };
        Insert: {
          user_id: string;
          challenge_instance_id: number;
          progress_value?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          last_updated_at?: string;
        };
        Update: {
          user_id?: string;
          challenge_instance_id?: number;
          progress_value?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          last_updated_at?: string;
        };
        Relationships: [];
      };
      user_goal: {
        Row: {
          id: number;
          user_id: string;
          goal_type: string;
          title: string;
          target_value: number;
          current_value: number | null;
          progress_percentage: number | null;
          icon: string | null;
          color: string | null;
          is_active: boolean | null;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          goal_type: string;
          title: string;
          target_value: number;
          current_value?: number | null;
          progress_percentage?: number | null;
          icon?: string | null;
          color?: string | null;
          is_active?: boolean | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          goal_type?: string;
          title?: string;
          target_value?: number;
          current_value?: number | null;
          progress_percentage?: number | null;
          icon?: string | null;
          color?: string | null;
          is_active?: boolean | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      swing_capture: {
        Row: {
          id: number;
          user_id: string;
          status: string;
          camera_angle: string | null;
          environment: string | null;
          pose_summary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: string;
          camera_angle?: string | null;
          environment?: string | null;
          pose_summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          status?: string;
          camera_angle?: string | null;
          environment?: string | null;
          pose_summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      swing_frame: {
        Row: {
          id: number;
          capture_id: number;
          phase: string;
          timestamp_ms: number | null;
          frame_path: string;
          overlay_path: string | null;
          created_at: string;
        };
        Insert: {
          capture_id: number;
          phase: string;
          timestamp_ms?: number | null;
          frame_path: string;
          overlay_path?: string | null;
          created_at?: string;
        };
        Update: {
          capture_id?: number;
          phase?: string;
          timestamp_ms?: number | null;
          frame_path?: string;
          overlay_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      swing_analysis: {
        Row: {
          id: number;
          capture_id: number;
          user_id: string;
          model: string;
          prompt_version: string;
          schema_version: string;
          input_fingerprint: string | null;
          raw_json: Json;
          issue_scores: Json;
          issue_confidence: Json;
          mechanic_scores: Json;
          club_angle_refs: Json;
          overall_confidence: number | null;
          recommended_lesson_ids: number[] | null;
          recommended_drill_ids: number[] | null;
          created_at: string;
        };
        Insert: {
          capture_id: number;
          user_id: string;
          model: string;
          prompt_version?: string;
          schema_version?: string;
          input_fingerprint?: string | null;
          raw_json: Json;
          issue_scores?: Json;
          issue_confidence?: Json;
          mechanic_scores?: Json;
          club_angle_refs?: Json;
          overall_confidence?: number | null;
          recommended_lesson_ids?: number[] | null;
          recommended_drill_ids?: number[] | null;
          created_at?: string;
        };
        Update: {
          capture_id?: number;
          user_id?: string;
          model?: string;
          prompt_version?: string;
          schema_version?: string;
          input_fingerprint?: string | null;
          raw_json?: Json;
          issue_scores?: Json;
          issue_confidence?: Json;
          mechanic_scores?: Json;
          club_angle_refs?: Json;
          overall_confidence?: number | null;
          recommended_lesson_ids?: number[] | null;
          recommended_drill_ids?: number[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      xp_event: {
        Row: {
          id: number;
          user_id: string;
          source_type: string;
          source_id: number | null;
          reason: string | null;
          xp: number;
          idempotency_key: string | null;
          occurred_at: string;
          created_at: string;
          base_xp: number;
          quality_mult: number;
          novelty_mult: number;
          streak_mult: number;
          diminishing_mult: number;
          meta: Json;
          computed_xp: number | null;
        };
        Insert: {
          user_id: string;
          source_type: string;
          source_id?: number | null;
          reason?: string | null;
          xp: number;
          idempotency_key?: string | null;
          occurred_at?: string;
          created_at?: string;
          base_xp?: number;
          quality_mult?: number;
          novelty_mult?: number;
          streak_mult?: number;
          diminishing_mult?: number;
          meta?: Json;
        };
        Update: {
          user_id?: string;
          source_type?: string;
          source_id?: number | null;
          reason?: string | null;
          xp?: number;
          idempotency_key?: string | null;
          occurred_at?: string;
          created_at?: string;
          base_xp?: number;
          quality_mult?: number;
          novelty_mult?: number;
          streak_mult?: number;
          diminishing_mult?: number;
          meta?: Json;
        };
        Relationships: [];
      };
      user_daily_xp_activity: {
        Row: {
          user_id: string;
          activity_day: string;
          drills_count: number;
          reviews_count: number;
          captures_count: number;
          challenges_count: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          activity_day: string;
          drills_count?: number;
          reviews_count?: number;
          captures_count?: number;
          challenges_count?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          activity_day?: string;
          drills_count?: number;
          reviews_count?: number;
          captures_count?: number;
          challenges_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_streak: {
        Row: {
          user_id: string;
          current_streak: number;
          last_active_day: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          last_active_day?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          last_active_day?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tier_definition: {
        Row: {
          tier: number;
          name: string;
          sort_order: number;
        };
        Insert: {
          tier: number;
          name: string;
          sort_order: number;
        };
        Update: {
          tier?: number;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      tier_week_result: {
        Row: {
          week_start: string;
          user_id: string;
          prior_tier: number;
          new_tier: number;
          xp_week: number;
          outcome: string;
          computed_at: string;
        };
        Insert: {
          week_start: string;
          user_id: string;
          prior_tier: number;
          new_tier: number;
          xp_week?: number;
          outcome: string;
          computed_at?: string;
        };
        Update: {
          week_start?: string;
          user_id?: string;
          prior_tier?: number;
          new_tier?: number;
          xp_week?: number;
          outcome?: string;
          computed_at?: string;
        };
        Relationships: [];
      };
      user_tier_state: {
        Row: {
          user_id: string;
          current_tier: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_tier: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_tier?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_xp_user: {
        Row: {
          week_start: string;
          user_id: string;
          xp_week: number;
          updated_at: string;
        };
        Insert: {
          week_start: string;
          user_id: string;
          xp_week?: number;
          updated_at?: string;
        };
        Update: {
          week_start?: string;
          user_id?: string;
          xp_week?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      curriculum_track: {
        Row: {
          id: number;
          slug: 'foundation' | 'corrective';
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: 'foundation' | 'corrective';
          name: string;
          description?: string | null;
          sort_order: number;
          is_active?: boolean;
        };
        Update: {
          slug?: 'foundation' | 'corrective';
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      curriculum_unit: {
        Row: {
          id: number;
          track_id: number;
          slug: string;
          title: string;
          description: string | null;
          unit_type: 'foundation' | 'corrective';
          primary_phase_id: number | null;
          primary_error_id: number | null;
          difficulty: number | null;
          estimated_minutes: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          track_id: number;
          slug: string;
          title: string;
          description?: string | null;
          unit_type: 'foundation' | 'corrective';
          primary_phase_id?: number | null;
          primary_error_id?: number | null;
          difficulty?: number | null;
          estimated_minutes?: number | null;
          sort_order: number;
          is_active?: boolean;
        };
        Update: {
          track_id?: number;
          slug?: string;
          title?: string;
          description?: string | null;
          unit_type?: 'foundation' | 'corrective';
          primary_phase_id?: number | null;
          primary_error_id?: number | null;
          difficulty?: number | null;
          estimated_minutes?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      curriculum_unit_item: {
        Row: {
          id: number;
          unit_id: number;
          item_order: number;
          item_type: 'lesson' | 'drill' | 'cue';
          lesson_id: number | null;
          drill_id: number | null;
          cue_id: number | null;
          is_required: boolean;
          is_bonus: boolean;
          unlock_rule: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          unit_id: number;
          item_order: number;
          item_type: 'lesson' | 'drill' | 'cue';
          lesson_id?: number | null;
          drill_id?: number | null;
          cue_id?: number | null;
          is_required?: boolean;
          is_bonus?: boolean;
          unlock_rule?: Json | null;
          notes?: string | null;
        };
        Update: {
          unit_id?: number;
          item_order?: number;
          item_type?: 'lesson' | 'drill' | 'cue';
          lesson_id?: number | null;
          drill_id?: number | null;
          cue_id?: number | null;
          is_required?: boolean;
          is_bonus?: boolean;
          unlock_rule?: Json | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      curriculum_unit_mechanic: {
        Row: {
          unit_id: number;
          mechanic_id: number;
          role: 'primary' | 'secondary' | 'support';
          weight: number;
          notes: string | null;
        };
        Insert: {
          unit_id: number;
          mechanic_id: number;
          role: 'primary' | 'secondary' | 'support';
          weight?: number;
          notes?: string | null;
        };
        Update: {
          unit_id?: number;
          mechanic_id?: number;
          role?: 'primary' | 'secondary' | 'support';
          weight?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      user_curriculum_unit: {
        Row: {
          user_id: string;
          unit_id: number;
          status: 'queued' | 'active' | 'completed' | 'skipped';
          priority_score: number | null;
          assigned_reason: Json | null;
          started_at: string | null;
          completed_at: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          unit_id: number;
          status?: 'queued' | 'active' | 'completed' | 'skipped';
          priority_score?: number | null;
          assigned_reason?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          last_seen_at?: string | null;
        };
        Update: {
          status?: 'queued' | 'active' | 'completed' | 'skipped';
          priority_score?: number | null;
          assigned_reason?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          last_seen_at?: string | null;
        };
        Relationships: [];
      };
      user_curriculum_unit_item: {
        Row: {
          id: number;
          user_id: string;
          unit_item_id: number;
          status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
          score: number | null;
          started_at: string | null;
          completed_at: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          unit_item_id: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
          score?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          last_seen_at?: string | null;
        };
        Update: {
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
          score?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          last_seen_at?: string | null;
        };
        Relationships: [];
      };
    }
    Views: {
      curriculum_unit_item_resolved: {
        Row: {
          id: number;
          unit_id: number;
          item_order: number;
          item_type: 'lesson' | 'drill' | 'cue';
          is_required: boolean;
          is_bonus: boolean;
          unlock_rule: Json | null;
          notes: string | null;
          resolved_lesson_id: number | null;
          resolved_drill_id: number | null;
          resolved_cue_id: number | null;
          content_slug: string | null;
          content_title: string | null;
        };
        Insert: never;
        Update: never;
      };
      weekly_xp_leaderboard: {
        Row: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          badge: string | null;
          rank_title: string | null;
          xp_week: number;
          rank_week: number;
        };
        Insert: never;
        Update: never;
      };
    }
    Functions: {
      award_xp: {
        Args: {
          p_source_type: string;
          p_source_id: number;
          p_reason?: string | null;
          p_meta?: Json;
          p_idempotency_key?: string | null;
        };
        Returns: Array<{
          xp_awarded: number;
          new_total_xp: number;
          week_xp: number;
        }>;
      };
      ensure_user_tier_state: {
        Args: Record<string, never>;
        Returns: void;
      };
      get_tier_leaderboard: {
        Args: {
          p_week_start: string;
          p_limit?: number;
        };
        Returns: Array<{
          week_start: string;
          tier: number;
          tier_name: string;
          user_id: string;
          username: string | null;
          avatar_url: string | null;
          xp_week: number;
          rank: number;
          is_me: boolean;
        }>;
      };
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
