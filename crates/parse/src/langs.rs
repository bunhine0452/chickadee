//! The grammar table. Adding a language is one line here and one line in
//! `Cargo.toml` — nothing else in Rust changes (01 §9).
//!
//! The first element is the **grammar key**; dictionary `_lang.yaml.grammars`
//! uses these exact strings (D19).

use serde::Serialize;
use tree_sitter::Language;

type Load = fn() -> Language;

pub const LANGS: &[(&str, Load)] = &[
    #[cfg(feature = "lang-typescript")]
    ("typescript", || {
        tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()
    }),
    #[cfg(feature = "lang-typescript")]
    ("tsx", || tree_sitter_typescript::LANGUAGE_TSX.into()),
    #[cfg(feature = "lang-javascript")]
    ("javascript", || tree_sitter_javascript::LANGUAGE.into()),
    #[cfg(feature = "lang-sql")]
    ("sql", || tree_sitter_sequel::LANGUAGE.into()),
    #[cfg(feature = "lang-python")]
    ("python", || tree_sitter_python::LANGUAGE.into()),
    #[cfg(feature = "lang-go")]
    ("go", || tree_sitter_go::LANGUAGE.into()),
    #[cfg(feature = "lang-rust")]
    ("rust", || tree_sitter_rust::LANGUAGE.into()),
    #[cfg(feature = "lang-java")]
    ("java", || tree_sitter_java::LANGUAGE.into()),
    // Vue SFC. 문법이 따로 있는 것이 아니라 **자바스크립트를 `<script>` 구간에만** 돌린다
    // (`sfc.rs`). 문법 키를 따로 두는 이유는 파서 풀과 구간 지정이 그 키로 갈리기 때문이다.
    #[cfg(feature = "lang-javascript")]
    ("vue", || tree_sitter_javascript::LANGUAGE.into()),
    #[cfg(feature = "lang-xml")]
    ("xml", || tree_sitter_xml::LANGUAGE_XML.into()),
    // MyBatis 매퍼 안의 SQL. 문법은 sql 이고 읽는 자리만 문 본문으로 좁힌다 (`sfc.rs`).
    #[cfg(feature = "lang-sql")]
    ("mybatis_sql", || tree_sitter_sequel::LANGUAGE.into()),
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LangInfo {
    pub grammar: String,
    /// `<abi>-<node kinds>`. Not the crate version — nothing hands a dependency's
    /// version to the compiler. It changes whenever a regenerated grammar gains or
    /// loses a node kind, which is the case that silently empties a query (03 §2.2).
    pub grammar_version: String,
    pub abi: usize,
}

pub(crate) fn language_of(grammar: &str) -> Option<Language> {
    LANGS
        .iter()
        .find(|(name, _)| *name == grammar)
        .map(|(_, load)| load())
}

#[must_use]
pub fn languages() -> Vec<LangInfo> {
    LANGS
        .iter()
        .map(|(name, load)| {
            let lang = load();
            LangInfo {
                grammar: (*name).to_owned(),
                grammar_version: format!("{}-{}", lang.abi_version(), lang.node_kind_count()),
                abi: lang.abi_version(),
            }
        })
        .collect()
}
