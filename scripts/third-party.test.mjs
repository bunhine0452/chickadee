/**
 * The generator behind THIRD_PARTY_NOTICES.md (06 §7.1). What is worth testing here is
 * not the wording but the two properties CI leans on: the same input renders the same
 * bytes, and dev-only crates never reach the file.
 */
import { describe, expect, test } from 'vitest';

import {
  normalizeCargoAbout,
  normalizeCargoMetadata,
  normalizeLicense,
  normalizeNpm,
  renderNotices,
} from './third-party.mjs';

const npmJson = {
  MIT: [
    { name: 'zustand', versions: ['5.0.15'], license: 'MIT', homepage: 'https://github.com/pmndrs/zustand' },
    { name: 'react', versions: ['19.2.8'], license: 'MIT', homepage: 'https://react.dev/' },
  ],
  ISC: [{ name: 'yaml', versions: ['2.9.0'], license: 'ISC' }],
};

/**
 * A workspace crate with three edges: one normal, one build, one dev. Written the way
 * `cargo metadata --format-version 1` writes it — ids are opaque strings and `kind: null`
 * means a normal dependency.
 */
const cargoMeta = {
  workspace_members: ['path+file:///w/app#0.1.0'],
  packages: [
    { id: 'path+file:///w/app#0.1.0', name: 'chickadee-app', version: '0.1.0', license: 'MIT' },
    { id: 'registry+serde#1.0.0', name: 'serde', version: '1.0.0', license: 'MIT OR Apache-2.0' },
    { id: 'registry+cc#1.2.0', name: 'cc', version: '1.2.0', license: 'MIT/Apache-2.0' },
    { id: 'registry+insta#1.41.0', name: 'insta', version: '1.41.0', license: 'Apache-2.0' },
    { id: 'registry+similar#2.6.0', name: 'similar', version: '2.6.0', license: 'Apache-2.0' },
  ],
  resolve: {
    nodes: [
      {
        id: 'path+file:///w/app#0.1.0',
        deps: [
          { pkg: 'registry+serde#1.0.0', dep_kinds: [{ kind: null }] },
          { pkg: 'registry+cc#1.2.0', dep_kinds: [{ kind: 'build' }] },
          { pkg: 'registry+insta#1.41.0', dep_kinds: [{ kind: 'dev' }] },
        ],
      },
      { id: 'registry+serde#1.0.0', deps: [] },
      { id: 'registry+cc#1.2.0', deps: [] },
      { id: 'registry+insta#1.41.0', deps: [{ pkg: 'registry+similar#2.6.0', dep_kinds: [{ kind: null }] }] },
      { id: 'registry+similar#2.6.0', deps: [] },
    ],
  },
};

describe('license expressions', () => {
  test('the pre-SPDX slash means OR', () => {
    expect(normalizeLicense('MIT/Apache-2.0')).toBe('MIT OR Apache-2.0');
    expect(normalizeLicense('Apache-2.0 / MIT')).toBe('Apache-2.0 OR MIT');
  });

  test('an expression that is already SPDX is left alone', () => {
    expect(normalizeLicense('Apache-2.0 WITH LLVM-exception')).toBe('Apache-2.0 WITH LLVM-exception');
    expect(normalizeLicense('(MPL-2.0 OR Apache-2.0)')).toBe('(MPL-2.0 OR Apache-2.0)');
  });

  test('a missing license is named, not dropped — a blank cell reads as MIT', () => {
    expect(normalizeLicense(undefined)).toBe('NOT DECLARED');
    expect(normalizeLicense('')).toBe('NOT DECLARED');
  });
});

describe('npm rows', () => {
  test('flattened out of the license groups and sorted by name', () => {
    expect(normalizeNpm(npmJson)).toEqual([
      { name: 'react', version: '19.2.8', license: 'MIT', url: 'https://react.dev/' },
      { name: 'yaml', version: '2.9.0', license: 'ISC', url: '' },
      { name: 'zustand', version: '5.0.15', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
    ]);
  });

  test('a package held at two versions gets a row each', () => {
    const rows = normalizeNpm({ MIT: [{ name: 'zod', versions: ['3.25.76', '3.24.1'], license: 'MIT' }] });
    expect(rows.map((r) => r.version)).toEqual(['3.24.1', '3.25.76']);
  });
});

describe('Rust rows out of cargo metadata', () => {
  const rows = normalizeCargoMetadata(cargoMeta);

  test('normal and build dependencies are shipped, so they are listed', () => {
    expect(rows.map((r) => r.name)).toContain('serde');
    expect(rows.map((r) => r.name)).toContain('cc');
  });

  test('a dev-only edge and everything under it stays out', () => {
    expect(rows.map((r) => r.name)).not.toContain('insta');
    expect(rows.map((r) => r.name)).not.toContain('similar');
  });

  test('the workspace crates are not their own third party', () => {
    expect(rows.map((r) => r.name)).not.toContain('chickadee-app');
  });

  test('sorted by name, with the slash form normalized', () => {
    expect(rows).toEqual([
      { name: 'cc', version: '1.2.0', license: 'MIT OR Apache-2.0', url: '' },
      { name: 'serde', version: '1.0.0', license: 'MIT OR Apache-2.0', url: '' },
    ]);
  });

  test('a crate reachable both ways is kept — dev is only excluded when it is the only way in', () => {
    const alsoNormal = structuredClone(cargoMeta);
    alsoNormal.resolve.nodes[0].deps.push({
      pkg: 'registry+similar#2.6.0',
      dep_kinds: [{ kind: null }],
    });
    expect(normalizeCargoMetadata(alsoNormal).map((r) => r.name)).toContain('similar');
  });
});

describe('Rust rows out of cargo about', () => {
  test('the license-keyed shape is read back into crate rows', () => {
    const rows = normalizeCargoAbout({
      licenses: [
        { id: 'MIT', used_by: [{ crate: { name: 'serde', version: '1.0.0' } }] },
        { id: 'Apache-2.0', used_by: [{ crate: { name: 'serde', version: '1.0.0' } }] },
      ],
    });
    expect(rows).toEqual([{ name: 'serde', version: '1.0.0', license: 'MIT AND Apache-2.0', url: '' }]);
  });

  test('an unrecognized shape yields nothing, which is what makes the caller fall back', () => {
    expect(normalizeCargoAbout({ something: 'else' })).toEqual([]);
    expect(normalizeCargoAbout(null)).toEqual([]);
  });
});

describe('the rendered file', () => {
  const render = () =>
    renderNotices({
      npm: normalizeNpm(npmJson),
      rust: normalizeCargoMetadata(cargoMeta),
      rustSource: 'cargo metadata',
    });

  test('the same input renders the same bytes — this is what `git diff --exit-code` checks', () => {
    expect(render()).toBe(render());
  });

  test('both tables and the font notice are in it', () => {
    const text = render();
    expect(text).toContain('| react | 19.2.8 | MIT |');
    expect(text).toContain('| serde | 1.0.0 | MIT OR Apache-2.0 |');
    expect(text).toContain('OFL-BlackHanSans.txt');
    expect(text).toContain('OFL-Plex.txt');
  });

  test('no path from the machine that generated it', () => {
    expect(render()).not.toMatch(/\/Users\/|\/home\/|C:\\\\/);
  });

  test('it says which tool produced the Rust rows', () => {
    expect(render()).toContain('Rust rows come from `cargo metadata`');
    expect(
      renderNotices({ npm: [], rust: [], rustSource: 'cargo about' }),
    ).toContain('Rust rows come from `cargo about`');
  });
});
