// 生成插件图标：蓝色渐变圆 + 白色"译"字，与划词角标同款风格。
// 用法：swift gen-icon.swift（在 icons/ 目录下运行，输出 icon{16,32,48,128}.png）
import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

func drawIcon(size: Int, to path: String) {
    let s = CGFloat(size)
    let ctx = CGContext(
        data: nil, width: size, height: size,
        bitsPerComponent: 8, bytesPerRow: 0,
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!

    // 圆形底 + 垂直渐变（顶 #5a8cff → 底 #3565e0）
    let circle = CGRect(x: s * 0.03, y: s * 0.03, width: s * 0.94, height: s * 0.94)
    ctx.saveGState()
    ctx.addEllipse(in: circle)
    ctx.clip()
    let gradient = CGGradient(
        colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
        colors: [
            CGColor(red: 0x5a / 255.0, green: 0x8c / 255.0, blue: 1.0, alpha: 1),
            CGColor(red: 0x35 / 255.0, green: 0x65 / 255.0, blue: 0xe0 / 255.0, alpha: 1),
        ] as CFArray,
        locations: [0, 1]
    )!
    ctx.drawLinearGradient(
        gradient,
        start: CGPoint(x: s / 2, y: s), end: CGPoint(x: s / 2, y: 0),
        options: []
    )
    ctx.restoreGState()

    // 白色"译"字居中
    let font = CTFontCreateWithName("PingFangSC-Semibold" as CFString, s * 0.56, nil)
    let attrs: [CFString: Any] = [
        kCTFontAttributeName: font,
        kCTForegroundColorAttributeName: CGColor(red: 1, green: 1, blue: 1, alpha: 1),
    ]
    let line = CTLineCreateWithAttributedString(
        CFAttributedStringCreate(nil, "译" as CFString, attrs as CFDictionary)!
    )
    let bounds = CTLineGetBoundsWithOptions(line, .useGlyphPathBounds)
    ctx.textPosition = CGPoint(
        x: (s - bounds.width) / 2 - bounds.minX,
        y: (s - bounds.height) / 2 - bounds.minY
    )
    CTLineDraw(line, ctx)

    let image = ctx.makeImage()!
    let dest = CGImageDestinationCreateWithURL(
        URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil
    )!
    CGImageDestinationAddImage(dest, image, nil)
    CGImageDestinationFinalize(dest)
}

for size in [16, 32, 48, 128] {
    drawIcon(size: size, to: "icon\(size).png")
    print("icon\(size).png")
}
