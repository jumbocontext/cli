-- Removed connections retain their rows; a subsequent add has a new relation ID.
DROP INDEX IF EXISTS idx_relation_unique;

CREATE UNIQUE INDEX idx_relation_unique ON relation_views(
  fromEntityType, fromEntityId, toEntityType, toEntityId, relationType
) WHERE status != 'removed';
