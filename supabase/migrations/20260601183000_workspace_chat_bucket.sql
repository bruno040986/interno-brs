INSERT INTO storage.buckets (id, name, public)
SELECT 'workspace-chat', 'workspace-chat', true
WHERE NOT EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'workspace-chat'
);
