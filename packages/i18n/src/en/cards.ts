/** `ko/cards.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다. */
export const cards: Record<string, string> = {
  'card.dictOneLiner': 'In one line',
  'card.dictWhy': 'Why it is needed',
  'card.dictTrace': 'Inside line {{focus}}',
  'card.varsMissing': 'The template uses a variable this site does not have: {{names}}',

  't0.roleOp': 'operator',
  't0.roleId': 'name',
  't0.roleLit': 'value',
  't0.roleOther': 'fragment',
  't0.pointDiag': '«{{pick}}» sits in the {{role}} slot. The answer is «{{answer}}».',

  't0.noSiteInRepo': 'this grammar is used nowhere in the repo',
  't0.syntheticFile': 'dictionary example',
  't0.noExample': 'the dictionary has no usable example',
  't0.noSiteUsable': 'no usable site',
  't0.dropNoHole': 'this site has no hole (@hole)',
  't0.dropHoleTooShort': 'the hole is one character — too short for a blank',
  't0.dropNoBlankEntry': 'the dictionary has no blank question',
  't0.dropNoMeaningEntry': 'the dictionary has no meaning question',
  't0.dropNoPointEntry': 'the dictionary has no point question',
  't0.dropFirstOptionDiffers': 'the first option differs from the hole ({{hole}})',
  't0.dropOptionKinds': 'the four options are of different kinds',
  't0.dropNoWrongDiag': 'a wrong option has no diagnosis',
  't0.dropNoFocusLine': 'could not read the focus line',
  't0.dropHoleNotInFocus': 'the hole ({{hole}}) is not on the focus line',
  't0.dropHeuristicSite': 'a guessed site cannot carry a meaning question',
  't0.dropPoorParse': 'the file did not parse cleanly — no meaning question',
  't0.dropAnswerNotInFocus': 'the answer token {{token}} is not on the focus line',
  't0.dropFewCandidates': 'fewer than {{n}} tokens to point at',

  't1.continued': '…continued',
  't1.whyQuestion': 'What would change if this line were gone?',
  't1.whyHelpTranscribe':
    'One line is enough. It is not graded. It cannot be skipped either — if your head '
    + 'does not switch on here, the transcription before it was typing practice.',
  't1.specCalls': 'calls {{list}}',
  't1.specLocals': 'declares {{n}} local variables — {{names}}',
  't1.specReturnRoot': 'returns <code>&lt;{{tag}}&gt;</code> as the root',
  't1.specEarlyReturns': 'has {{n}} early returns',

  't1.noBlockInRepo': 'no block in the repo to transcribe',
  't1.noBlockUsable': 'no block to transcribe',
  't1.dropNoLines': 'could not read the block',
  't1.dropLineCount': '{{n}} lines — a transcription block is {{min}}–{{max}}',
  't1.dropNoConcepts': 'no grammar concept lands in this block',
  't1.dropTooManyUnknown': '{{n}} unknown concepts — at most {{max}} per block',
  't1.dropFirstPrintTooLong': 'a first print runs to {{max}} lines ({{n}})',
  't1.dropNoDictConcept': 'no required grammar concept in the block is in the dictionary',
  't1.dropNothingToMask': 'stage 2 has nothing to hide — signature, comments and closers only',

  't2.bandScreen': 'Screen',
  't2.bandFeature': 'Feature',
  't2.bandAction': 'Action · network',
  't2.bandShared': 'Shared · data',

  't2.question': 'To add «{{subject}}», which files would you change?',
  't2.placementHint': 'Click a file box on the map to pick it. The count stays hidden.',
  't2.changeAdded': 'A new file.',
  't2.changeDeleted': 'Deleted here.',
  't2.changeRenamed': 'Renamed and changed along with it.',
  't2.changeLines': '{{n}} lines changed.',
  't2.changeFew': 'Only a few lines changed.',
  't2.relationUsedBy': '«{{name}}» imports this file.',
  't2.relationUses': 'Imports «{{name}}».',
  't2.relationBand': 'On the {{band}} band.',
  't2.coChanged':
    'Not changed in this commit, but it often changes together with these files in recent commits.',
  't2.trapPlacesOnly':
    '«{{self}}» only places «{{child}}». What changes inside is nothing «{{self}}» knows about',
  't2.trapShared': 'A shared part. «{{name}}» only imports it',
  't2.trapStateMoved':
    '«{{self}}» holds state, but this time the new file «{{taker}}» took that job',
  't2.trapUnchanged': 'Not changed in this commit',
  't2.hintSpreadUnknown':
    'This feature spans several bands. Changing the screen alone does not finish it.',
  't2.hintSpread':
    'This feature spans <b>{{n}} of {{bands}} bands</b>. Changing the screen alone does not '
    + 'finish it.',
  't2.hintNoNewFiles': 'No file was created in this commit. Only existing ones changed.',
  't2.hintNewFiles': '<b>{{n}} files were created.</b> The map marks them “new plate”.',
  't2.hintCoreCount': '<b>{{n}} files</b> have to change.',
  't2.hintCoreCountBonus': '{{count}} (＋ {{n}} bonus)',
  't2.commitStat': '{{files}} files · +{{ins}} −{{del}}',

  't2.radiusQuestion': 'If you change «{{target}}», which files are affected?',
  't2.radiusHint': 'Click a file box on the map to pick it. Arrow direction decides the answer.',
  't2.radiusDirect': 'direct',
  't2.radiusDirectNote': '«{{name}}» imports «{{target}}» directly.',
  't2.radiusHop': 'one hop',
  't2.radiusHopNote': 'Reached one hop away. Picking it or not costs nothing.',
  't2.radiusTrap':
    '«{{name}}» is what «{{target}}» imports, so a change to «{{target}}» does not reach it.',
  't2.radiusHint1': 'The affected files span {{n}} bands.',
  't2.radiusHint2': 'Only arrows pointing **into** this file carry the change. Outgoing ones do not.',
  't2.radiusHint3': '{{one}} files are affected directly. (＋ {{two}} one hop away)',

  't2.flowQuestion': 'In what order does it pass from «{{first}}» to «{{last}}»?',
  't2.flowHint': 'Stack the cards top to bottom. The deck also holds files off the path.',
  't2.flowHint1': 'The path passes {{n}} files.',
  't2.flowHint2': 'The deck holds files off the path. Check whether the arrows connect.',
  't2.flowHint3': 'The first seat is «{{first}}».',

  't2.directionQuestion':
    'Pick the direction between the two files. An arrow always means “imports”.',
  't2.directionHint': '{{n}} questions. Reading them off the map is fine — this is not recall.',
  't2.directionHint1': 'An upper band usually imports a lower one.',
  't2.directionHint2': 'Hover two boxes on the map and only the lines between them darken.',
  't2.directionHint3': '{{n}} of the pairs are related.',

  't2.noCommits': '{{n}} candidate commits — {{min}} are needed',
  't2.noCommitFiles': 'no changed files on the candidate commit',
  't2.mapTooSmall': '{{n}} map nodes — too small',
  't2.noRadiusTarget': 'no sheet file has an incoming arrow',
  't2.noFlowPath': 'no path runs through {{n}} or more files',
  't2.noDirectionPairs': 'fewer than {{n}} pairs to ask a direction about',

  't2.entryQuestion': 'Which folder is the door this repo is entered through from outside?',
  't2.entryHint': 'Pick on the map. There can be more than one.',
  't2.entryStat': 'door',
  't2.entrySecStat': 'looks like a door',
  't2.entryCore': 'Nothing points at it, and it reaches into {{out}} folders.',
  't2.entryCoreNamed':
    '«{{name}}» — the file the outside calls sits here, and nothing points at it.',
  't2.entrySec': '«{{name}}» sits here, but {{in}} folders inside the repo import this one.',
  't2.entryTrap':
    '{{in}} folders import this one. Being used a lot is not the same as being entered first.',
  't2.entryHint1': 'There are {{n}} doors.',
  't2.entryHint2': 'Look for a folder with no incoming arrow. The most-used folder is not the door.',
  't2.entryHint3': 'The most-used one is «{{name}}» — that is a store room.',

  't2.roleQuestion': 'Why does the «{{folder}}» folder exist?',
  't2.roleHint': 'This folder is missing from the map. Choose which of the four rows it belongs to.',
  't2.roleHint1': '{{in}} folders import this one, and this one imports {{out}}.',
  't2.roleHint2': 'The importing side sits above. Only incoming arrows means the bottom row.',
  't2.roleHint3': 'It holds {{n}} files.',

  't2.noRepoMap': 'the repo folds into a single «other» sheet — no repo map stands',
  't2.smallRepoMap': 'the repo map has only {{n}} nodes',
  't2.entryNone': 'doors cover more than half the map, or none at all (nodes {{n}})',
  // ───────── Execution tracing (D151) ─────────
  'exec.noGrammar': 'execution order cannot be read for this grammar yet',
  'exec.noFunction': 'no function definition in this block',
  'exec.noTrace': 'fewer than four lines to point at — the function is too short',
  'proto.noEvidence': 'no evidence word appears in this block',
  'exec.orderQ': 'Point at the line that runs <b>first</b> when this function is called.',
  'exec.orderHint': 'Where it is defined, nothing has run yet.',
  'exec.whyDefinition':
    'That line is a <b>definition</b> — it makes a name and nothing more; the lines inside run '
    + 'when something calls it. This is where reading order parts from running order.',
  'exec.whyRuns':
    'That line does <b>run</b> — just not first. Another line is reached before it.',
  'exec.whyConditional':
    'That line sits under a condition, so it <b>may</b> run. “Runs first” and “runs if” differ.',
  'exec.whyNested':
    'That line is inside an <b>inner function</b> — calling the outer one does not run it; '
    + 'it runs when that inner function is called.',
  't2.roleNone': 'only {{n}} folders have a band the path pattern knows',
};
