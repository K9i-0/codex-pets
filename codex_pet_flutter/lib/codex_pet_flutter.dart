import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

const int codexPetColumns = 8;
const int codexPetRows = 9;
const int codexPetCellWidth = 192;
const int codexPetCellHeight = 208;
const Size codexPetCellSize = Size(192, 208);

enum CodexPetAnimation {
  idle('idle', row: 0, frames: 6, frameDuration: Duration(milliseconds: 160)),
  runningRight(
    'running-right',
    row: 1,
    frames: 8,
    frameDuration: Duration(milliseconds: 105),
  ),
  runningLeft(
    'running-left',
    row: 2,
    frames: 8,
    frameDuration: Duration(milliseconds: 105),
  ),
  waving(
    'waving',
    row: 3,
    frames: 4,
    frameDuration: Duration(milliseconds: 150),
  ),
  jumping(
    'jumping',
    row: 4,
    frames: 5,
    frameDuration: Duration(milliseconds: 130),
  ),
  failed(
    'failed',
    row: 5,
    frames: 8,
    frameDuration: Duration(milliseconds: 130),
  ),
  waiting(
    'waiting',
    row: 6,
    frames: 6,
    frameDuration: Duration(milliseconds: 150),
  ),
  running(
    'running',
    row: 7,
    frames: 6,
    frameDuration: Duration(milliseconds: 105),
  ),
  review(
    'review',
    row: 8,
    frames: 6,
    frameDuration: Duration(milliseconds: 150),
  );

  const CodexPetAnimation(
    this.id, {
    required this.row,
    required this.frames,
    required this.frameDuration,
  });

  final String id;
  final int row;
  final int frames;
  final Duration frameDuration;

  Duration get duration => frameDuration * frames;
}

enum CodexPetBubblePlacement {
  topStart,
  topEnd,
  bottomStart,
  bottomEnd;

  bool get isAbovePet {
    return this == CodexPetBubblePlacement.topStart ||
        this == CodexPetBubblePlacement.topEnd;
  }

  bool get isEnd {
    return this == CodexPetBubblePlacement.topEnd ||
        this == CodexPetBubblePlacement.bottomEnd;
  }
}

enum CodexPetBubbleTone {
  info(animation: CodexPetAnimation.idle, accentColor: Color(0xff3b82f6)),
  running(animation: CodexPetAnimation.running, accentColor: Color(0xff22c55e)),
  waiting(animation: CodexPetAnimation.waiting, accentColor: Color(0xfff59e0b)),
  review(animation: CodexPetAnimation.review, accentColor: Color(0xff8b5cf6)),
  failed(animation: CodexPetAnimation.failed, accentColor: Color(0xffef4444));

  const CodexPetBubbleTone({
    required this.animation,
    required this.accentColor,
  });

  final CodexPetAnimation animation;
  final Color accentColor;
}

@immutable
class CodexPetBubbleStyle {
  const CodexPetBubbleStyle({
    this.backgroundColor = const Color(0xf7ffffff),
    this.borderColor = const Color(0x26000000),
    this.shadowColor = const Color(0x26000000),
    this.padding = const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    this.borderRadius = 18,
    this.tailSize = const Size(16, 8),
    this.titleStyle = const TextStyle(
      color: Color(0xff161616),
      fontSize: 13,
      height: 1.2,
      fontWeight: FontWeight.w700,
    ),
    this.messageStyle = const TextStyle(
      color: Color(0xff4b5563),
      fontSize: 12,
      height: 1.3,
      fontWeight: FontWeight.w500,
    ),
  });

  final Color backgroundColor;
  final Color borderColor;
  final Color shadowColor;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final Size tailSize;
  final TextStyle titleStyle;
  final TextStyle messageStyle;
}

class CodexPetBubble extends StatelessWidget {
  const CodexPetBubble({
    super.key,
    this.title,
    required this.message,
    this.tone = CodexPetBubbleTone.info,
    this.placement = CodexPetBubblePlacement.topEnd,
    this.maxWidth = 276,
    this.showTail = true,
    this.style = const CodexPetBubbleStyle(),
    this.onTap,
  });

  factory CodexPetBubble.fromConfig({
    Key? key,
    required CodexPetBubbleConfig config,
  }) {
    return CodexPetBubble(
      key: key,
      title: config.title,
      message: config.message,
      tone: config.tone,
      placement: config.placement,
      maxWidth: config.maxWidth,
      showTail: config.showTail,
      style: config.style,
      onTap: config.onTap,
    );
  }

