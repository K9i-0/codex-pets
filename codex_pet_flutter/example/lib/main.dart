import 'dart:math' as math;

import 'package:codex_pet_flutter/codex_pet_flutter.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const CodexPetExampleApp());
}

class CodexPetExampleApp extends StatelessWidget {
  const CodexPetExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Codex Pet Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xff2f6f5e),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xfff7f3ea),
      ),
      home: const PetExampleScreen(),
    );
  }
}

class ExamplePet {
  const ExamplePet({required this.id, required this.name});

  final String id;
  final String name;

  String get manifestPath => 'assets/pets/$id/pet.json';
}

const List<ExamplePet> _pets = [
  ExamplePet(id: 'yametaro', name: 'Yametaro'),
  ExamplePet(id: 'chikuwa', name: 'Chikuwa'),
  ExamplePet(id: 'yumemin', name: 'Yumemin'),
  ExamplePet(id: 'sobaya', name: 'Sobaya'),
  ExamplePet(id: 'tako-san', name: 'tako-san'),
];

class PetExampleScreen extends StatefulWidget {
  const PetExampleScreen({super.key});

  @override
  State<PetExampleScreen> createState() => _PetExampleScreenState();
}

class _PetExampleScreenState extends State<PetExampleScreen> {
  static const double _petSize = 172;
  static const double _bubbleMaxWidth = 276;

  ExamplePet _selectedPet = _pets.first;
  Offset _petPosition = const Offset(0.5, 0.62);
  CodexPetAnimation _animation = CodexPetAnimation.idle;
  CodexPetAnimation _restingAnimation = CodexPetAnimation.idle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Codex Pet Flutter'),
        backgroundColor: theme.colorScheme.inversePrimary,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: _buildPlayground(theme)),
              const SizedBox(height: 16),
              _buildPetPicker(),
              const SizedBox(height: 12),
              _buildAnimationPicker(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlayground(ThemeData theme) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxLeft = math.max(0.0, constraints.maxWidth - _petSize);
        final maxTop = math.max(0.0, constraints.maxHeight - _petSize);
        final left = _petPosition.dx * maxLeft;
        final top = _petPosition.dy * maxTop;

        return DecoratedBox(
          key: const ValueKey('pet-playground'),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xffd9d1c2)),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned.fill(
                child: CustomPaint(painter: _StagePainter(theme.colorScheme)),
              ),
              Positioned(
                left: left,
                top: top,
                child: GestureDetector(
                  key: const ValueKey('pet-drag-target'),
                  behavior: HitTestBehavior.opaque,
                  onPanUpdate: (details) {
                    setState(() {
                      final nextLeft = (left + details.delta.dx).clamp(
                        0.0,
                        maxLeft,
                      );
                      final nextTop = (top + details.delta.dy).clamp(
                        0.0,
                        maxTop,
                      );
                      _petPosition = Offset(
                        maxLeft == 0 ? 0 : nextLeft / maxLeft,
                        maxTop == 0 ? 0 : nextTop / maxTop,
                      );
                      _animation = _animationForDrag(details.delta);
                    });
                  },
                  onPanEnd: (_) =>
                      setState(() => _animation = _restingAnimation),
                  onPanCancel: () =>
                      setState(() => _animation = _restingAnimation),
                  child: CodexPetWithBubble.asset(
                    key: ValueKey(_selectedPet.id),
                    manifestPath: _selectedPet.manifestPath,
                    animation: _animation,
                    size: _petSize,
                    bubble: CodexPetBubbleConfig(
                      title: _selectedPet.name,
                      message: _bubbleMessage,
                      tone: _bubbleTone,
                      maxWidth: _bubbleMaxWidth,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPetPicker() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: [
        for (final pet in _pets)
          ChoiceChip(
            label: Text(pet.name),
            selected: _selectedPet == pet,
            onSelected: (_) => setState(() => _selectedPet = pet),
          ),
      ],
    );
  }

  Widget _buildAnimationPicker() {
    const restingAnimations = [
      CodexPetAnimation.idle,
      CodexPetAnimation.waving,
      CodexPetAnimation.waiting,
      CodexPetAnimation.review,
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: [
        for (final animation in restingAnimations)
          ChoiceChip(
            label: Text(animation.id),
            selected: _restingAnimation == animation,
            onSelected: (_) {
              setState(() {
                _restingAnimation = animation;
                _animation = animation;
              });
            },
          ),
      ],
    );
  }

  CodexPetAnimation _animationForDrag(Offset delta) {
    if (delta.dx.abs() < 0.5 && delta.dy.abs() < 0.5) return _animation;
    if (delta.dx.abs() >= delta.dy.abs()) {
      return delta.dx >= 0
          ? CodexPetAnimation.runningRight
          : CodexPetAnimation.runningLeft;
    }
    return CodexPetAnimation.running;
  }

  CodexPetBubbleTone get _bubbleTone {
    return switch (_animation) {
      CodexPetAnimation.runningRight ||
      CodexPetAnimation.runningLeft ||
      CodexPetAnimation.running => CodexPetBubbleTone.running,
      CodexPetAnimation.waiting => CodexPetBubbleTone.waiting,
      CodexPetAnimation.review => CodexPetBubbleTone.review,
      CodexPetAnimation.failed => CodexPetBubbleTone.failed,
      _ => CodexPetBubbleTone.info,
    };
  }

  String get _bubbleMessage {
    return switch (_animation) {
      CodexPetAnimation.runningRight => 'Running right',
      CodexPetAnimation.runningLeft => 'Running left',
      CodexPetAnimation.running => 'Running',
      CodexPetAnimation.waving => 'Hello',
      CodexPetAnimation.waiting => 'Needs input',
      CodexPetAnimation.review => 'Ready for review',
      CodexPetAnimation.failed => 'Blocked',
      CodexPetAnimation.jumping => 'Jumping',
      CodexPetAnimation.idle => 'Drag me around',
    };
  }
}

class _StagePainter extends CustomPainter {
  const _StagePainter(this.colors);

  final ColorScheme colors;

  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = colors.outlineVariant.withValues(alpha: 0.32)
      ..strokeWidth = 1;
    const grid = 32.0;
    for (double x = grid; x < size.width; x += grid) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = grid; y < size.height; y += grid) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final floorPaint = Paint()
      ..color = colors.primaryContainer.withValues(alpha: 0.45);
    final floor = Rect.fromLTWH(0, size.height - 42, size.width, 42);
    canvas.drawRect(floor, floorPaint);
  }

  @override
  bool shouldRepaint(_StagePainter oldDelegate) => oldDelegate.colors != colors;
}
