// Package general is a native module: its interfaces are implemented in
// Swift, Rust or Zig, in the directory of the language (see AGENTS.md).
package general

// Greeter greets.
//
//mygo:native
type Greeter interface {
	// Greet returns a greeting for name.
	Greet(name string) (string, error)
}