  final String? title;
  final String message;
  final CodexPetBubbleTone tone;
  final CodexPetBubblePlacement placement;
  final double maxWidth;
  final bool showTail;
  final CodexPetBubbleStyle style;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final title = this.title;
    final tailSize = showTail ? style.tailSize : Size.zero;
    final tailOnTop = !placement.isAbovePet;
    final contentPadding = style.padding.add(
      EdgeInsets.only(
        top: tailOnTop ? tailSize.height : 0,
        bottom: tailOnTop ? 0 : tailSize.height,
      ),
    );
    final child = ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: CustomPaint(
        painter: _CodexPetBubblePainter(
          placement: placement,
          style: style,
          tone: tone,
          showTail: showTail,
        ),
        child: Padding(
          padding: contentPadding,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 5),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: tone.accentColor,
                    shape: BoxShape.circle,
                  ),
                  child: const SizedBox.square(dimension: 8),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (title != null && title.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: style.titleStyle,
                        ),
                      ),
                    Text(
                      message,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: style.messageStyle,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (onTap == null) return child;
    return GestureDetector(onTap: onTap, child: child);
  }
}

@immutable
class CodexPetBubbleConfig {
  const CodexPetBubbleConfig({
    required this.message,
    this.title,
    this.tone = CodexPetBubbleTone.info,
    this.placement = CodexPetBubblePlacement.topEnd,
    this.maxWidth = 276,
    this.gap = 4,
    this.showTail = true,
    this.style = const CodexPetBubbleStyle(),
    this.onTap,
  });

  final String? title;
  final String message;
  final CodexPetBubbleTone tone;
  final CodexPetBubblePlacement placement;
  final double maxWidth;
  final double gap;
  final bool showTail;
  final CodexPetBubbleStyle style;
  final VoidCallback? onTap;
}

@immutable
class CodexPetManifest {
  const CodexPetManifest({
    required this.id,
    required this.displayName,
    required this.description,
    required this.spritesheetPath,
  });

  factory CodexPetManifest.fromJson(Map<String, Object?> json) {
    final id = json['id'] as String?;
    final displayName = json['displayName'] as String?;
    final description = json['description'] as String?;
    final spritesheetPath = json['spritesheetPath'] as String?;
    if (id == null || id.isEmpty) {
      throw const FormatException('Codex pet manifest is missing id.');
    }
    if (displayName == null || displayName.isEmpty) {
      throw const FormatException('Codex pet manifest is missing displayName.');
    }
    if (description == null || description.isEmpty) {
      throw const FormatException('Codex pet manifest is missing description.');
    }
    if (spritesheetPath == null || spritesheetPath.isEmpty) {
      throw const FormatException(
        'Codex pet manifest is missing spritesheetPath.',
      );
    }
    return CodexPetManifest(
      id: id,
      displayName: displayName,
      description: description,
      spritesheetPath: spritesheetPath,
    );
  }

  factory CodexPetManifest.fromJsonString(String source) {
    final decoded = jsonDecode(source);
    if (decoded is! Map<String, Object?>) {
      throw const FormatException('Codex pet manifest must be a JSON object.');
    }
    return CodexPetManifest.fromJson(decoded);
  }

  final String id;
  final String displayName;
  final String description;
  final String spritesheetPath;
}

class CodexPetView extends StatefulWidget {
  const CodexPetView.asset({
    super.key,
    required this.manifestPath,
    this.animation = CodexPetAnimation.idle,
    this.size,
    this.width,
    this.height,
    this.playing = true,
    this.frameDuration,
    this.fit = BoxFit.contain,
    this.filterQuality = FilterQuality.none,
    this.bundle,
    this.errorBuilder,
  });

  final String manifestPath;
  final CodexPetAnimation animation;
  final double? size;
  final double? width;
  final double? height;
  final bool playing;
  final Duration? frameDuration;
  final BoxFit fit;
  final FilterQuality filterQuality;
  final AssetBundle? bundle;
  final Widget Function(BuildContext context, Object error)? errorBuilder;

  @override
  State<CodexPetView> createState() => _CodexPetViewState();
}

class CodexPetWithBubble extends StatelessWidget {
  const CodexPetWithBubble.asset({
    super.key,
    required this.manifestPath,
    this.animation = CodexPetAnimation.idle,
    this.size,
    this.width,
    this.height,
    this.playing = true,
    this.frameDuration,
    this.fit = BoxFit.contain,
    this.filterQuality = FilterQuality.none,
    this.bundle,
    this.errorBuilder,
    this.showBubble = true,
    this.bubble,
    this.customBubble,
    this.bubbleAffectsLayout = false,
  });

