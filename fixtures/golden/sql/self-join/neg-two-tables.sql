SELECT s.name, d.name
  FROM staff s
  JOIN dept d ON s.dept_id = d.id;
