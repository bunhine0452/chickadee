SELECT s.name, m.name
  FROM staff s
  JOIN staff m ON s.boss_id = m.id;
