# codex_pet_flutter

Flutter widgets for rendering Codex pet spritesheets.

## Features

- Parses `pet.json` manifests.
- Renders a `1536x1872` Codex pet atlas as `192x208` animation cells.
- Includes built-in animation row metadata for idle, running, waving, jumping,
  failed, waiting, running, and review states.
- Provides a Codex-style speech bubble and a convenience widget that composes
  the bubble with the pet.

## Usage

Add a pet folder to your Flutter app assets:

```text
assets/pets/yametaro/
  pet.json
  spritesheet.webp
```

Register both files in the app `pubspec.yaml`, then render the pet:

```dart
CodexPetView.asset(
  manifestPath: 'assets/pets/yametaro/pet.json',
  animation: CodexPetAnimation.idle,
  size: 96,
)
```

Render a pet with a Codex-style bubble:

```dart
CodexPetWithBubble.asset(
  manifestPath: 'assets/pets/yametaro/pet.json',
  animation: CodexPetAnimation.review,
  size: 96,
  showBubble: true,
  bubble: const CodexPetBubbleConfig(
    title: 'Yametaro',
    message: 'Ready for review',
    tone: CodexPetBubbleTone.review,
  ),
)
```

By default the bubble is painted outside the pet bounds, so it does not shrink
drag or layout space. Set `bubbleAffectsLayout: true` when the bubble should be
part of the widget's measured layout.

`CodexPetBubbleTone` maps common Codex App status tones to pet animation
states: `info` -> `idle`, `running` -> `running`, `waiting` -> `waiting`,
`review` -> `review`, and `failed` -> `failed`.

See `example/` for a runnable Flutter app with pet switching, dragging, and
bubble states.
