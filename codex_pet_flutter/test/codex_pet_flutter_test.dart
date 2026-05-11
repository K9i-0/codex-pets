import 'package:codex_pet_flutter/codex_pet_flutter.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses a Codex pet manifest', () {
    final manifest = CodexPetManifest.fromJsonString('''
{
  "id": "yametaro",
  "displayName": "Yametaro",
  "description": "A tiny chibi coder.",
  "spritesheetPath": "spritesheet.webp"
}
''');

    expect(manifest.id, 'yametaro');
    expect(manifest.displayName, 'Yametaro');
    expect(manifest.spritesheetPath, 'spritesheet.webp');
  });

  test('keeps the Codex pet atlas geometry', () {
    expect(codexPetColumns, 8);
    expect(codexPetRows, 9);
    expect(codexPetCellWidth, 192);
    expect(codexPetCellHeight, 208);
    expect(CodexPetAnimation.runningRight.row, 1);
    expect(CodexPetAnimation.runningRight.frames, 8);
  });

  test('maps bubble tones to Codex pet states', () {
    expect(CodexPetBubbleTone.info.animation, CodexPetAnimation.idle);
    expect(CodexPetBubbleTone.running.animation, CodexPetAnimation.running);
    expect(CodexPetBubbleTone.waiting.animation, CodexPetAnimation.waiting);
    expect(CodexPetBubbleTone.review.animation, CodexPetAnimation.review);
    expect(CodexPetBubbleTone.failed.animation, CodexPetAnimation.failed);
  });

  testWidgets('renders a Codex pet bubble', (tester) async {
    await tester.pumpWidget(
      const Directionality(
        textDirection: TextDirection.ltr,
        child: CodexPetBubble(
          title: 'Yametaro',
          message: 'Ready for review',
          tone: CodexPetBubbleTone.review,
        ),
      ),
    );

    expect(find.text('Yametaro'), findsOneWidget);
    expect(find.text('Ready for review'), findsOneWidget);
  });
}
