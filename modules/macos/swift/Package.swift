// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Macos",
    platforms: [.macOS(.v13)],
    products: [.library(name: "Macos", type: .dynamic, targets: ["Macos"])],
    dependencies: [],
    targets: [
        .target(name: "Macos"),
    ],
    swiftLanguageModes: [.v5]
)
