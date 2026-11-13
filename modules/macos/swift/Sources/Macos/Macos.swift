import Foundation
#if canImport(AppKit)
import AppKit
#endif

// The implementation of package macos on Apple's platforms. Implement the
// methods one at a time: each says it is unsupported until it does.

func makeGreeter() throws -> any Greeter { NativeGreeter() }

final class NativeGreeter: Greeter {
    func greet(name: String) throws -> String {
        throw NativeError.unsupported
    }
}