  final String manifestPath;
  final CodexPetAnimation animation;
  final double? size;
  final double? width;
  final double? height;
  final bool playing;
  final Duration? frameDuration;
  final BoxFit fit;
  final FilterQuality filterQuality;
  final AssetBundle? bundle;
  final Widget Function(BuildContext context, Object error)? errorBuilder;
  final bool showBubble;
  final CodexPetBubbleConfig? bubble;
  final Widget? customBubble;
  final bool bubbleAffectsLayout;

  @override
  Widget build(BuildContext context) {
    final petWidth = width ?? size ?? codexPetCellWidth.toDouble();
    final petHeight = height ?? size ?? codexPetCellHeight.toDouble();
    final pet = CodexPetView.asset(
      manifestPath: manifestPath,
      animation: animation,
      size: size,
      width: width,
      height: height,
      playing: playing,
      frameDuration: frameDuration,
      fit: fit,
      filterQuality: filterQuality,
      bundle: bundle,
      errorBuilder: errorBuilder,
    );
    final bubbleWidget = _buildBubble();
    if (bubbleWidget == null) return pet;

    final placement = bubble?.placement ?? CodexPetBubblePlacement.topEnd;
    final gap = bubble?.gap ?? 4;

    if (!bubbleAffectsLayout) {
      return SizedBox(
        width: petWidth,
        height: petHeight,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(child: pet),
            _positionBubble(
              bubble: bubbleWidget,
              placement: placement,
              gap: gap,
              petWidth: petWidth,
              petHeight: petHeight,
            ),
          ],
        ),
      );
    }

    final children = placement.isAbovePet
        ? <Widget>[bubbleWidget, SizedBox(height: gap), pet]
        : <Widget>[pet, SizedBox(height: gap), bubbleWidget];

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: placement.isEnd
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: children,
    );
  }

  Widget? _buildBubble() {
    if (!showBubble) return null;
    if (customBubble != null) return customBubble;
    final config = bubble;
    if (config == null || config.message.isEmpty) return null;
    return CodexPetBubble.fromConfig(config: config);
  }

  Positioned _positionBubble({
    required Widget bubble,
    required CodexPetBubblePlacement placement,
    required double gap,
    required double petWidth,
    required double petHeight,
  }) {
    return Positioned(
      left: placement.isEnd ? null : 0,
      right: placement.isEnd ? 0 : null,
      top: placement.isAbovePet ? null : petHeight + gap,
      bottom: placement.isAbovePet ? petHeight + gap : null,
      child: bubble,
    );
  }
}

