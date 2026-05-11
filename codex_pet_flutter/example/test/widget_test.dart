import 'package:codex_pet_flutter/codex_pet_flutter.dart';
import 'package:example/main.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows and interacts with the Codex pet example', (tester) async {
    await tester.pumpWidget(const CodexPetExampleApp());

    expect(find.text('Codex Pet Flutter'), findsWidgets);
    expect(find.text('Yametaro'), findsWidgets);
    expect(find.text('Chikuwa'), findsOneWidget);
    expect(find.text('idle'), findsOneWidget);
    expect(find.text('review'), findsOneWidget);
    expect(find.text('Drag me around'), findsOneWidget);

    await tester.tap(find.text('Chikuwa'));
    await tester.pump();
    await tester.drag(
      find.byKey(const ValueKey('pet-drag-target')),
      const Offset(80, 0),
      warnIfMissed: false,
    );
    await tester.pump();

    await tester.drag(
      find.byKey(const ValueKey('pet-drag-target')),
      const Offset(1000, 0),
      warnIfMissed: false,
    );
    await tester.pump();

    final playgroundRect = tester.getRect(
      find.byKey(const ValueKey('pet-playground')),
    );
    final petRect = tester.getRect(find.byType(CodexPetView));
    expect(playgroundRect.right - petRect.right, lessThanOrEqualTo(1));
  });
}
