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
