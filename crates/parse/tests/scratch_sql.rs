use chickadee_parse::{compile, Spec};
#[test]
fn mapper_sql() {
    let d = concat!(env!("CARGO_MANIFEST_DIR"), "/../../dictionary/sql/");
    let specs: Vec<Spec> = ["from-table", "comparison", "null-check"].iter()
        .map(|i| Spec { id: (*i).into(), scm: std::fs::read_to_string(format!("{d}{i}.scm")).unwrap() }).collect();
    let q = compile("mybatis_sql", &specs).expect("compile");
    let p = "/Users/kimhyunbin/Desktop/git/MonggleMonggle/BACK/src/main/resources/mapper/user/UserMapper.xml";
    let code = std::fs::read_to_string(p).unwrap();
    let s = chickadee_parse::scan(code.as_bytes(), &q, 512*1024).unwrap();
    let mut n = std::collections::BTreeMap::new();
    for c in &s.captures { if c.name == "site" { *n.entry(c.query_id.clone()).or_insert(0) += 1; } }
    println!("UserMapper.xml quality {} · 사용처 {}", s.quality, n.values().sum::<i32>());
    for (k, v) in &n { println!("   {v:>3}  {k}"); }
    for c in s.captures.iter().filter(|c| c.name == "site").take(3) {
        println!("   {}행: {}", c.start_line, c.excerpt.replace('\n', " "));
    }
}