class _CodexPetViewState extends State<CodexPetView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Future<_LoadedCodexPet>? _pet;
  AssetBundle? _activeBundle;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
    _configureController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final bundle = widget.bundle ?? DefaultAssetBundle.of(context);
    if (_activeBundle != bundle || _pet == null) {
      _activeBundle = bundle;
      _pet = _loadPet(bundle);
    }
  }

  @override
  void didUpdateWidget(CodexPetView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.animation != widget.animation ||
        oldWidget.frameDuration != widget.frameDuration ||
        oldWidget.playing != widget.playing) {
      _configureController();
    }
    if (oldWidget.manifestPath != widget.manifestPath ||
        oldWidget.bundle != widget.bundle) {
      final bundle = widget.bundle ?? DefaultAssetBundle.of(context);
      _activeBundle = bundle;
      _pet = _loadPet(bundle);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _configureController() {
    final frameDuration =
        widget.frameDuration ?? widget.animation.frameDuration;
    _controller.duration = frameDuration * widget.animation.frames;
    if (widget.playing) {
      _controller.repeat();
    } else {
      _controller.stop();
      _controller.value = 0;
    }
  }

  Future<_LoadedCodexPet> _loadPet(AssetBundle bundle) async {
    final manifestSource = await bundle.loadString(widget.manifestPath);
    final manifest = CodexPetManifest.fromJsonString(manifestSource);
    final spritesheetPath = _resolveAssetPath(
      widget.manifestPath,
      manifest.spritesheetPath,
    );
    final bytes = await bundle.load(spritesheetPath);
    final codec = await ui.instantiateImageCodec(bytes.buffer.asUint8List());
    final frame = await codec.getNextFrame();
    return _LoadedCodexPet(manifest: manifest, spritesheet: frame.image);
  }

  @override
  Widget build(BuildContext context) {
    final width = widget.width ?? widget.size ?? codexPetCellWidth.toDouble();
    final height =
        widget.height ?? widget.size ?? codexPetCellHeight.toDouble();

    return SizedBox(
      width: width,
      height: height,
      child: FutureBuilder<_LoadedCodexPet>(
        future: _pet,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return widget.errorBuilder?.call(context, snapshot.error!) ??
                const SizedBox.shrink();
          }
          final pet = snapshot.data;
          if (pet == null) return const SizedBox.shrink();
          return AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              final frame =
                  (_controller.value * widget.animation.frames).floor() %
                  widget.animation.frames;
              return CustomPaint(
                painter: _CodexPetPainter(
                  spritesheet: pet.spritesheet,
                  animation: widget.animation,
                  frame: frame,
                  fit: widget.fit,
                  filterQuality: widget.filterQuality,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _LoadedCodexPet {
  const _LoadedCodexPet({required this.manifest, required this.spritesheet});

  final CodexPetManifest manifest;
  final ui.Image spritesheet;
}

class _CodexPetPainter extends CustomPainter {
  const _CodexPetPainter({
    required this.spritesheet,
    required this.animation,
    required this.frame,
    required this.fit,
    required this.filterQuality,
  });

  final ui.Image spritesheet;
  final CodexPetAnimation animation;
  final int frame;
  final BoxFit fit;
  final FilterQuality filterQuality;

  @override
  void paint(Canvas canvas, Size size) {
    final source = Rect.fromLTWH(
      frame * codexPetCellWidth.toDouble(),
      animation.row * codexPetCellHeight.toDouble(),
      codexPetCellWidth.toDouble(),
      codexPetCellHeight.toDouble(),
    );
    final fitted = applyBoxFit(fit, codexPetCellSize, size);
    final destination = Alignment.center.inscribe(
      fitted.destination,
      Offset.zero & size,
    );
    final paint = Paint()
      ..isAntiAlias = false
      ..filterQuality = filterQuality;
    canvas.drawImageRect(spritesheet, source, destination, paint);
  }

  @override
  bool shouldRepaint(_CodexPetPainter oldDelegate) {
    return oldDelegate.spritesheet != spritesheet ||
        oldDelegate.animation != animation ||
        oldDelegate.frame != frame ||
        oldDelegate.fit != fit ||
        oldDelegate.filterQuality != filterQuality;
  }
}

class _CodexPetBubblePainter extends CustomPainter {
  const _CodexPetBubblePainter({
    required this.placement,
    required this.style,
    required this.tone,
    required this.showTail,
  });

  final CodexPetBubblePlacement placement;
  final CodexPetBubbleStyle style;
  final CodexPetBubbleTone tone;
  final bool showTail;

  @override
  void paint(Canvas canvas, Size size) {
    final path = _bubblePath(size);

    canvas.drawShadow(path, style.shadowColor, 8, true);
    canvas.drawPath(path, Paint()..color = style.backgroundColor);
    canvas.drawPath(
      path,
      Paint()
        ..color = style.borderColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
  }

  Path _bubblePath(Size size) {
    final tailHeight = showTail ? style.tailSize.height : 0.0;
    final tailOnTop = !placement.isAbovePet;
    final rect = Rect.fromLTWH(
      0,
      tailOnTop ? tailHeight : 0,
      size.width,
      size.height - tailHeight,
    );
    final radius = Radius.circular(style.borderRadius);
    final bodyPath = Path()..addRRect(RRect.fromRectAndRadius(rect, radius));

    if (!showTail || style.tailSize.width <= 0 || tailHeight <= 0) {
      return bodyPath;
    }

    final centerX = placement.isEnd
        ? size.width - style.borderRadius - style.tailSize.width
        : style.borderRadius + style.tailSize.width;
    final halfTail = style.tailSize.width / 2;
    final overlap = 1.0;
    final tailPath = Path();
    if (tailOnTop) {
      tailPath
        ..moveTo(centerX - halfTail, rect.top + overlap)
        ..lineTo(centerX, 0)
        ..lineTo(centerX + halfTail, rect.top + overlap)
        ..close();
    } else {
      tailPath
        ..moveTo(centerX - halfTail, rect.bottom - overlap)
        ..lineTo(centerX, size.height)
        ..lineTo(centerX + halfTail, rect.bottom - overlap)
        ..close();
    }

    return Path.combine(PathOperation.union, bodyPath, tailPath);
  }

  @override
  bool shouldRepaint(_CodexPetBubblePainter oldDelegate) {
    return oldDelegate.placement != placement ||
        oldDelegate.style != style ||
        oldDelegate.tone != tone ||
        oldDelegate.showTail != showTail;
  }
}

String _resolveAssetPath(String manifestPath, String spritesheetPath) {
  final normalized = spritesheetPath.replaceFirst(RegExp(r'^\./'), '');
  if (normalized.startsWith('assets/') || normalized.startsWith('packages/')) {
    return normalized;
  }
  final slash = manifestPath.lastIndexOf('/');
  if (slash == -1) return normalized;
  return '${manifestPath.substring(0, slash + 1)}$normalized';
}
