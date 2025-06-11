-- Sample Portal Data - Run AFTER setup-portal-tables.sql
-- This will create the 5 agents and sample activities for testing

-- Insert the 5 portal agents (Alex, Toby, Riley, Jamie, Dana)
INSERT INTO portal_agents (user_id, name, description, role, persona, avatar_url, tools, status, efficiency_score, level_xp) VALUES
(
  auth.uid(),
  'Alex',
  'Strategic coordinator who excels at planning and organizing complex projects',
  'Strategic Coordinator',
  'Calm, articulate, and tactically creative. Thinks long-term and coordinates team efforts.',
  'alex.jpg',
  '["notion", "gmail", "google_calendar", "slack"]'::jsonb,
  'active',
  96.5,
  450
),
(
  auth.uid(),
  'Toby',
  'Research specialist who dives deep into topics and provides comprehensive analysis',
  'Research Specialist', 
  'Thorough, analytical, and detail-oriented. Loves gathering information and insights.',
  'toby.jpg',
  '["google_search", "notion", "github", "slack"]'::jsonb,
  'active',
  91.2,
  380
),
(
  auth.uid(),
  'Riley',
  'Data analyst who transforms raw information into actionable insights',
  'Data Analyst',
  'Analytical, precise, and methodical. Speaks in metrics and evidence-based conclusions.',
  'riley.jpg',
  '["google_sheets", "supabase", "python", "tableau"]'::jsonb,
  'active',
  89.7,
  420
),
(
  auth.uid(),
  'Jamie',
  'Creative designer who brings visual excellence to every project',
  'Creative Designer',
  'Artistic, innovative, and visually driven. Focuses on aesthetics and user experience.',
  'jamie.jpg',
  '["figma", "adobe_creative", "canva", "notion"]'::jsonb,
  'idle',
  94.8,
  365
),
(
  auth.uid(),
  'Dana',
  'Operations manager who ensures smooth execution and process optimization',
  'Operations Manager',
  'Efficient, systematic, and process-focused. Excels at workflow optimization.',
  'dana.jpg',
  '["asana", "slack", "google_workspace", "zapier"]'::jsonb,
  'offline',
  87.3,
  290
)
ON CONFLICT DO NOTHING;

-- Insert agent modes for each agent
INSERT INTO agent_modes (agent_id, mode_name, description, tone_override, response_length, is_active) 
SELECT 
  pa.id,
  'standard',
  'Balanced approach suitable for most tasks',
  'professional, helpful',
  'medium',
  true
FROM portal_agents pa
WHERE pa.user_id = auth.uid()
ON CONFLICT DO NOTHING;

-- Insert recent activities
INSERT INTO portal_activity_log (actor_type, actor_id, action, description, user_id, agent_id, created_at) VALUES
(
  'agent',
  (SELECT id FROM portal_agents WHERE name = 'Alex' AND user_id = auth.uid()),
  'completed_task',
  'Finished quarterly planning strategy document',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Alex' AND user_id = auth.uid()),
  NOW() - INTERVAL '15 minutes'
),
(
  'agent',
  (SELECT id FROM portal_agents WHERE name = 'Toby' AND user_id = auth.uid()),
  'research_complete',
  'Completed market analysis research for Q1 initiatives',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Toby' AND user_id = auth.uid()),
  NOW() - INTERVAL '30 minutes'
),
(
  'agent',
  (SELECT id FROM portal_agents WHERE name = 'Riley' AND user_id = auth.uid()),
  'analysis_delivered',
  'Generated monthly performance metrics dashboard',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Riley' AND user_id = auth.uid()),
  NOW() - INTERVAL '45 minutes'
),
(
  'user',
  auth.uid(),
  'agent_collaboration',
  'Started collaboration session between Alex and Toby',
  auth.uid(),
  NULL,
  NOW() - INTERVAL '1 hour'
),
(
  'agent',
  (SELECT id FROM portal_agents WHERE name = 'Jamie' AND user_id = auth.uid()),
  'design_updated',
  'Updated landing page design based on user feedback',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Jamie' AND user_id = auth.uid()),
  NOW() - INTERVAL '2 hours'
),
(
  'system',
  NULL,
  'agent_offline',
  'Dana went offline for scheduled maintenance',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Dana' AND user_id = auth.uid()),
  NOW() - INTERVAL '3 hours'
),
(
  'agent',
  (SELECT id FROM portal_agents WHERE name = 'Alex' AND user_id = auth.uid()),
  'meeting_scheduled',
  'Scheduled team standup for tomorrow 9 AM',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Alex' AND user_id = auth.uid()),
  NOW() - INTERVAL '4 hours'
),
(
  'agent',
  (SELECT id FROM portal_agents WHERE name = 'Riley' AND user_id = auth.uid()),
  'data_sync',
  'Synchronized latest analytics data from Google Analytics',
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Riley' AND user_id = auth.uid()),
  NOW() - INTERVAL '5 hours'
)
ON CONFLICT DO NOTHING;

-- Insert some notifications
INSERT INTO portal_notifications (user_id, agent_id, type, title, description, status, priority) VALUES
(
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Dana' AND user_id = auth.uid()),
  'warning',
  'Agent Offline',
  'Dana has been offline for 3 hours. Check system status.',
  'unread',
  'medium'
),
(
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Alex' AND user_id = auth.uid()),
  'task',
  'Task Completed',
  'Quarterly planning strategy document is ready for review.',
  'unread',
  'normal'
),
(
  auth.uid(),
  (SELECT id FROM portal_agents WHERE name = 'Riley' AND user_id = auth.uid()),
  'insight',
  'Performance Alert',
  'Monthly performance metrics show 15% improvement in efficiency.',
  'read',
  'normal'
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Sample portal data created! Your dashboard should now show 5 agents and recent activities. 🎉' as status; 