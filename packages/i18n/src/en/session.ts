/** `ko/session.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다. */
export const session: Record<string, string> = {
  'session.plateNo': 'No. {{n}}',
  'session.exact': 'Same',
  'session.equiv': 'Same meaning',
  'session.differ': 'Different',
  'session.missing': 'Missing',
  'session.extra': 'Extra',
  'session.swap': 'Names swapped',
  'session.right': 'That is right',
  'session.wrong': 'That is wrong',
  'session.printDone': 'Done for today',

  'session.roleReview': 'Review',
  'session.roleNew': 'New question',
  'session.roleRetry': 'Do it again',
  'session.rolePrereq': 'Layer below',
  'session.roleManual': 'Answer this question',
  'session.roleGap': 'Make a question',

  'session.kindPoint': 'Point at it',
  'session.kindBlank': 'Fill the hole',
  'session.kindMeaning': 'What it means',
  'session.kindAndRole': '{{kind}} · {{role}}',
  'session.stageAndRole': 'Stage {{stage}} · {{role}}',
  'session.conceptTranscribe': '{{name}} — transcription',
  'session.sourceT0': 'Your code <b>{{file}}:{{focus}}</b>',
  'session.sourceT1': 'Your code <b>{{file}}</b> · <b>{{fn}}</b> · {{lines}} lines',

  'session.next': 'Next',
  'session.confirm': 'Check',
  'session.grade': 'Grade it',
  'session.leave': 'Leave',
  'session.dunnoReprint': 'I don’t know · do it again',
  'session.dunnoPeek': 'I don’t know · peek at the original',
  'session.hintNextPlate': '<b>Space</b> for the next question',
  'session.hintConfirm': '<b>Enter</b> to check',
  'session.copyFailed': 'Could not copy to the clipboard.',

  'session.liveRight': 'That is right',
  'session.liveWrong': 'That is wrong',
  'session.liveNext': 'Space for the next',

  'session.liferWhereT0': 'Collected from your <b>{{file}}:{{focus}}</b> · T0 grammar',

  'plate.choices': 'Options',
  'plate.pickTargets': 'Where to point',
  'plate.hole': 'Hole',
  'plate.foldMore': '… {{n}} more lines',
  'plate.foldLess': 'Collapse',
  'plate.tagRight': 'Correct',
  'plate.tagWrong': 'Wrong',
  'plate.rule': 'Rule',
  'plate.afterLine': 'After this line',
  'plate.idleNote':
    'Result box — pick an answer and press Enter; whether it was right, why, and how many '
    + 'mastery levels it adds land here.',
  'plate.linkPara': 'Tie it back',
  'plate.linkNew': 'Just opened',
  'plate.linkHeading': '↩ Tie it back to what you just learned',
  'plate.crumbBack': '↩ Go back up now',
  'plate.crumbPrereqNote': 'One question, then you come back up together.',
  'plate.crumbReprintNote':
    'You got this question wrong last time. The diagnosis stays — <b>pick again</b>.',
  'plate.layerN': 'level {{n}}',
  'plate.layerPlus': '+{{n}} level',

  'band.label': 'Progress bar',
  'band.title': 'Today’s study',
  'band.runNo': 'Session {{n}}',
  'band.seconds': '{{n}}s',
  'band.minutes': '{{n}} min',
  'band.today': 'Today {{time}}',
  'band.left': 'About {{n}} min left · {{time}} for this one',

  'ladder.label': 'Try-again ladder',
  'ladder.heading': 'I don’t know = do it again',
  'ladder.note':
    'Doing a question you did not know again is not failure, it is <b>the process</b>. It is '
    + 'not something to be embarrassed about — it is the signal that brings you back there.',
  'ladder.ink': 'Mastery',
  'ladder.today': 'today',
  'ladder.tabs': 'Four try-again rungs',
  'ladder.rungNo': 'Rung {{n}}',
  'ladder.rung1': 'More detail',
  'ladder.rung1Sub': 'Three dictionary layers — in one line · why it is needed · inside this line',
  'ladder.rung2': 'Still lost',
  'ladder.rung2Sub': 'Check whether the layer below is empty, and go down to it if it is',
  'ladder.rung3': 'Another example',
  'ladder.rung3Sub': 'Somewhere else in your repo that uses the same grammar',
  'ladder.rung4': 'Ask freely',
  'ladder.rung4Sub': 'Chat if you have a key, copy the prompt if you do not',

  'dict.heading': 'Three dictionary layers — from one line down into this line',
  'dict.note': 'Rungs 1–3 work with no internet and no API key. Only rung 4 is optional.',

  'prereq.heading': 'What is empty underneath',
  'prereq.allPrinted':
    'Everything under this concept is learned. This is not “did not understand” — it is “not '
    + 'used to it yet”. Rather than reading more, go to rung 3 and look at several places in '
    + 'your own code that use the same grammar.',
  'prereq.someEmpty':
    'Most of the time “I don’t know” is not about this concept being hard — it is about the '
    + 'layer below being empty. {{gaps}} of the {{n}} concepts holding this one up are not '
    + 'learned yet.',
  'prereq.justFilled':
    'You just filled the layer that was empty. With everything below learned, read the '
    + '“tie it back” paragraph above once more and try again.',
  'prereq.justSeen': 'Just seen · level {{n}}',
  'prereq.beenThere': '✓ Just came back from it',
  'prereq.goDown': '↳ Go down to this question · 1 question · about 40s',
  'prereq.noPlate': 'No question · “Make a question” at home',
  'prereq.goSimplest': '↳ See the simplest shape first · 1 question · about 40s',
  'prereq.previewNote':
    '{{name}} is in your code, but opening it now means several unfamiliar pieces at once. See the simplest shape first — that site comes back later today.',
  'prereq.noteLayers': 'level {{n}}',
  'prereq.noteUnprinted': 'not learned yet',
  'prereq.noteAgain': 'level {{n}} — once more',
  'prereq.notePreview': 'no question yet',
  'prereq.noteNoSite': 'not in your code yet',
  'prereq.printed': 'Learned',
  'prereq.note':
    'Going down does not lose this question. When you finish the layer below you <b>come back '
    + 'here automatically</b>, and a “tie it back” paragraph opens when you do.',

  'uses.heading': 'The same grammar in your repo — elsewhere',
  'uses.note':
    'Places where the same rule takes a different shape. This is often faster than more prose.',
  'uses.none': 'No other place using this grammar has turned up yet.',
  'uses.line': 'line {{n}}',

  'ask.heading': 'Ask it yourself',
  'ask.note':
    'No key needed. Write where you are stuck in the box below and Chickadee builds a prompt '
    + 'holding <b>only this line and the four around it</b>. This app never sends anything on '
    + 'its own — it leaves only when you copy and paste it.',
  'ask.field': 'Where you are stuck',
  'ask.placeholder':
    'e.g. I don’t get what happens on the next line when ?. yields undefined',
  'ask.build': 'Build the prompt',
  'ask.copy': 'Copy',
  'ask.noKey': 'No API key · local dictionary and your own code only',

  'coach.label': 'First question walkthrough',
  'coach.step': '{{n}} / 3',
  'coach.pick':
    'Pick <b>one of the four choices</b> — number keys <b>1~4</b> work too. The code above is '
    + 'not a made-up example; it is <b>a line lifted straight out of your repo</b>.',
  'coach.pickSynthetic':
    'Pick <b>one of the four</b> — number keys <b>1–4</b> work too. The code above is a '
    + '<b>dictionary example</b>: this construct is not in your code yet, so you meet it in its simplest shape first.',
  'coach.confirm':
    'Press <b>Enter</b> to submit. Getting it wrong costs you nothing — one question to do again '
    + "joins today's list, that is all. If you are stuck, <b>Not sure · do it again</b> at the "
    + 'bottom left takes you down a level.',
  'coach.read':
    'Below is the <b>result slot</b>: whether you were right, why, and how many mastery levels '
    + 'you gained. When you have read it, <b>Space</b> goes to the next question — the progress '
    + 'bar up top counts what is left.',
  'lifer.label': 'First concept on record',
  'lifer.kicker': 'First record · LIFER',

  'summary.line': 'You did {{printed}} questions and it took {{mins}} minutes. That is about right.',
  'summary.tallyPrinted': 'Questions done',
  'summary.tallyTime': 'Time taken',
  'summary.tallyStreak': 'Study streak',
  'summary.unitPlate': 'questions',
  'summary.unitMinute': 'min',
  'summary.unitDay': 'days',
  'summary.inkMoved': 'Mastery gained today',
  'summary.inkNote':
    'Counted in levels, not percent. A level is added only when you get it right again after '
    + 'time has passed.',
  'summary.layerMinusReprint': '−{{n}} level · do it again',
  'summary.layerSame': 'unchanged',
  'summary.nextPrint': 'Next review',
  'summary.liferHeading': 'First grammar on record —',
  'summary.liferWhere': '#{{serial}} · collected from your <b>{{file}}:{{line}}</b>',
  'summary.streakNote':
    '<b>{{n}} days</b> in a row. A streak opens no progress — only mastery does. Take a '
    + 'day off and it picks up the next day.',
  'summary.tomorrow': 'Tomorrow <b>{{n}}</b> concepts come back up.',
  'summary.again': 'Look at today’s questions again',
  'summary.hint': 'Nicely done. Same time tomorrow.',
  'summary.home': 'Home',

  'clone.padLabel': 'Transcription input',
  'clone.lines': '{{n}} lines',
  'clone.autoSave': 'Saves itself',
  'clone.savedAt': 'Saved {{time}}',
  'clone.indent': 'indent',
  'clone.peekHold': 'hold = peek at the original',
  'clone.grade': 'grade',
  'clone.peekCount': 'Peeks at the original',
  'clone.handPct': 'Typed by hand',
  'clone.editHint':
    'A hint costs nothing. It only signals that this question should come around more often.',
  'clone.tooShort': 'Still short ({{n}} lines). Press again to grade it as it stands.',
  'clone.downgraded': 'One step easier — it is recorded, and nothing is deducted.',

  'clone.assistLabel': 'Editor help',
  'clone.assistSwitch': 'Editor help',
  'clone.assistStage': 'By stage',
  'clone.assistOff': 'All off',
  'clone.assistNote':
    'The default is <b>by stage</b>. Brackets and quotes close themselves in stages 1 and 2, never on the blank page. The list that offers back words already in this question stays on at every stage.',
  'clone.assistCost':
    'Turning it off changes how much you type, not how the score is computed. But <b>the same 85% then comes from a different setup</b>, so appeals are grouped by which setting was on.',

  'clone.stage1Name': 'Copy it',
  'clone.stage1Sub': 'The original in front of you',
  'clone.stage2Name': 'Skeleton',
  'clone.skeletonOnly': 'Comments and signature only',
  'clone.stage3Name': 'Blank page',
  'clone.stage3Sub': 'A one-line spec only',
  'clone.refStage1': 'The original — type it as you see it',
  'clone.refMeta': '{{lang}} · {{lines}}',
  'clone.refHidden': 'The body is covered',

  'clone.ask1': 'Type the original out as you see it.',
  'clone.ask2': 'With only the comments and signature, write the code you wrote before again.',
  'clone.ask3': 'From the spec alone, write it from scratch.',
  'clone.askHint':
    'Writing it by hand is the point. It does not have to match 100 %. Lines are judged only '
    + 'when you leave them — nothing happens while you type.',

  'clone.scoreOf': '{{meaning}} of {{total}}',
  'clone.scoreCaption': 'lines that mean the same',
  'clone.scoreNote':
    'Of those, <b>{{exact}} lines</b> match character for character. <b>Same meaning</b> means '
    + 'a different shape with the same meaning — whitespace and indentation, quote style, '
    + 'semicolons, comment wording, consistently renamed locals.',
  'clone.verdictAdvance': 'Good to move on',
  'clone.verdictRepeatSoft': 'One more pass at this stage is worth it',
  'clone.verdictRepeat': 'Repeating this stage once is the faster way',

  'clone.filterLabel': 'Show',
  'clone.filterNotExact': 'Different + same meaning',
  'clone.filterAll': 'All',
  'clone.filterDiffer': 'Different only',
  'clone.appealNote':
    'If a result feels unfair, each line has <b>“same meaning, surely”</b> to file an '
    + 'objection. The score stays; the rule is what gets fixed.',
  'clone.rowsLabel': 'Line by line',
  'clone.rowsEmpty': 'No line matches this filter.',
  'clone.rowNotWritten': 'You did not write this line',
  'clone.rowNotInOriginal': 'Not in the original',
  'clone.appealIdle': 'Same meaning, surely',
  'clone.appealDone': 'Objection filed · result held',
  'clone.appealHeld': '<b>{{n}}</b> objections are recorded as results held.',
  'clone.peekHint': 'Peeks at the original <b>{{n}}</b> · nothing deducted',
  'clone.backToEditor': 'Back to the editor',
  'clone.backToResult': 'Back to the results',
  'clone.nextWhy': 'Next — one line on why it looks like this',
  'clone.saveAndFinish': 'Save and finish',
  'clone.whyHint':
    'Even after picking, you finish by putting <b>one line in your own words</b> in the box. '
    + 'Writing it out is the point.',
  'clone.whyField': 'One line on why it looks like this',
  'clone.whyReveal': 'I don’t know · show the options',
  'clone.whyPlaceholder': 'e.g. to stop the browser reloading the page when the form is sent',
  'clone.whyAfterPick':
    '<b>Now put the same thing in the box above, one line, in your own words.</b> Looking at '
    + 'the answer while you write is fine.',

  'clone.reasonCommentText': 'comment wording is not compared',
  'clone.reasonCommentMissing': 'the original’s comment is missing',
  'clone.reasonCommentExtra': 'a comment the original does not have',
  'clone.reasonTrailingComment': 'end-of-line comment',
  'clone.reasonBlankMismatch': 'one side is a blank line',
  'clone.reasonIndent': 'indent width',
  'clone.reasonTerminator': 'semicolon · trailing comma',
  'clone.reasonQuote': 'quote style',
  'clone.reasonWhitespace': 'whitespace',
  'clone.reasonTokenCount': 'the token counts differ',
  'clone.reasonTokenMismatch': 'token mismatch',
  'clone.reasonRename': 'consistently renamed local',
  'clone.reasonSwap': 'the new name already exists in the original — the meaning changes',
  'clone.reasonRenameInconsistent': 'the rename is not consistent across the block',
  'clone.reasonAstEquiv': 'the syntax trees match',
  'clone.reasonTemplateVsConcat': 'a template literal and string concatenation are not the same',
  'clone.reasonParseError': 'this line does not parse, so no syntax comparison was made',
  'clone.reasonParseLangUnsupported': 'this language is compared character by character only',
  'clone.reasonParseTimeout': 'the syntax comparison timed out, so characters were compared',
  'clone.reasonDetail': '{{base}} ({{detail}})',
  'clone.astParen': 'parentheses',
  'clone.astBlock': 'braces',
  'clone.astArrowParens': 'arrow parameter parentheses',
  'clone.astLineBreak': 'line break',

  'clone.whyEquiv': 'Only the shape differs. <b>It is not wrong.</b>',
  'clone.whyEquivReasons': 'Only the shape differs. <b>It is not wrong.</b> Reasons: {{reasons}}',
  'clone.whyMissing': 'This line is missing. Check why the original needed it.',
  'clone.whyExtra':
    'A line the original does not have. That does not make it wrong — check why the original '
    + 'managed without it.',
  'clone.whyDiffer': 'The meaning changes, or sameness cannot be proved automatically.',
  'clone.whyDifferReasons':
    'The meaning changes, or sameness cannot be proved automatically. Reasons: {{reasons}}',

  'map.label': 'Dependency map',
  'map.plateLabel': '{{name}} dependency map',
  'map.kindPlacement': 'Where it belongs',
  'map.kindRadius': 'Blast radius',
  'map.kindFlow': 'Trace the flow',
  'map.kindDirection': 'Dependency direction',
  'map.subPlacement': 'Answer key = the real commit · partial credit',
  'map.subRadius': 'Answer key = the arrows on the map · partial credit',
  'map.subFlow': 'Answer key = the path on the map',
  'map.subDirection': '5 questions · reading them off the map is fine',
  'map.kindEntry': 'Entry point',
  'map.kindRole': 'What a folder is for',
  'map.subEntry': 'Answer key = folders with no incoming arrow · partial credit',
  'map.subRole': '1 question · the folder in question is missing from the map',
  'map.sourceT2':
    '{{sub}} · {{files}} files · {{edges}} links · {{bands}} bands · an arrow always means '
    + '<b>imports</b>',
  'map.mapHint':
    'The point is not getting it right — it is getting a feel for how your project is split up.',

  'map.stateOk': 'picked correctly',
  'map.stateMissed': 'missed',
  'map.stateWrong': 'picked but not needed',
  'map.stateSec': 'changed alongside',
  'map.folded': 'folded folder',
  'map.foldedFiles': 'folded folder · {{n}} files',
  'map.cycle': 'cycle',
  'map.cycleTag': '⟲ cycle',
  'map.newFile': 'new file',
  'map.newTag': '＋ new file',

  'map.statusHover': 'Hover a file box to see its links, click it to pick it.',
  'map.statusAxis': 'Up = closer to the user · down = closer to the data',
  'map.statusUses': 'imported by',
  'map.statusUsed': 'imports',
  'map.statusLegend':
    '✓ picked correctly · ＋ missed · ✕ picked but not needed · ◆ changed alongside',
  'map.statusClick': 'Click to select / deselect',
  'map.pickedNone': 'No file picked yet.',

  'map.hint': 'Hint {{n}}',
  'map.hintNote': 'A hint costs nothing. Missed files blink on the map after grading.',
  'map.hintLast': 'That one gave you the count too.',
  'map.hintFree': 'A hint costs nothing.',
  'map.dunnoHint': 'I don’t know · hint {{n}}/{{max}}',

  'map.verdictPerfect': 'Perfect',
  'map.verdictClose': 'Nearly there',
  'map.verdictAgain': 'Worth another look',
  'map.verdictLine':
    'Of the {{core}} files that had to change, <b>{{found}} found</b> · <b>{{missed}} missed</b> '
    + '· picked but not needed <b>{{wrong}}</b> · bonus <b>{{bonus}}</b>',
  'map.meterLabel': '{{found}} of {{core}} found, {{missed}} missed',
  'map.guidePerfect': 'Perfect. You hit every band.',
  'map.guideClose': 'Nearly there. The ones you missed are blinking.',
  'map.guideMissed': 'Start with the files you missed. That is today’s point.',
  'map.liveFlow': 'Graded. You placed {{found}} of the {{total}} steps on the path.',
  'map.liveDirection': 'Graded. You got {{found}} of {{total}} questions right.',
  'map.livePlacement': 'Graded. You found {{found}} of the {{total}} files that had to change.',

  'map.groupMissed': 'Files you missed',
  'map.groupMissedSub': 'This is the point of today’s question — they blink on the map',
  'map.groupFound': 'Files you picked correctly',
  'map.groupWrong': 'Files that did not need changing',
  'map.groupWrongSub': 'Common wrong picks and why',
  'map.groupSec': 'Files that changed alongside',
  'map.groupSecSub': 'Picking them or not costs nothing',
  'map.noChange': 'no change',

  'map.commitSource': 'Where the answer comes from',
  'map.commitNote': '— a real commit, not an LLM grading you.',

  'map.appealIdle': 'I think this counts too',
  'map.appealDone': '“This counts too” filed',
  'map.appealNote':
    'The answer key is one commit, so a wider answer may exist. When enough people say the '
    + 'same thing, this question’s key gets wider.',

  'map.flowPathLabel': 'The path you built',
  'map.flowDeckLabel': 'Cards left',
  'map.flowEmpty': 'No card placed yet. Pick them below in the order the flow passes through.',
  'map.flowDeckEmpty': 'No cards left.',
  'map.flowNote': 'The deck holds files off the path. You do not have to place them all.',
  'map.flowSeat': '{{seat}} of {{total}}',
  'map.flowUp': 'up',
  'map.flowDown': 'down',
  'map.flowMove': '{{name}} — {{seat}}. Move {{dir}}',
  'map.flowDrop': '{{name}} — take off the path',
  'map.flowAdd': '{{name}} — place at {{seat}} on the path',
  'map.flowRemove': 'Remove',

  'map.directionLeft': '{{n}} questions left. Answer them all to grade.',
  'map.directionDone': 'Reading them off the map is fine — this is not recall.',
};
