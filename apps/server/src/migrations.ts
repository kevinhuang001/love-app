// One-time schema upgrade: the assistant belongs to the relationship, not either user.
export const pairAIUpgrade = `
INSERT INTO couple_ai_settings(coupleId,baseUrl,model,secret,enabled,name,avatarMediaId)
SELECT coupleId,baseUrl,model,secret,enabled,name,avatarMediaId FROM (
  SELECT u.coupleId,a.baseUrl,a.model,a.secret,a.enabled,a.name,a.avatarMediaId,
    ROW_NUMBER() OVER (PARTITION BY u.coupleId ORDER BY
      CASE WHEN a.enabled=1 AND a.baseUrl<>'' AND a.model<>'' THEN 0 ELSE 1 END,
      CASE WHEN a.baseUrl<>'' THEN 0 ELSE 1 END,a.userId) AS rank
  FROM ai_settings a JOIN users u ON u.id=a.userId WHERE u.coupleId IS NOT NULL
) chosen WHERE rank=1;
DROP TABLE ai_settings;
`;

export const scheduleTimeUpgrade = `
ALTER TABLE couples ADD COLUMN startTime TEXT NOT NULL DEFAULT '00:00:00';
ALTER TABLE anniversaries ADD COLUMN time TEXT NOT NULL DEFAULT '00:00:00';
ALTER TABLE todos ADD COLUMN time TEXT NOT NULL DEFAULT '00:00:00';
`;
